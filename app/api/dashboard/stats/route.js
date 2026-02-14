import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cognitoUserId = searchParams.get("userId");

    console.log("Dashboard stats request for user:", cognitoUserId);

    if (!cognitoUserId) {
      console.error("No user ID provided");
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    // Test database connection
    try {
      await db.$connect();
      console.log("Database connected successfully");
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return NextResponse.json(
        { error: "Database connection failed", details: dbError.message },
        { status: 500 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { cognitoUserId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      // Return default stats for new users
      console.log("User not found in database, returning default stats");
      return NextResponse.json({
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
      });
    }

    // Get counts with error handling
    let resumeCount = 0;
    let coverLetterCount = 0;
    let mockInterviewCount = 0;
    let interviewPrepCount = 0;
    let jobApplicationCount = 0;
    let recentActivity = [];

    try {
      [
        resumeCount,
        coverLetterCount,
        mockInterviewCount,
        interviewPrepCount,
        jobApplicationCount,
        recentActivity,
      ] = await Promise.all([
        db.resume.count({ where: { userId: user.id } }).catch(() => 0),
        db.coverLetter.count({ where: { userId: user.id } }).catch(() => 0),
        db.mockInterview.count({ where: { userId: user.id } }).catch(() => 0),
        db.interviewPrep.count({ where: { userId: user.id } }).catch(() => 0),
        db.jobApplication.count({ where: { userId: user.id } }).catch(() => 0),
        db.userActivity.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            activityType: true,
            description: true,
            createdAt: true,
          },
        }).catch(() => []),
      ]);
    } catch (error) {
      console.error("Error fetching counts:", error);
      // Continue with default values
    }

    // Calculate profile completion
    const profile = user.profile;
    let completionSteps = 0;
    let totalSteps = 7;

    if (profile) {
      if (profile.hasBasicInfo) completionSteps++;
      if (profile.hasExperience) completionSteps++;
      if (profile.hasEducation) completionSteps++;
      if (profile.hasSkills) completionSteps++;
      if (profile.hasResume) completionSteps++;
      if (profile.hasCoverLetter) completionSteps++;
      if (profile.hasCompletedMockInterview) completionSteps++;
    }

    // Check if user has basic info
    if (user.name && user.email) completionSteps++;
    if (user.skills && user.skills.length > 0 && !profile?.hasSkills) completionSteps++;
    if (resumeCount > 0 && !profile?.hasResume) completionSteps++;
    if (coverLetterCount > 0 && !profile?.hasCoverLetter) completionSteps++;

    const profileCompletion = Math.min(Math.round((completionSteps / totalSteps) * 100), 100);

    // Calculate documents created
    const documentsCreated = resumeCount + coverLetterCount;

    // Calculate interview sessions
    const interviewSessions = mockInterviewCount + interviewPrepCount;

    // Get latest assessment (interview practice quiz) score
    let latestScore = null;
    try {
      console.log("Fetching assessments for user.id:", user.id);
      
      // First, check if any assessments exist for this user
      const allAssessments = await db.assessment.findMany({
        where: { userId: user.id },
        select: { id: true, quizScore: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });
      
      console.log(`Found ${allAssessments.length} assessments for user:`, allAssessments);
      
      const latestAssessment = await db.assessment.findFirst({
        where: { userId: user.id, quizScore: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { quizScore: true, createdAt: true },
      });
      
      if (latestAssessment?.quizScore != null) {
        latestScore = latestAssessment.quizScore;
        console.log("✅ Latest assessment score found:", latestScore, "from", latestAssessment.createdAt);
      } else {
        console.log("❌ No assessment scores found for user");
      }
    } catch (error) {
      console.error("Error fetching latest assessment:", error);
    }

    // Get active days (days with activity)
    let activeDays = 0;
    try {
      const firstActivity = await db.userActivity.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      });

      if (firstActivity) {
        const daysSinceFirst = Math.floor(
          (Date.now() - firstActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        activeDays = Math.min(daysSinceFirst + 1, 30); // Cap at 30 for display
      }
    } catch (error) {
      console.error("Error calculating active days:", error);
    }

    // Get application status breakdown
    let jobApplicationsByStatus = [];
    try {
      jobApplicationsByStatus = await db.jobApplication.groupBy({
        by: ["status"],
        where: { userId: user.id },
        _count: true,
      });
    } catch (error) {
      console.error("Error fetching job applications by status:", error);
    }

    const stats = {
      profileCompletion,
      documentsCreated,
      interviewSessions,
      resumeCount,
      coverLetterCount,
      mockInterviewCount,
      interviewPrepCount,
      jobApplicationCount,
      activeDays,
      latestMockScore: latestScore,
      recentActivity,
      jobApplicationsByStatus: jobApplicationsByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    console.error("Error details:", error.message, error.stack);
    
    // Return default stats on error instead of failing completely
    return NextResponse.json({
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
    });
  }
}
