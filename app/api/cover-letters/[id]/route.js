import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function DELETE(request, { params }) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify the cover letter belongs to the user
    const coverLetter = await db.coverLetter.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!coverLetter) {
      return NextResponse.json(
        { success: false, error: "Cover letter not found" },
        { status: 404 }
      );
    }

    if (coverLetter.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Delete the cover letter
    await db.coverLetter.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Cover letter deleted successfully",
    });
  } catch (error) {
    console.error("Delete cover letter error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete cover letter",
      },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const coverLetter = await db.coverLetter.findUnique({
      where: { id },
    });

    if (!coverLetter) {
      return NextResponse.json(
        { success: false, error: "Cover letter not found" },
        { status: 404 }
      );
    }

    if (coverLetter.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      coverLetter,
    });
  } catch (error) {
    console.error("Get cover letter error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get cover letter",
      },
      { status: 500 }
    );
  }
}
