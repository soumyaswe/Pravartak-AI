import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// GET - List all resumes for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cognitoUserId = searchParams.get("userId");

    if (!cognitoUserId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    // Find user by Cognito ID
    const user = await db.user.findUnique({
      where: { cognitoUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all resumes
    const resumes = await db.resume.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        isDefault: true,
        atsScore: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ resumes });
  } catch (error) {
    console.error("Error fetching resumes:", error);
    return NextResponse.json(
      { error: "Failed to fetch resumes" },
      { status: 500 }
    );
  }
}

// POST - Save a new resume
export async function POST(request) {
  try {
    const body = await request.json();
    const { cognitoUserId, title, content, templateId, status } = body;

    if (!cognitoUserId || !content) {
      return NextResponse.json(
        { error: "User ID and content are required" },
        { status: 400 }
      );
    }

    // Find user by Cognito ID
    let user = await db.user.findUnique({
      where: { cognitoUserId },
    });

    // Create user if doesn't exist
    if (!user) {
      user = await db.user.create({
        data: {
          cognitoUserId,
          email: body.email || "temp@example.com",
          name: body.name,
        },
      });
    }

    // Create resume
    const resume = await db.resume.create({
      data: {
        userId: user.id,
        title: title || "Untitled Resume",
        content: content,
        templateId: templateId,
        status: status || "DRAFT",
      },
    });

    // Log activity
    await db.userActivity.create({
      data: {
        userId: user.id,
        activityType: "RESUME_CREATED",
        description: `Created resume: ${resume.title}`,
        metadata: { resumeId: resume.id },
      },
    });

    // Update profile tracking
    await db.userProfile.upsert({
      where: { userId: user.id },
      update: { hasResume: true },
      create: {
        userId: user.id,
        hasResume: true,
      },
    });

    return NextResponse.json({ resume }, { status: 201 });
  } catch (error) {
    console.error("Error creating resume:", error);
    return NextResponse.json(
      { error: "Failed to create resume" },
      { status: 500 }
    );
  }
}

// PUT - Update a resume
export async function PUT(request) {
  try {
    const body = await request.json();
    const { resumeId, title, content, templateId, status, atsScore, feedback } = body;

    if (!resumeId) {
      return NextResponse.json(
        { error: "Resume ID required" },
        { status: 400 }
      );
    }

    // Update resume
    const resume = await db.resume.update({
      where: { id: resumeId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(templateId && { templateId }),
        ...(status && { status }),
        ...(atsScore !== undefined && { atsScore }),
        ...(feedback && { feedback }),
      },
    });

    // Log activity
    await db.userActivity.create({
      data: {
        userId: resume.userId,
        activityType: "RESUME_UPDATED",
        description: `Updated resume: ${resume.title}`,
        metadata: { resumeId: resume.id },
      },
    });

    return NextResponse.json({ resume });
  } catch (error) {
    console.error("Error updating resume:", error);
    return NextResponse.json(
      { error: "Failed to update resume" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a resume
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get("id");

    if (!resumeId) {
      return NextResponse.json(
        { error: "Resume ID required" },
        { status: 400 }
      );
    }

    await db.resume.delete({
      where: { id: resumeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting resume:", error);
    return NextResponse.json(
      { error: "Failed to delete resume" },
      { status: 500 }
    );
  }
}
