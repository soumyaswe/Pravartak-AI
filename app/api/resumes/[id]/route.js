import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// GET - Get specific resume
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const resume = await db.resume.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json({ resume });
  } catch (error) {
    console.error("Error fetching resume:", error);
    return NextResponse.json(
      { error: "Failed to fetch resume" },
      { status: 500 }
    );
  }
}

// PUT - Update specific resume
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, templateId, status, atsScore, feedback } = body;

    const resume = await db.resume.update({
      where: { id },
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

// DELETE - Delete specific resume
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await db.resume.delete({
      where: { id },
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