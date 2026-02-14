import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// GET - List all cover letters for a user
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

    const user = await db.user.findUnique({
      where: { cognitoUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const coverLetters = await db.coverLetter.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        companyName: true,
        jobTitle: true,
        status: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ coverLetters });
  } catch (error) {
    console.error("Error fetching cover letters:", error);
    return NextResponse.json(
      { error: "Failed to fetch cover letters" },
      { status: 500 }
    );
  }
}

// POST - Save a new cover letter
export async function POST(request) {
  try {
    const body = await request.json();
    const { cognitoUserId, title, content, companyName, jobTitle, jobDescription, status } = body;

    if (!cognitoUserId || !content) {
      return NextResponse.json(
        { error: "User ID and content are required" },
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

    // Calculate word count
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    const coverLetter = await db.coverLetter.create({
      data: {
        userId: user.id,
        title: title || `Cover Letter for ${companyName || "Untitled"}`,
        content,
        companyName,
        jobTitle,
        jobDescription,
        status: status || "DRAFT",
        wordCount,
      },
    });

    // Log activity
    await db.userActivity.create({
      data: {
        userId: user.id,
        activityType: "COVER_LETTER_CREATED",
        description: `Created cover letter: ${coverLetter.title}`,
        metadata: { coverLetterId: coverLetter.id },
      },
    });

    // Update profile tracking
    await db.userProfile.upsert({
      where: { userId: user.id },
      update: { hasCoverLetter: true },
      create: {
        userId: user.id,
        hasCoverLetter: true,
      },
    });

    return NextResponse.json({ coverLetter }, { status: 201 });
  } catch (error) {
    console.error("Error creating cover letter:", error);
    return NextResponse.json(
      { error: "Failed to create cover letter" },
      { status: 500 }
    );
  }
}

// PUT - Update a cover letter
export async function PUT(request) {
  try {
    const body = await request.json();
    const { coverLetterId, title, content, companyName, jobTitle, status } = body;

    if (!coverLetterId) {
      return NextResponse.json(
        { error: "Cover Letter ID required" },
        { status: 400 }
      );
    }

    const wordCount = content ? content.split(/\s+/).filter(Boolean).length : undefined;

    const coverLetter = await db.coverLetter.update({
      where: { id: coverLetterId },
      data: {
        ...(title && { title }),
        ...(content && { content, wordCount }),
        ...(companyName && { companyName }),
        ...(jobTitle && { jobTitle }),
        ...(status && { status }),
      },
    });

    // Log activity
    await db.userActivity.create({
      data: {
        userId: coverLetter.userId,
        activityType: "COVER_LETTER_UPDATED",
        description: `Updated cover letter: ${coverLetter.title}`,
        metadata: { coverLetterId: coverLetter.id },
      },
    });

    return NextResponse.json({ coverLetter });
  } catch (error) {
    console.error("Error updating cover letter:", error);
    return NextResponse.json(
      { error: "Failed to update cover letter" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a cover letter
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coverLetterId = searchParams.get("id");

    if (!coverLetterId) {
      return NextResponse.json(
        { error: "Cover Letter ID required" },
        { status: 400 }
      );
    }

    await db.coverLetter.delete({
      where: { id: coverLetterId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cover letter:", error);
    return NextResponse.json(
      { error: "Failed to delete cover letter" },
      { status: 500 }
    );
  }
}
