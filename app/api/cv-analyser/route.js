import { NextRequest, NextResponse } from "next/server";
import { generateWithBedrock, BEDROCK_MODELS } from "@/lib/bedrock-client";
import mammoth from "mammoth";
import { marked } from "marked";

// --- CV ANALYZER API (CONVERTED FROM PYTHON) ---
// This API endpoint provides CV/Resume analysis using Google's Gemini API
// Uses Gemini REST API for better PDF support and simpler configuration
// 
// Features implemented from Python version:
// 1. Fictional job title blocklist
// 2. Structured analysis (Current Assessment, Suggestions, Skill Gap)
// 3. PDF, DOCX, and image support
// 4. Professional scoring system

// --- FICTIONAL JOBS BLOCKLIST (EXACT FROM PYTHON) ---
const FICTIONAL_JOBS_BLOCKLIST = [
  'jedi', 'wizard', 'dragon rider', 'superhero', 'hobbit', 'elf', 'vampire hunter', 
  'time lord', 'starfleet', 'hogwarts professor', 'quidditch player', 'stormtrooper',
  'king', 'queen', 'emperor', 'mythical creature'
];

// --- SYSTEM PROMPT (EXACT FROM PYTHON) ---
const SYSTEM_PROMPT = `
You are an expert career coach and professional resume analyzer.
You will be given the contents of a resume (either as text extracted from a PDF or an image) and a target job title.
Your task is to provide a detailed analysis of the resume for that specific job title.

# --- ADDED RULE ---
If the target job title is clearly fictional, nonsensical, or not a real-world profession (e.g., 'Wizard of Oz', 'Superhero Sidekick'), you MUST politely refuse the analysis and state that you can only analyze resumes for real-world jobs.

Your analysis for valid jobs MUST be structured into the following three sections, using Markdown for formatting:

## 1. Current Assessment
Provide an honest evaluation of the resume's current effectiveness for the target role.
- Mention its strengths (e.g., clear layout, strong action verbs).
- Mention its weaknesses (e.g., missing quantifiable results, generic summary).
- Conclude with a score from 1 to 10, where 1 is poor and 10 is excellent.

## 2. Suggestions for Improvement
Provide a list of concrete, actionable suggestions to improve the resume.
- Be specific. For example, instead of "Improve bullet points," suggest "Rephrase bullet points to start with strong action verbs and include a quantifiable result, like 'Increased user engagement by 15%'."
- Suggest missing sections if applicable (e.g., Professional Summary, Technical Skills).

## 3. Skill Gap & Potential Analysis
Identify key skills or qualifications that are critical for the target job title but are missing from the resume.
- List the missing skills (e.g., Python, Project Management, SEO, AWS certification).
- Explain how adding these skills would improve the resume's quality.
- Provide a "Potential Score" out of 10 that the user could achieve if they incorporated both the improvements and the missing skills.

IMPORTANT: You must not do anything other than this analysis. Do not offer to rewrite the resume, do not write a cover letter, and do not engage in any conversation beyond providing these three sections of analysis.
`;

// Function to convert Markdown to HTML
function formatAnalysisOutput(rawAnalysis) {
  try {
    // Configure marked options for better rendering
    marked.setOptions({
      breaks: true, // Convert line breaks to <br>
      gfm: true, // Enable GitHub Flavored Markdown
      headerIds: false, // Disable header IDs for cleaner output
      mangle: false // Don't mangle autolinks
    });
    
    // Convert Markdown to HTML
    const htmlOutput = marked.parse(rawAnalysis);
    
    return htmlOutput;
  } catch (error) {
    console.error("Error parsing Markdown:", error);
    // Fallback to original text if parsing fails
    return rawAnalysis;
  }
}

// Vertex AI model - initialized on demand
function getModel() {
  return getVertexAIModel('gemini-2.0-flash-exp');
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const jobTitle = formData.get("jobTitle");

    // Validation (exact from Python logic)
    if (!jobTitle || typeof jobTitle !== 'string' || !jobTitle.trim()) {
      return NextResponse.json(
        { 
          error: "Please enter a target job title.", 
          success: false 
        },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { 
          error: "Please upload a CV/Resume file.", 
          success: false 
        },
        { status: 400 }
      );
    }

    const userInputLower = jobTitle.toLowerCase();

    // --- FAST-FAIL GUARDRAIL CHECK (EXACT FROM PYTHON) ---
    const hasBlockedWord = FICTIONAL_JOBS_BLOCKLIST.some(keyword => {
      // Using word boundary regex like in Python
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(userInputLower);
    });

    if (hasBlockedWord) {
      return NextResponse.json(
        { 
          error: "Please enter a real-world job title. Fictional or irrelevant jobs cannot be analyzed.", 
          success: false 
        },
        { status: 400 }
      );
    }

    // Validate file type (supporting PDF, DOCX, and images like Python version)
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "image/png", 
      "image/jpeg", 
      "image/jpg",
      "image/webp",
      "text/plain"
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          error: `Unsupported file type '${file.type}'. Please upload a PDF, DOCX, or an image (PNG, JPG, WEBP).`, 
          success: false 
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          error: "File size too large. Please upload files smaller than 5MB.", 
          success: false 
        },
        { status: 400 }
      );
    }

    try {
      console.log(`Analyzing file: ${file.name} for job: ${jobTitle}`);
      
      // Prepare prompt for Gemini API
      // Gemini API accepts strings or arrays with text/inlineData parts
      const jobTitlePrompt = `\nHere is the analysis request:\n**Target Job Title:** ${jobTitle}\n\n**Resume Content:**\n`;
      const promptParts = [];

      // Handle different file types like Python version
      if (file.type === "application/pdf") {
        // Handle PDF files - try text extraction first, fallback to image processing
        try {
          const pdfParse = (await import("pdf-parse")).default;
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          console.log(`Processing PDF file: ${file.name}, size: ${file.size} bytes`);
          
          const pdfData = await pdfParse(buffer);
          const fileContent = pdfData.text;
          
          console.log(`Extracted text length: ${fileContent ? fileContent.length : 0} characters`);
          console.log(`Extracted text preview: "${fileContent ? fileContent.substring(0, 100) : 'null'}"`);
          
          if (!fileContent || typeof fileContent !== 'string' || !fileContent.trim()) {
            console.log("No text extracted from PDF - likely a scanned/image-based PDF");
            return NextResponse.json(
              { 
                error: "Unable to extract text from this PDF. The PDF appears to be scanned or image-based. Please ensure your PDF contains selectable text, or upload it as an image (PNG, JPG) instead.", 
                success: false 
              },
              { status: 400 }
            );
          } else {
            // Validate fileContent is not empty before adding
            const trimmedContent = fileContent.trim();
            if (!trimmedContent) {
              console.log("Extracted text is empty after trimming");
              return NextResponse.json(
                { 
                  error: "Unable to extract text from this PDF. The PDF appears to be empty or scanned. Please ensure your PDF contains selectable text, or upload it as an image (PNG, JPG) instead.", 
                  success: false 
                },
                { status: 400 }
              );
            } else {
              // Add text content for Gemini API
              promptParts.push({ text: trimmedContent });
              console.log(`PDF text extracted successfully: ${trimmedContent.length} characters`);
            }
          }
        } catch (pdfError) {
          console.error("Error processing PDF file:", pdfError);
          console.error("PDF error details:", pdfError.message);
          
          // Fallback: Send PDF directly to Gemini API (it can handle PDFs)
          try {
            console.log("Attempting fallback: sending PDF directly to Gemini API");
            const bytes = await file.arrayBuffer();
            const base64 = Buffer.from(bytes).toString('base64');
            promptParts.push({
              inlineData: {
                data: base64,
                mimeType: "application/pdf"
              }
            });
            console.log("PDF sent directly to Gemini API for OCR processing");
          } catch (fallbackError) {
            console.error("Fallback method also failed:", fallbackError);
            return NextResponse.json(
              { 
                error: `Failed to process the PDF file. Error: ${pdfError.message}. Please ensure it's a valid PDF document.`, 
                success: false 
              },
              { status: 400 }
            );
          }
        }
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        // Handle DOCX files using mammoth
        try {
          const bytes = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ buffer: bytes });
          const fileContent = result.value;
          
          if (!fileContent.trim()) {
            return NextResponse.json(
              { 
                error: "Could not extract any text from the DOCX file. The file might be empty or corrupted.", 
                success: false 
              },
              { status: 400 }
            );
          }
          promptParts.push({ text: fileContent });
        } catch (docxError) {
          console.error("Error processing DOCX file:", docxError);
          return NextResponse.json(
            { 
              error: "Failed to process the DOCX file. Please ensure it's a valid Word document.", 
              success: false 
            },
            { status: 400 }
          );
        }
      } else if (file.type === "text/plain") {
        // Handle plain text files
        const fileContent = await file.text();
        if (!fileContent.trim()) {
          return NextResponse.json(
            { 
              error: "Could not extract any text from the file. The file might be empty or corrupted.", 
              success: false 
            },
            { status: 400 }
          );
        }
        promptParts.push({ text: fileContent });
      } else if (file.type.startsWith("image/")) {
        // Handle images (convert to base64 for Gemini)
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        
        if (!base64 || base64.length === 0) {
          return NextResponse.json(
            { 
              error: "Failed to process the image file. The file may be corrupted.", 
              success: false 
            },
            { status: 400 }
          );
        }
        
        promptParts.push({
          inlineData: {
            data: base64,
            mimeType: file.type
          }
        });
      } else {
        // Unknown file type - should not reach here due to earlier validation, but handle gracefully
        console.error(`Unexpected file type: ${file.type}`);
        return NextResponse.json(
          { 
            error: `Unsupported file type '${file.type}'. Please upload a PDF, DOCX, or an image (PNG, JPG, WEBP).`, 
            success: false 
          },
          { status: 400 }
        );
      }

      // Validate that we have file content
      if (!promptParts || promptParts.length === 0) {
        console.error('❌ CV Analyser: No file content extracted');
        return NextResponse.json(
          { 
            error: "Failed to process the file content. The file may be empty or corrupted. Please try uploading again.", 
            success: false 
          },
          { status: 400 }
        );
      }

      // Ensure at least one part has valid content
      const hasValidContent = promptParts.some(part => {
        if (part.text && typeof part.text === 'string' && part.text.trim().length > 0) {
          return true;
        }
        if (part.inlineData && part.inlineData.data && part.inlineData.data.length > 0) {
          return true;
        }
        return false;
      });

      if (!hasValidContent) {
        console.error('❌ CV Analyser: No valid content found in promptParts');
        return NextResponse.json(
          { 
            error: "No valid content found in the file. Please ensure the file contains text or is a valid document.", 
            success: false 
          },
          { status: 400 }
        );
      }

      // Log prompt structure for debugging
      console.log("📋 Preparing prompt for Gemini API...");
      console.log(`   Prompt parts: ${promptParts.length}`);
      
      // Convert to Gemini API format
      // Gemini API accepts: string or array of { text: string } or { inlineData: {...} }
      const hasInlineData = promptParts.some(part => part.inlineData);
      
      let finalPrompt;
      
      // Build the complete prompt with system prompt and job title
      const systemAndJobPrompt = `${SYSTEM_PROMPT}${jobTitlePrompt}`;
      
      if (hasInlineData) {
        // Multimodal: text + inlineData (PDF/image)
        const inlineDataPart = promptParts.find(part => part.inlineData);
        const textParts = promptParts.filter(part => part.text).map(p => p.text);
        const combinedText = textParts.length > 0 ? textParts.join('\n\n') : '';
        
        // Combine system prompt + job title + file content (if text) + inlineData
        finalPrompt = [
          { text: systemAndJobPrompt + (combinedText ? `\n\n${combinedText}` : '') },
          inlineDataPart
        ];
        console.log(`✅ Multimodal prompt: text + ${inlineDataPart.inlineData.mimeType}`);
      } else {
        // Text-only: combine everything into a single string
        const textParts = promptParts.map(part => part.text).filter(text => text && text.trim());
        const combinedText = textParts.join('\n\n');
        
        if (!combinedText || !combinedText.trim()) {
          console.error('❌ CV Analyser: No text content found');
          return NextResponse.json(
            { 
              error: "Failed to prepare prompt content. The file may be empty or corrupted.", 
              success: false 
            },
            { status: 400 }
          );
        }
        
        finalPrompt = systemAndJobPrompt + combinedText;
        console.log(`✅ Text-only prompt: ${finalPrompt.length} characters`);
      }
      
      // Validate prompt
      if ((typeof finalPrompt === 'string' && !finalPrompt.trim()) || 
          (Array.isArray(finalPrompt) && finalPrompt.length === 0)) {
        console.error('❌ CV Analyser: finalPrompt is empty');
        return NextResponse.json(
          { 
            error: "Failed to prepare prompt. The file content appears to be empty.", 
            success: false 
          },
          { status: 400 }
        );
      }
      
      console.log(`📤 Sending prompt to Bedrock API (type: ${typeof finalPrompt})`);
      
      // Check for API key
      if (!process.env.BEDROCK_API_KEY) {
        console.error('❌ BEDROCK_API_KEY not found in environment variables');
        return NextResponse.json(
          { 
            error: "Server configuration error: Bedrock API key not found. Please contact support.", 
            success: false 
          },
          { status: 500 }
        );
      }
      
      // Generate content with Bedrock API (using fallback for reliability)
      const result = await generateWithBedrock(finalPrompt, {
        fallbackModels: BEDROCK_MODELS,
        maxTokens: 4096,
        temperature: 0.7
      });
      // Bedrock API response format: result.response.text()
      const rawAnalysis = result.response.text();
      
      // Format the analysis to remove Markdown symbols while preserving structure
      const formattedAnalysis = formatAnalysisOutput(rawAnalysis);

      return NextResponse.json({
        success: true,
        analysis: formattedAnalysis,
        fileName: file.name,
        fileSize: file.size,
        jobTitle: jobTitle
      });

    } catch (analysisError) {
      console.error("An unexpected error occurred:", analysisError);
      return NextResponse.json(
        { 
          error: `An unexpected error occurred during analysis. Please check the console for details. Error: ${analysisError.message}`, 
          success: false 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error in CV analysis API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error. Please try again later.", 
        success: false 
      },
      { status: 500 }
    );
  }
}