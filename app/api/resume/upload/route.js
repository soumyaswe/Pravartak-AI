import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { db } from "@/lib/prisma";
import { getBedrockModel } from "@/lib/bedrock-client";

const model = getBedrockModel(undefined, {
  maxTokens: 8000,
  temperature: 0.3
});

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

    // Process file based on type
    let promptParts = [];
    
    if (file.type === "application/pdf") {
      // Handle PDF files using pdf-parse
      try {
        const pdfParse = (await import("pdf-parse")).default;
        const pdfData = await pdfParse(buffer);
        const fileContent = pdfData.text;
        
        if (!fileContent || !fileContent.trim()) {
          // If text extraction fails, send PDF as document
          const base64 = buffer.toString('base64');
          promptParts = [
            { text: prompt },
            {
              document: {
                format: "pdf",
                name: file.name,
                source: {
                  bytes: buffer
                }
              }
            }
          ];
        } else {
          promptParts = [{ text: `${prompt}\n\nResume Content:\n${fileContent}` }];
        }
      } catch (pdfError) {
        console.error("Error processing PDF:", pdfError);
        throw new Error("Failed to process PDF file");
      }
    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // Handle DOCX files using mammoth
      try {
        const mammoth = (await import("mammoth")).default;
        const result = await mammoth.extractRawText({ buffer: bytes });
        const fileContent = result.value;
        
        if (!fileContent || !fileContent.trim()) {
          throw new Error("Could not extract text from DOCX file");
        }
        
        promptParts = [{ text: `${prompt}\n\nResume Content:\n${fileContent}` }];
      } catch (docxError) {
        console.error("Error processing DOCX:", docxError);
        throw new Error("Failed to process DOCX file");
      }
    } else if (file.type.startsWith("image/")) {
      // Handle images
      const base64 = buffer.toString('base64');
      promptParts = [
        { text: prompt },
        {
          image: {
            format: file.type.split('/')[1],
            source: {
              bytes: buffer
            }
          }
        }
      ];
    } else if (file.type === "text/plain") {
      // Handle text files
      const fileContent = buffer.toString('utf8');
      promptParts = [{ text: `${prompt}\n\nResume Content:\n${fileContent}` }];
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, image, or text file." },
        { status: 400 }
      );
    }

    // Generate content using Bedrock
    const result = await model.generateContent(promptParts);
    let extractedText = result.response.text();

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
