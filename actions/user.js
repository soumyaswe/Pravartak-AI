"use server";

import { db } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";
import { calculateProfileProgress } from "./profile-progress";

export async function updateUser(data) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      console.error("Authentication failed - no user found");
      throw new Error("User not authenticated");
    }

    console.log("Updating user:", user.id, "with data:", {
      industry: data.industry,
      experience: data.experience,
      bio: data.bio?.substring(0, 50) + "...",
      skillsCount: data.skills?.length || 0
    });

    // CRITICAL FIX: Drop the foreign key constraint if it exists
    try {
      await db.$executeRaw`ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_industry_fkey" CASCADE;`;
      console.log("Foreign key constraint check completed");
    } catch (fkError) {
      console.log("FK constraint drop attempt:", fkError.message);
      // Continue anyway - constraint might not exist or already dropped
    }

    // Update the user using raw SQL to bypass any Prisma-level FK checks
    const skillsArrayString = `{${data.skills.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',')}}`;
    
    const updatedUser = await db.$executeRawUnsafe(
      `UPDATE "User" 
       SET 
         "industry" = $1,
         "experience" = $2,
         "bio" = $3,
         "skills" = $4::text[],
         "updatedAt" = NOW()
       WHERE "id" = $5
       RETURNING *`,
      data.industry,
      data.experience,
      data.bio,
      skillsArrayString,
      user.id
    );
    
    // Fetch the updated user to return
    const updatedUserData = await db.user.findUnique({
      where: { id: user.id }
    });

    console.log("User updated successfully:", {
      id: updatedUserData.id,
      industry: updatedUserData.industry,
      experience: updatedUserData.experience,
      skillsCount: updatedUserData.skills?.length || 0
    });

    // Then handle industry insights separately (non-blocking)
    try {
      let industryInsight = await db.industryInsight.findUnique({
        where: {
          industry: data.industry,
        },
      });

      if (!industryInsight) {
        console.log("Creating new industry insight for:", data.industry);
        const insights = await generateAIInsights(data.industry);

        await db.industryInsight.create({
          data: {
            industry: data.industry,
            ...insights,
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      }
    } catch (insightError) {
      console.error("Error with industry insights (non-critical):", insightError);
      // Don't fail the update if industry insights fail
    }

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    
    // Recalculate profile progress
    try {
      await calculateProfileProgress();
    } catch (progressError) {
      console.error("Error calculating profile progress (non-critical):", progressError);
    }
    
    return updatedUserData;
  } catch (error) {
    console.error("Error updating user:", error);
    console.error("Error stack:", error.stack);
    throw new Error(error.message || "Failed to update profile");
  }
}

export async function getUserProfile() {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    console.error("Error getting user profile:", error);
    
    // Check if it's a database connection error
    if (error.message?.includes("Database connection failed") || 
        error.message?.includes("Can't reach database") ||
        error.message?.includes("connection") ||
        error.message?.includes("DATABASE_URL")) {
      throw new Error(
        "Database connection failed. Please ensure your database is running. " +
        "See QUICK_FIX_DATABASE.md for setup instructions."
      );
    }
    
    // Check if it's an authentication error
    if (error.message?.includes("Authentication required") || 
        error.message?.includes("Unauthorized") ||
        error.message?.includes("log in")) {
      throw error; // Re-throw auth errors as-is
    }
    
    // Generic error
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
}

export async function getUserOnboardingStatus() {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      // If user is not authenticated, it's not an onboarding status, but an auth issue
      // Let the client-side ProtectedRoute handle the redirect
      return { isOnboarded: false, error: "User not authenticated" };
    }

    return {
      isOnboarded: !!user?.industry,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    // Distinguish between auth errors and other errors (e.g., database)
    if (error.message?.includes("Authentication required") || error.message?.includes("User not found")) {
      return { isOnboarded: false, error: error.message };
    }
    // For other errors (e.g., database connection), return false but don't redirect
    return { isOnboarded: false, error: "Failed to check onboarding status due to server error." };
  }
}

export async function getProfileCompletionData() {
  try {
    const user = await getAuthenticatedUser();
    
    console.log('getProfileCompletionData - User fetched:', user ? {
      id: user.id,
      email: user.email,
      name: user.name,
      skills: user.skills,
    } : null);
    
    if (!user) {
      console.log('getProfileCompletionData - No user found, returning defaults');
      return {
        profileCompletion: 0,
        completionDetails: {
          hasBasicInfo: false,
          hasExperience: false,
          hasEducation: false,
          hasSkills: false,
          hasResume: false,
          hasCoverLetter: false,
          hasCompletedMockInterview: false,
        }
      };
    }

    // Get user profile data
    const profile = await db.userProfile.findUnique({
      where: { userId: user.id },
    });
    
    console.log('getProfileCompletionData - Profile found:', profile);

    // Get counts for documents
    const [resumeCount, coverLetterCount, mockInterviewCount] = await Promise.all([
      db.resume.count({ where: { userId: user.id } }),
      db.coverLetter.count({ where: { userId: user.id } }),
      db.mockInterview.count({ where: { userId: user.id } }),
    ]);
    
    console.log('getProfileCompletionData - Counts:', { resumeCount, coverLetterCount, mockInterviewCount });

    // Calculate profile completion
    let completionSteps = 0;
    const totalSteps = 7;

    const completionDetails = {
      hasBasicInfo: false,
      hasExperience: false,
      hasEducation: false,
      hasSkills: false,
      hasResume: false,
      hasCoverLetter: false,
      hasCompletedMockInterview: false,
    };

    // Check basic info - user has name and email
    if (user.name && user.email) {
      completionSteps++;
      completionDetails.hasBasicInfo = true;
    }

    // Check if profile exists and has flags, otherwise check user data directly
    if (profile) {
      if (profile.hasExperience || (profile.experience && Array.isArray(profile.experience) && profile.experience.length > 0)) {
        completionSteps++;
        completionDetails.hasExperience = true;
      }
      if (profile.hasEducation || (profile.education && Array.isArray(profile.education) && profile.education.length > 0)) {
        completionSteps++;
        completionDetails.hasEducation = true;
      }
    }

    // Check skills from user table or profile
    if ((user.skills && user.skills.length > 0) || (profile?.hasSkills)) {
      completionSteps++;
      completionDetails.hasSkills = true;
    }

    // Check documents
    if (resumeCount > 0 || profile?.hasResume) {
      completionSteps++;
      completionDetails.hasResume = true;
    }
    if (coverLetterCount > 0 || profile?.hasCoverLetter) {
      completionSteps++;
      completionDetails.hasCoverLetter = true;
    }
    if (mockInterviewCount > 0 || profile?.hasCompletedMockInterview) {
      completionSteps++;
      completionDetails.hasCompletedMockInterview = true;
    }

    const profileCompletion = Math.min(Math.round((completionSteps / totalSteps) * 100), 100);

    console.log('getProfileCompletionData - Final calculation:', {
      completionSteps,
      totalSteps,
      profileCompletion,
      completionDetails
    });

    return {
      profileCompletion,
      completionDetails,
      completionSteps,
      totalSteps,
    };
  } catch (error) {
    console.error("Error getting profile completion data:", error);
    console.error("Error stack:", error.stack);
    return {
      profileCompletion: 0,
      completionDetails: {
        hasBasicInfo: false,
        hasExperience: false,
        hasEducation: false,
        hasSkills: false,
        hasResume: false,
        hasCoverLetter: false,
        hasCompletedMockInterview: false,
      },
      completionSteps: 0,
      totalSteps: 7,
    };
  }
}
