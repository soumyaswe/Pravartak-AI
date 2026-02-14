import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// POST - Save mock interview results
export async function POST(request) {
  try {
    const body = await request.json();
    const {
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
    } = body;

    if (!cognitoUserId || !questions || !responses) {
      return NextResponse.json(
        { error: "User ID, questions, and responses are required" },
        { status: 400 }
      );
    }

    let user = await db.user.findUnique({
      where: { cognitoUserId },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          cognitoUserId,
          email: body.email || "temp@example.com",
          name: body.name,
        },
      });
    }

    const mockInterview = await db.mockInterview.create({
      data: {
        userId: user.id,
        type: type || "GENERAL",
        industry,
        experienceLevel,
        duration: duration || 0,
        questions,
        responses,
        overallScore,
        communicationScore,
        contentScore,
        clarityScore,
        feedback,
        strengths: strengths || [],
        improvements: improvements || [],
        recommendations: recommendations || [],
      },
    });

    // Log activity
    await db.userActivity.create({
      data: {
        userId: user.id,
        activityType: "MOCK_INTERVIEW_COMPLETED",
        description: `Completed ${type || "General"} mock interview with score ${overallScore || "N/A"}`,
        metadata: { mockInterviewId: mockInterview.id, score: overallScore },
      },
    });

    // Update profile tracking
    await db.userProfile.upsert({
      where: { userId: user.id },
      update: { hasCompletedMockInterview: true },
      create: {
        userId: user.id,
        hasCompletedMockInterview: true,
      },
    });

    return NextResponse.json({ mockInterview }, { status: 201 });
  } catch (error) {
    console.error("Error saving mock interview:", error);
    return NextResponse.json(
      { error: "Failed to save mock interview" },
      { status: 500 }
    );
  }
}

// GET - Get mock interview history
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cognitoUserId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!cognitoUserId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { cognitoUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const mockInterviews = await db.mockInterview.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        overallScore: true,
        communicationScore: true,
        contentScore: true,
        clarityScore: true,
        duration: true,
        strengths: true,
        improvements: true,
        completedAt: true,
      },
    });

    return NextResponse.json({ mockInterviews });
  } catch (error) {
    console.error("Error fetching mock interviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch mock interviews" },
      { status: 500 }
    );
  }
}
