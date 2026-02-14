// Utility functions for saving data to database

/**
 * Save a resume to the database
 */
export async function saveResumeToDb({
  cognitoUserId,
  title,
  content,
  templateId = "default",
  status = "DRAFT",
  email,
  name,
}) {
  try {
    const response = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cognitoUserId,
        title,
        content,
        templateId,
        status,
        email,
        name,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save resume");
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving resume:", error);
    throw error;
  }
}

/**
 * Update an existing resume
 */
export async function updateResumeInDb({
  resumeId,
  title,
  content,
  templateId,
  status,
  atsScore,
  feedback,
}) {
  try {
    const response = await fetch("/api/resumes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeId,
        title,
        content,
        templateId,
        status,
        atsScore,
        feedback,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update resume");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating resume:", error);
    throw error;
  }
}

/**
 * Get all resumes for a user
 */
export async function getUserResumes(cognitoUserId) {
  try {
    const response = await fetch(`/api/resumes?userId=${cognitoUserId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch resumes");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching resumes:", error);
    throw error;
  }
}

/**
 * Delete a resume
 */
export async function deleteResumeFromDb(resumeId) {
  try {
    const response = await fetch(`/api/resumes?id=${resumeId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete resume");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting resume:", error);
    throw error;
  }
}

/**
 * Save a cover letter to the database
 */
export async function saveCoverLetterToDb({
  cognitoUserId,
  title,
  content,
  companyName,
  jobTitle,
  jobDescription,
  status = "DRAFT",
  email,
  name,
}) {
  try {
    const response = await fetch("/api/cover-letters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cognitoUserId,
        title,
        content,
        companyName,
        jobTitle,
        jobDescription,
        status,
        email,
        name,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save cover letter");
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving cover letter:", error);
    throw error;
  }
}

/**
 * Get all cover letters for a user
 */
export async function getUserCoverLetters(cognitoUserId) {
  try {
    const response = await fetch(`/api/cover-letters?userId=${cognitoUserId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch cover letters");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching cover letters:", error);
    throw error;
  }
}

/**
 * Save mock interview results to the database
 */
export async function saveMockInterviewToDb({
  cognitoUserId,
  type,
  industry,
  experienceLevel,
  duration,
  questions,
  responses,
  overallScore,
  communicationScore,
  contentScore,
  clarityScore,
  feedback,
  strengths,
  improvements,
  recommendations,
  email,
  name,
}) {
  try {
    const response = await fetch("/api/mock-interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cognitoUserId,
        type,
        industry,
        experienceLevel,
        duration,
        questions,
        responses,
        overallScore,
        communicationScore,
        contentScore,
        clarityScore,
        feedback,
        strengths,
        improvements,
        recommendations,
        email,
        name,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save mock interview");
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving mock interview:", error);
    throw error;
  }
}

/**
 * Get mock interview history for a user
 */
export async function getUserMockInterviews(cognitoUserId, limit = 10) {
  try {
    const response = await fetch(
      `/api/mock-interviews?userId=${cognitoUserId}&limit=${limit}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch mock interviews");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching mock interviews:", error);
    throw error;
  }
}

/**
 * Get dashboard statistics for a user
 */
export async function getDashboardStats(cognitoUserId) {
  try {
    const response = await fetch(`/api/dashboard/stats?userId=${cognitoUserId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      let errorMessage = "Failed to fetch dashboard stats";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch (e) {
        // Response wasn't JSON
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error.message);
    // Return default stats instead of throwing
    return {
      stats: {
        profileCompletion: 0,
        documentsCreated: 0,
        interviewSessions: 0,
        resumeCount: 0,
        coverLetterCount: 0,
        mockInterviewCount: 0,
        interviewPrepCount: 0,
        jobApplicationCount: 0,
        activeDays: 0,
        latestMockScore: null,
        recentActivity: [],
        jobApplicationsByStatus: []
      }
    };
  }
}
