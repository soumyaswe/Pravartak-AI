"use server";

import { db } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import { calculateProfileProgress } from "./profile-progress";
import { getModelWithFallback } from "@/lib/gemini-fallback";

const model = getModelWithFallback(process.env.GEMINI_API_KEY);

/**
 * Creates a new resume in the database for the authenticated user.
 */
export async function createResume(content) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("User not authenticated");

  try {
    const resume = await db.resume.create({
      data: {
        userId: user.id,
        content: content,
        // Default title, or you can add a title field to your form
        title: content.contacts.jobTitle || "New Resume", 
        status: "DRAFT",
      },
    });

    // Create activity record
    try {
      await db.userActivity.create({
        data: {
          userId: user.id,
          activityType: "RESUME_CREATED",
          description: `Created resume: ${resume.title}`,
          metadata: {
            resumeId: resume.id,
            title: resume.title,
          },
        },
      });
    } catch (activityError) {
      console.error("Error creating activity record:", activityError);
      // Don't fail the resume creation if activity logging fails
    }

    revalidatePath("/resume"); // Revalidates the builder page
    revalidatePath("/resume/my-resumes"); // Revalidates the list page
    revalidatePath("/dashboard");
    
    // Recalculate profile progress
    try {
      await calculateProfileProgress();
    } catch (error) {
      console.error("Error calculating profile progress:", error);
    }
    
    return resume;
  } catch (error) {
    console.error("Error creating resume:", error);
    throw new Error("Failed to create resume");
  }
}

/**
 * Updates an existing resume by its ID.
 */
export async function updateResume(resumeId, content) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("User not authenticated");

  try {
    const resume = await db.resume.update({
      where: {
        id: resumeId,
        userId: user.id, // Ensure user owns this resume
      },
      data: {
        content: content,
        title: content.contacts.jobTitle || "Updated Resume",
        updatedAt: new Date(),
      },
    });

    // Create activity record
    try {
      await db.userActivity.create({
        data: {
          userId: user.id,
          activityType: "RESUME_UPDATED",
          description: `Updated resume: ${resume.title}`,
          metadata: {
            resumeId: resume.id,
            title: resume.title,
          },
        },
      });
    } catch (activityError) {
      console.error("Error creating activity record:", activityError);
      // Don't fail the resume update if activity logging fails
    }

    revalidatePath("/resume");
    revalidatePath("/resume/my-resumes");
    return resume;
  } catch (error) {
    console.error("Error updating resume:", error);
    throw new Error("Failed to update resume");
  }
}

/**
 * Deletes a resume by its ID.
 */
export async function deleteResume(resumeId) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("User not authenticated");

  try {
    await db.resume.delete({
      where: {
        id: resumeId,
        userId: user.id, // Ensure user owns this resume
      },
    });

    revalidatePath("/resume/my-resumes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting resume:", error);
    throw new Error("Failed to delete resume");
  }
}

/**
 * AI-powered content improvement.
 */
export async function improveWithAI({ current, type, jobTitle }) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("User not authenticated");
  
  // You could fetch user's career goals here as in your previous file
  // const userProfile = await db.userProfile.findUnique(...);
  
  let prompt;
  const isEmpty = !current || current.trim() === "";

  if (type === 'summary') {
    if (isEmpty) {
      prompt = `
        As an expert resume writer for a [${jobTitle || 'professional'}], 
        generate a compelling professional summary from scratch. 
        Focus on key skills, achievements, and career objectives for a ${jobTitle || 'professional'} role.
        
        Requirements:
        - Make it achievement-oriented and impactful
        - Keep it concise (2-3 sentences)
        - Use strong action words
        - Make it ATS-friendly
        - Tailor it for ${jobTitle || 'professional'} positions
        
        Return ONLY the professional summary paragraph.
      `;
    } else {
      prompt = `
        As an expert resume writer for a [${jobTitle || 'professional'}], 
        rewrite this professional summary to be more impactful and concise. 
        Focus on achievements and key skills.
        Current summary: "${current}"
        
        Return ONLY the improved paragraph.
      `;
    }
  } else if (type === 'experience') {
    if (isEmpty) {
      prompt = `
        As an expert resume writer for a [${jobTitle || 'professional'}], 
        generate a compelling job description from scratch for a ${jobTitle || 'professional'} role.
        
        Requirements:
        - Focus on achievements rather than just responsibilities
        - Use strong action verbs (Led, Developed, Implemented, etc.)
        - Include quantifiable results where appropriate
        - Make it relevant to ${jobTitle || 'professional'} roles
        - Keep it professional and concise
        - Write 3-4 bullet points
        
        Return ONLY the job description as bullet points, starting each with a dash (-).
      `;
    } else {
      prompt = `
        As an expert resume writer for a [${jobTitle || 'professional'}], 
        rewrite these responsibility bullet points to be achievement-oriented. 
        Use strong action verbs and quantify results where possible.
        Current points: "${current}"
        
        Return ONLY the improved bullet points, starting each with a dash (-).
      `;
    }
  } else if (type === 'education') {
    if (isEmpty) {
      prompt = `
        As an expert resume writer for a [${jobTitle || 'professional'}], 
        generate a compelling education description from scratch.
        
        Requirements:
        - Focus on relevant coursework, achievements, honors, or projects
        - Include GPA if it's strong (3.5+ out of 4.0)
        - Mention relevant extracurricular activities or leadership roles
        - Keep it concise and professional
        - Make it relevant to ${jobTitle || 'professional'} field
        
        Return ONLY the education description.
      `;
    } else {
      prompt = `
        As an expert resume writer for a [${jobTitle || 'professional'}], 
        improve this education description to be more impactful and relevant.
        Current description: "${current}"
        
        Requirements:
        - Highlight relevant coursework, achievements, and activities
        - Make it more compelling and professional
        - Keep it concise
        
        Return ONLY the improved education description.
      `;
    }
  } else {
    throw new Error("Invalid AI improvement type");
  }

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const improvedContent = response.text().trim();
    return improvedContent;
  } catch (error) {
    console.error("Error improving content:", error);
    throw new Error("Failed to improve content");
  }
}

/**
 * Fetches all resumes for the authenticated user.
 */
export async function getResumes() {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("User not authenticated");

  try {
    return await db.resume.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  } catch (error) {
    console.error("Error fetching resumes:", error);
    throw new Error("Failed to fetch resumes");
  }
}

/**
 * Fetches a single resume by its ID (for editing).
 */
export async function getResumeById(resumeId) {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("User not authenticated");

  try {
    const resume = await db.resume.findFirst({
      where: {
        id: resumeId,
        userId: user.id, // Ensure user owns the resume
      },
    });
    
    if (!resume) {
      throw new Error("Resume not found");
    }
    
    return resume;
  } catch (error) {
    console.error("Error fetching resume by ID:", error);
    throw new Error("Failed to fetch resume");
  }
}
