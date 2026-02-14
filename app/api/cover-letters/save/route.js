import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-server";

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { jobTitle, companyName, jobDescription, content } = await request.json();

    if (!jobTitle || !companyName || !content) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save cover letter to database
    const coverLetter = await db.coverLetter.create({
      data: {
        userId: user.id,
        jobTitle,
        companyName,
        jobDescription: jobDescription || "",
        content,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cover letter saved successfully",
      coverLetterId: coverLetter.id,
    });
  } catch (error) {
    console.error("Save cover letter error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save cover letter",
      },
      { status: 500 }
    );
  }
}
