import { NextResponse } from "next/server";
import { getBedrockModel, generateWithBedrock } from "@/lib/bedrock-client";

export async function POST(request) {
  try {
    const { jobTitle, companyName, jobDescription, tone, resumeText } = await request.json();

    if (!jobTitle || !companyName || !jobDescription) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { success: false, error: "Resume text is too short or missing" },
        { status: 400 }
      );
    }

    // Generate cover letter using Amazon Bedrock (Claude)
    const prompt = `Based on the following resume and job details, generate a professional, compelling cover letter. The cover letter should be personalized, highlight relevant experience from the resume, and demonstrate enthusiasm for the role.

RESUME CONTENT:
${resumeText}

JOB DETAILS:
Company: ${companyName}
Position: ${jobTitle}
Job Description: ${jobDescription}
Tone: ${tone || 'Professional'}

CRITICAL FORMATTING RULES - YOU MUST FOLLOW THESE EXACTLY:
1. Format as HTML with inline styles
2. Header section should ONLY contain:
   - Candidate's name (extract from resume)
   - Candidate's email (extract from resume)
   - Current date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
   - Company name: ${companyName}
3. ABSOLUTELY DO NOT INCLUDE:
   - ❌ NO physical addresses (not candidate's, not company's)
   - ❌ NO street addresses
   - ❌ NO postal codes or ZIP codes
   - ❌ NO city/state information
   - ❌ NO phone numbers
   - ❌ NO placeholder text like [Address], [City, State], etc.
4. Start letter body with "Dear Hiring Manager,"
5. Write 3-4 well-structured paragraphs:
   - Opening: Express interest and mention the position
   - Body (1-2 paragraphs): Highlight 1-2 specific achievements from the resume that align with the job requirements. Be detailed and quantitative.
   - Closing: Express enthusiasm and request discussion opportunity
6. End with "Sincerely," followed by candidate's name
7. Use ${tone} tone throughout
8. Keep between 350-450 words
9. Use Times New Roman font, 11pt size, 1.5 line spacing

EXAMPLE FORMAT:
<div style="font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.5;">
  <div style="margin-bottom: 20px;">
    <strong>[Candidate Name]</strong><br>
    [Email]<br>
    <br>
    ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br>
    <br>
    ${companyName}
  </div>
  
  <p>Dear Hiring Manager,</p>
  
  <p>[Opening paragraph...]</p>
  
  <p>[Body paragraphs...]</p>
  
  <p>[Closing paragraph...]</p>
  
  <p>Sincerely,<br><br>[Candidate Name]</p>
</div>

Generate the cover letter HTML now following the exact format above:`;

    const result = await generateWithBedrock(prompt, {
      maxTokens: 2048,
      temperature: 0.7
    });
    // Bedrock response format: result.response.text()
    let coverLetterContent = result.response.text();

    // Clean up markdown if present
    coverLetterContent = coverLetterContent
      .replace(/```html/g, '')
      .replace(/```/g, '')
      .trim();

    // Wrap in proper styling if not already wrapped
    if (!coverLetterContent.includes('<div')) {
      coverLetterContent = `<div style="font-size: 11pt; line-height: 1.5; font-family: 'Times New Roman', Times, serif;">
        ${coverLetterContent}
      </div>`;
    }

    return NextResponse.json({
      success: true,
      content: coverLetterContent,
    });
  } catch (error) {
    console.error("Cover letter generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate cover letter",
      },
      { status: 500 }
    );
  }
}
