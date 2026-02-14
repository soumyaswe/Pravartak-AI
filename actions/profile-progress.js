"use server";

import { db } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

/**
 * Calculate profile completion based on actual user data
 * Returns detailed breakdown of what's completed and what's missing
 */
export async function calculateProfileProgress() {
  try {
    console.log('Starting calculateProfileProgress...');
    
    // Test database connection
    try {
      await db.$connect();
      console.log('Database connection successful');
    } catch (dbConnError) {
      console.error('Database connection failed:', dbConnError);
    }
    
    const user = await getAuthenticatedUser();
    
    if (!user) {
      console.error("No user found in calculateProfileProgress");
      throw new Error("User not authenticated");
    }

    console.log('Calculating profile progress for user:', user.id);

    // Fetch all related data in parallel with individual error handling
    let profile = null;
    let resumeCount = 0;
    let coverLetterCount = 0;
    let mockInterviewCount = 0;
    let assessmentCount = 0;

    try {
      [profile, resumeCount, coverLetterCount, mockInterviewCount, assessmentCount] = await Promise.all([
        db.userProfile.findUnique({
          where: { userId: user.id },
        }).catch(err => {
          console.error("Error fetching user profile:", err);
          return null;
        }),
        db.resume.count({ where: { userId: user.id } }).catch(err => {
          console.error("Error counting resumes:", err);
          return 0;
        }),
        db.coverLetter.count({ where: { userId: user.id } }).catch(err => {
          console.error("Error counting cover letters:", err);
          return 0;
        }),
        db.mockInterview.count({ where: { userId: user.id } }).catch(err => {
          console.error("Error counting mock interviews:", err);
          return 0;
        }),
        db.assessment.count({ where: { userId: user.id } }).catch(err => {
          console.error("Error counting assessments:", err);
          return 0;
        }),
      ]);
    } catch (dbError) {
      console.error("Database query error:", dbError);
      // Continue with default values
    }
    
    console.log('Fetched data:', { 
      hasProfile: !!profile, 
      resumeCount, 
      coverLetterCount, 
      mockInterviewCount, 
      assessmentCount 
    });

    // Define all checkable fields with their completion criteria
    const progressChecks = {
      // Basic Information (from User table)
      basicInfo: {
        completed: !!(user.name && user.email),
        weight: 10,
        label: "Name and Email",
        category: "Basic Information"
      },
      profileImage: {
        completed: !!user.imageUrl,
        weight: 5,
        label: "Profile Picture",
        category: "Basic Information"
      },
      phone: {
        completed: !!user.phone,
        weight: 5,
        label: "Phone Number",
        category: "Contact Details"
      },
      location: {
        completed: !!user.location,
        weight: 5,
        label: "Location",
        category: "Contact Details"
      },
      bio: {
        completed: !!(user.bio && user.bio.length >= 50),
        weight: 10,
        label: "Professional Bio (min 50 chars)",
        category: "Professional Details"
      },
      industry: {
        completed: !!user.industry,
        weight: 10,
        label: "Industry/Field",
        category: "Professional Details"
      },
      experience: {
        completed: user.experience != null && user.experience >= 0,
        weight: 5,
        label: "Years of Experience",
        category: "Professional Details"
      },
      skills: {
        completed: !!(user.skills && user.skills.length >= 3),
        weight: 10,
        label: "Skills (min 3)",
        category: "Professional Details"
      },
      linkedIn: {
        completed: !!user.linkedIn,
        weight: 5,
        label: "LinkedIn Profile",
        category: "Social Links"
      },
      portfolio: {
        completed: !!user.portfolio,
        weight: 5,
        label: "Portfolio/Website",
        category: "Social Links"
      },
      
      // Extended Profile (from UserProfile table)
      workExperience: {
        completed: !!(profile?.experience && Array.isArray(profile.experience) && profile.experience.length > 0),
        weight: 10,
        label: "Work Experience",
        category: "Extended Profile"
      },
      education: {
        completed: !!(profile?.education && Array.isArray(profile.education) && profile.education.length > 0),
        weight: 10,
        label: "Education Details",
        category: "Extended Profile"
      },
      certifications: {
        completed: !!(profile?.certifications && Array.isArray(profile.certifications) && profile.certifications.length > 0),
        weight: 5,
        label: "Certifications",
        category: "Extended Profile"
      },
      projects: {
        completed: !!(profile?.projects && Array.isArray(profile.projects) && profile.projects.length > 0),
        weight: 5,
        label: "Projects",
        category: "Extended Profile"
      },
      
      // Documents & Activities
      resume: {
        completed: resumeCount > 0,
        weight: 15,
        label: "Created Resume",
        category: "Documents"
      },
      coverLetter: {
        completed: coverLetterCount > 0,
        weight: 10,
        label: "Created Cover Letter",
        category: "Documents"
      },
      mockInterview: {
        completed: mockInterviewCount > 0,
        weight: 10,
        label: "Completed Mock Interview",
        category: "Practice"
      },
      assessment: {
        completed: assessmentCount > 0,
        weight: 10,
        label: "Completed Assessment",
        category: "Practice"
      }
    };

    // Calculate total completion
    let totalWeight = 0;
    let completedWeight = 0;
    const completedItems = [];
    const missingItems = [];

    Object.entries(progressChecks).forEach(([key, check]) => {
      totalWeight += check.weight;
      if (check.completed) {
        completedWeight += check.weight;
        completedItems.push({ key, ...check });
      } else {
        missingItems.push({ key, ...check });
      }
    });

    const completionPercentage = Math.round((completedWeight / totalWeight) * 100);

    // Group items by category
    const itemsByCategory = {};
    [...completedItems, ...missingItems].forEach(item => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = {
          completed: [],
          missing: []
        };
      }
      if (item.completed) {
        itemsByCategory[item.category].completed.push(item);
      } else {
        itemsByCategory[item.category].missing.push(item);
      }
    });

    const result = {
      completionPercentage,
      completedWeight,
      totalWeight,
      completedCount: completedItems.length,
      totalCount: Object.keys(progressChecks).length,
      completedItems,
      missingItems,
      itemsByCategory,
      lastCalculated: new Date().toISOString()
    };

    console.log('Profile progress calculated:', {
      percentage: completionPercentage,
      completed: completedItems.length,
      total: Object.keys(progressChecks).length
    });

    // Update the profile with new flags (non-blocking)
    try {
      await updateProfileFlags(user.id, {
        hasBasicInfo: progressChecks.basicInfo.completed,
        hasExperience: progressChecks.workExperience.completed,
        hasEducation: progressChecks.education.completed,
        hasSkills: progressChecks.skills.completed,
        hasResume: progressChecks.resume.completed,
        hasCoverLetter: progressChecks.coverLetter.completed,
        hasCompletedMockInterview: progressChecks.mockInterview.completed,
      });
    } catch (flagError) {
      console.error("Error updating profile flags (non-critical):", flagError);
      // Don't fail the whole operation if flag update fails
    }

    return result;
  } catch (error) {
    console.error("Error calculating profile progress:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return default values instead of throwing
    return {
      completionPercentage: 0,
      completedWeight: 0,
      totalWeight: 145,
      completedCount: 0,
      totalCount: 18,
      completedItems: [],
      missingItems: [],
      itemsByCategory: {},
      lastCalculated: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Update profile flags in the database
 */
async function updateProfileFlags(userId, flags) {
  try {
    console.log('Attempting to update profile flags for user:', userId, flags);
    
    await db.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...flags,
        preferredLocations: [],
        preferredJobTypes: [],
        preferredIndustries: [],
      },
      update: flags,
    });
    
    console.log('Profile flags updated successfully for user:', userId);
  } catch (error) {
    console.error("Error updating profile flags:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    // Don't throw - this is non-critical
  }
}

/**
 * Get simple profile completion percentage
 * Used for quick checks without detailed breakdown
 */
export async function getProfileCompletionPercentage() {
  try {
    const progress = await calculateProfileProgress();
    return {
      percentage: progress.completionPercentage,
      completedCount: progress.completedCount,
      totalCount: progress.totalCount,
    };
  } catch (error) {
    console.error("Error getting profile completion:", error);
    return {
      percentage: 0,
      completedCount: 0,
      totalCount: 0,
    };
  }
}

/**
 * Get next recommended actions to improve profile
 */
export async function getProfileRecommendations() {
  try {
    const progress = await calculateProfileProgress();
    
    // Sort missing items by weight (highest priority first)
    const topRecommendations = progress.missingItems
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map(item => ({
        label: item.label,
        category: item.category,
        priority: item.weight >= 10 ? 'high' : item.weight >= 5 ? 'medium' : 'low',
      }));

    return {
      completionPercentage: progress.completionPercentage,
      recommendations: topRecommendations,
      missingItemsByCategory: progress.itemsByCategory,
    };
  } catch (error) {
    console.error("Error getting profile recommendations:", error);
    return {
      completionPercentage: 0,
      recommendations: [],
      missingItemsByCategory: {},
    };
  }
}

/**
 * Update user profile data and recalculate progress
 */
export async function updateUserProfileData(data) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Update user data
    await db.user.update({
      where: { id: user.id },
      data,
    });

    // Recalculate progress
    const progress = await calculateProfileProgress();

    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return {
      success: true,
      progress,
    };
  } catch (error) {
    console.error("Error updating user profile data:", error);
    throw new Error("Failed to update profile");
  }
}

/**
 * Update extended profile data (experience, education, etc.)
 */
export async function updateExtendedProfile(data) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Update or create profile
    await db.userProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...data,
        preferredLocations: data.preferredLocations || [],
        preferredJobTypes: data.preferredJobTypes || [],
        preferredIndustries: data.preferredIndustries || [],
      },
      update: data,
    });

    // Recalculate progress
    const progress = await calculateProfileProgress();

    revalidatePath("/dashboard");
    revalidatePath("/profile");

    return {
      success: true,
      progress,
    };
  } catch (error) {
    console.error("Error updating extended profile:", error);
    throw new Error("Failed to update extended profile");
  }
}
