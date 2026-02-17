"use server";

import { db } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { calculateProfileProgress } from "./profile-progress";
import { getModelWithFallback } from "@/lib/bedrock-client";

const model = getModelWithFallback();

export async function generateCoverLetter(data) {
  const user = await getAuthenticatedUser();

  // Build available user information
  const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
  const userEmail = user.email || '';
  const userPhone = user.phone || user.phoneNumber || '';
  const userAddress = user.address || '';
  const userIndustry = user.industry || '';
  const userExperience = user.experience || 0;
  const userSkills = user.skills?.join(", ") || '';
  const userBio = user.bio || '';

  const prompt = `
    Write a professional cover letter for a ${data.jobTitle} position at ${
    data.companyName
  }.
    
    Candidate Information (USE THESE ACTUAL DETAILS - DO NOT USE PLACEHOLDERS):
    - Full Name: ${userName}
    - Email: ${userEmail}
    ${userPhone ? `- Phone Number: ${userPhone}` : ''}
    ${userAddress ? `- Address: ${userAddress}` : ''}
    ${userIndustry ? `- Industry: ${userIndustry}` : ''}
    - Years of Experience: ${userExperience}
    ${userSkills ? `- Skills: ${userSkills}` : ''}
    ${userBio ? `- Professional Background: ${userBio}` : ''}
    
    Job Description:
    ${data.jobDescription}
    
    CRITICAL REQUIREMENTS:
    1. Use the candidate's ACTUAL NAME (${userName}) throughout the letter - DO NOT use placeholders like "[Your Name]" or "John Doe"
    2. Include the candidate's ACTUAL EMAIL (${userEmail}) in the header
    ${userPhone ? `3. Include the candidate's ACTUAL PHONE NUMBER (${userPhone}) in the header` : '3. DO NOT include phone number as it is not available'}
    ${userAddress ? `4. Include the candidate's ACTUAL ADDRESS (${userAddress}) in the header` : '4. DO NOT include address as it is not available'}
    5. Use "[Submission Date]" as a placeholder for the date in the letter header
    6. Use a professional, enthusiastic tone
    7. Highlight relevant skills and experience from the candidate's actual background
    8. Show understanding of the company's needs
    9. Keep it concise (max 400 words)
    10. Use proper business letter formatting in markdown
    11. Include specific examples that relate to the candidate's actual experience and skills
    12. Relate candidate's background to job requirements
    13. DO NOT leave any placeholder text except for the date - if information is not available, simply omit that field from the letter
    14. NEVER use generic placeholders like "[Your Name]", "[Your Phone]", "[Your Address]", etc.
    
    Format the letter in markdown with the candidate's actual information filled in. Start with a header containing the available candidate contact information and use "[Submission Date]" as the date placeholder.
  `;

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        jobDescription: data.jobDescription,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        status: "completed",
        userId: user.id,
      },
    });

    // Create activity record
    try {
      await db.userActivity.create({
        data: {
          userId: user.id,
          activityType: "COVER_LETTER_CREATED",
          description: `Created cover letter for ${data.jobTitle} at ${data.companyName}`,
          metadata: {
            coverLetterId: coverLetter.id,
            jobTitle: data.jobTitle,
            companyName: data.companyName,
          },
        },
      });
    } catch (activityError) {
      console.error("Error creating activity record:", activityError);
      // Don't fail the cover letter creation if activity logging fails
    }

    revalidatePath("/dashboard");
    
    // Recalculate profile progress
    try {
      await calculateProfileProgress();
    } catch (error) {
      console.error("Error calculating profile progress:", error);
    }

    return coverLetter;
  } catch (error) {
    console.error("Error generating cover letter:", error.message);
    
    // Provide user-friendly error messages
    if (error.message.includes("Unauthorized") || error.message.includes("Authentication")) {
      throw new Error("Authentication error. Please refresh the page and try again. If the problem persists, try logging out and logging back in.");
    }
    
    throw new Error(error.message || "Failed to generate cover letter");
  }
}

export async function getCoverLetters() {
  const user = await getAuthenticatedUser();

  return await db.coverLetter.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCoverLetter(id) {
  const user = await getAuthenticatedUser();

  return await db.coverLetter.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });
}

export async function deleteCoverLetter(id) {
  const user = await getAuthenticatedUser();

  return await db.coverLetter.delete({
    where: {
      id,
      userId: user.id,
    },
  });
}
