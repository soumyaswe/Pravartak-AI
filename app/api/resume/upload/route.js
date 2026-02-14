import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { db } from "@/lib/prisma";
// Using GoogleGenerativeAI for file upload functionality (Vertex AI file handling is different)
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save temporarily
    const fs = require("fs");
    const path = require("path");
    const os = require("os");
    
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `resume-${Date.now()}-${file.name}`);
    
    fs.writeFileSync(tempFilePath, buffer);

    // Upload to Gemini File API
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: file.type,
      displayName: file.name,
    });

    console.log(`Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`);

    // Extract content using Gemini with file
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert resume parser. Extract ALL information from this resume document and structure it in a detailed JSON format.

IMPORTANT: Extract EVERYTHING you see in the document. Do not skip any information.

Extract the following sections (if present):

1. Personal Information (contacts):
   - firstName
   - lastName  
   - email
   - phone
   - location (city, state, country)
   - jobTitle (current/desired position)
   - linkedin
   - portfolio/website
   - github or other professional links

2. Professional Summary (summary):
   - A brief professional summary or objective statement

3. Work Experience (experiences):
   For each job, extract:
   - company name
   - position/title
   - location
   - startDate (format: "Month Year" or "YYYY-MM")
   - endDate (format: "Month Year" or "YYYY-MM" or "Present")
   - responsibilities (array of bullet points - extract ALL points)
   - achievements (any quantifiable achievements)

4. Education (education):
   For each degree, extract:
   - institution name
   - degree type and major
   - location
   - graduationDate
   - gpa (if mentioned)
   - honors or awards

5. Skills (skills):
   - Extract ALL skills mentioned
   - Group by category if possible (Technical, Soft Skills, Languages, Tools, etc.)
   - Return as an array of skill strings

6. Certifications (certifications):
   For each certification, extract:
   - name
   - issuer/organization
   - date
   - credential ID (if present)

7. Projects (projects):
   For each project, extract:
   - name
   - description
   - technologies used
   - link (if available)
   - date/duration

8. Awards and Honors (awards):
   - name
   - issuer
   - date
   - description

9. Languages (languages):
   - language name
   - proficiency level

10. Additional Sections:
    - Volunteer work
    - Publications
    - Patents
    - Conferences/Speaking engagements
    - Professional memberships

Return ONLY a valid JSON object with this structure:
{
  "contacts": {
    "firstName": "",
    "lastName": "",
    "email": "",
    "phone": "",
    "location": "",
    "jobTitle": "",
    "linkedin": "",
    "portfolio": "",
    "github": ""
  },
  "summary": "",
  "experiences": [
    {
      "company": "",
      "position": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "responsibilities": []
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "location": "",
      "graduationDate": "",
      "gpa": ""
    }
  ],
  "skills": [],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": "",
      "credentialId": ""
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": [],
      "link": "",
      "date": ""
    }
  ],
  "awards": [
    {
      "name": "",
      "issuer": "",
      "date": "",
      "description": ""
    }
  ],
  "languages": [
    {
      "language": "",
      "proficiency": ""
    }
  ],
  "additionalSections": {}
}

CRITICAL: Return ONLY the JSON object, no markdown, no explanation, no code blocks.`;

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    let extractedText = response.text();

    // Clean up the response
    extractedText = extractedText.trim();
    
    // Remove markdown code blocks if present
    if (extractedText.startsWith("```json")) {
      extractedText = extractedText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (extractedText.startsWith("```")) {
      extractedText = extractedText.replace(/```\n?/g, "");
    }

    // Parse the JSON
    let resumeContent;
    try {
      resumeContent = JSON.parse(extractedText);
    } catch (parseError) {
      console.error("Failed to parse extracted content:", extractedText);
      throw new Error("Failed to parse resume content");
    }

    // Create resume in database
    const resume = await db.resume.create({
      data: {
        userId: user.id,
        title: resumeContent.contacts?.jobTitle || file.name.replace(/\.[^/.]+$/, ""),
        content: resumeContent,
        status: "DRAFT",
      },
    });

    // Clean up temporary file
    fs.unlinkSync(tempFilePath);

    // Delete the file from Gemini after processing
    try {
      await fileManager.deleteFile(uploadResult.file.name);
    } catch (deleteError) {
      console.error("Failed to delete file from Gemini:", deleteError);
      // Don't fail the request if cleanup fails
    }

    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      message: "Resume uploaded and processed successfully",
    });
  } catch (error) {
    console.error("Error processing resume upload:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process resume" },
      { status: 500 }
    );
  }
}
