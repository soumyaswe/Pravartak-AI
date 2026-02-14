"use server";

import { db } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

/**
 * Get activity counts by counting actual database records
 * This works without needing UserProfile counter fields
 */
export async function getActivityCounts() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return {
        documentsCreated: 0,
        interviewSessions: 0,
        resumeCount: 0,
        coverLetterCount: 0,
        mockInterviewCount: 0,
        assessmentCount: 0,
      };
    }

    console.log('Fetching activity counts for user:', user.id);

    // Count actual records from database
    const [resumeCount, coverLetterCount, mockInterviewCount, assessmentCount] = await Promise.all([
      db.resume.count({ where: { userId: user.id } }).catch(() => 0),
      db.coverLetter.count({ where: { userId: user.id } }).catch(() => 0),
      db.mockInterview.count({ where: { userId: user.id } }).catch(() => 0),
      db.assessment.count({ where: { userId: user.id } }).catch(() => 0),
    ]);

    const documentsCreated = resumeCount + coverLetterCount;
    const interviewSessions = mockInterviewCount + assessmentCount;

    console.log('Activity counts calculated:', {
      documentsCreated,
      interviewSessions,
      resumeCount,
      coverLetterCount,
      mockInterviewCount,
      assessmentCount
    });

    return {
      documentsCreated,
      interviewSessions,
      resumeCount,
      coverLetterCount,
      mockInterviewCount,
      assessmentCount,
    };
  } catch (error) {
    console.error("Error getting activity counts:", error);
    return {
      documentsCreated: 0,
      interviewSessions: 0,
      resumeCount: 0,
      coverLetterCount: 0,
      mockInterviewCount: 0,
      assessmentCount: 0,
    };
  }
}

/**
 * Increment resume count (placeholder for future counter implementation)
 */
export async function incrementResumeCount() {
  try {
    console.log('Resume count increment (counting from records)');
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error incrementing resume count:", error);
  }
}

/**
 * Increment cover letter count (placeholder for future counter implementation)
 */
export async function incrementCoverLetterCount() {
  try {
    console.log('Cover letter count increment (counting from records)');
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error incrementing cover letter count:", error);
  }
}

/**
 * Increment mock interview count (placeholder for future counter implementation)
 */
export async function incrementMockInterviewCount() {
  try {
    console.log('Mock interview count increment (counting from records)');
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error incrementing mock interview count:", error);
  }
}

/**
 * Increment assessment count (placeholder for future counter implementation)
 */
export async function incrementAssessmentCount() {
  try {
    console.log('Assessment count increment (counting from records)');
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Error incrementing assessment count:", error);
  }
}
