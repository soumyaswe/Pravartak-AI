import { NextRequest, NextResponse } from "next/server";
import { getVertexAIModel, generateWithFallback } from "@/lib/vertex-ai";

// --- CAREER COUNSELING CHAT API ---
// This API endpoint provides career counseling assistance using Google's Gemini AI via Vertex AI
// Uses service account authentication (no API keys required)
// 
// Guardrails implemented:
// 1. CV/Resume analysis rejection
// 2. Fictional career rejection  
// 3. Off-topic conversation redirection
// 4. Professional and concise responses only

// --- GUARDRAILS AND SYSTEM PROMPT ---
// Local blocklists for immediate refusal without wasting an API call.
const CV_RESUME_BLOCKLIST = [
  'cv', 'resume', 'curriculum vitae', 'analyze my profile', 'review my resume'
];

const FICTIONAL_CAREERS_BLOCKLIST = [
  'jedi', 'wizard', 'dragon rider', 'superhero', 'hobbit', 'elf', 
  'vampire hunter', 'time lord', 'starfleet'
];

// This is the crucial system prompt that instructs the AI on how to behave.
const SYSTEM_PROMPT = `
You are a specialized Career Counseling Assistant. Your sole purpose is to provide helpful, accurate, and realistic information about real-world careers.

Follow these rules strictly:
1.  **Scope:** Only answer questions directly related to careers, jobs, skills, education, professional development, and salaries.
2.  **Refuse Resume/CV Analysis:** You MUST refuse to analyze, review, or give feedback on any text that appears to be a resume, CV, or personal profile. If asked, politely decline and state that you cannot handle personal documents.
3.  **Refuse Fictional Careers:** You MUST refuse to answer any questions about fictional careers (e.g., "how to become a Jedi Knight", "salary of a dragon rider"). Politely state that you only provide information on real-world professions.
4.  **Stay on Topic:** If the user asks a question unrelated to careers (e.g., about movies, recipes, history, general chit-chat), you MUST politely decline and steer the conversation back to career topics.
5.  **Be Concise and Professional:** Provide clear and helpful answers. Do not invent information.
`;

// Initialize Vertex AI models (no API keys required)
let textModel;
let visionModel;

const initializeVertexAI = () => {
  if (textModel) return; // Already initialized
  
  try {
    textModel = getVertexAIModel('gemini-2.0-flash-exp');
    visionModel = getVertexAIModel('gemini-2.0-flash-exp');
    console.log("Vertex AI configured successfully.");
  } catch (error) {
    console.error("Error configuring Vertex AI:", error);
  }
};

// Helper function to detect if a message seems incomplete or fragmented
function isMessageIncomplete(message) {
  const incompletePhrases = [
    /\.\.\.$/, // Ends with ellipsis
    /^and\s+/i, // Starts with "and"
    /^but\s+/i, // Starts with "but"
    /^or\s+/i, // Starts with "or"
    /^also\s+/i, // Starts with "also"
    /^additionally\s+/i, // Starts with "additionally"
    /^furthermore\s+/i, // Starts with "furthermore"
    /^because\s+/i, // Starts with "because"
    /^so\s+/i, // Starts with "so"
    /^then\s+/i, // Starts with "then"
    /^that\s+/i, // Starts with "that"
    /^which\s+/i, // Starts with "which"
    /^where\s+/i, // Starts with "where"
    /^when\s+/i, // Starts with "when"
    /^why\s+/i, // Starts with "why"
    /^how\s+about/i, // Starts with "how about"
    /^what\s+about/i, // Starts with "what about"
  ];

  return incompletePhrases.some(pattern => pattern.test(message.trim()));
}

// Helper function to build conversation context from message history
function buildConversationContext(messageHistory, currentMessage) {
  if (!messageHistory || messageHistory.length === 0) {
    return currentMessage;
  }

  // Get the last few messages for context (limit to last 10 messages to avoid token overflow)
  const recentMessages = messageHistory.slice(-10);
  
  // Format conversation history
  let conversationContext = "Previous conversation:\n";
  recentMessages.forEach(msg => {
    const role = msg.sender === 'user' ? 'User' : 'Assistant';
    conversationContext += `${role}: ${msg.text}\n`;
  });
  
  conversationContext += `\nCurrent User Message: ${currentMessage}`;
  
  return conversationContext;
}

export async function POST(request) {
  try {
    // Initialize Gemini on first request
    initializeVertexAI();
    
    // Check if API is configured
    if (!textModel || !visionModel) {
      return NextResponse.json(
        { 
          error: "Gemini API is not configured. Please check your API key.", 
          success: false 
        },
        { status: 500 }
      );
    }

    const { message, hasImage = false, messageHistory = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { 
          error: "Message is required and must be a string.", 
          success: false 
        },
        { status: 400 }
      );
    }

    const userMessageLower = message.toLowerCase();

    // --- Local Guardrail Checks (Fast Fail) ---
    if (CV_RESUME_BLOCKLIST.some(keyword => userMessageLower.includes(keyword))) {
      return NextResponse.json({
        response: "I'm sorry, but I cannot analyze personal documents like CVs or resumes.",
        success: true
      });
    }

    if (FICTIONAL_CAREERS_BLOCKLIST.some(keyword => userMessageLower.includes(keyword))) {
      return NextResponse.json({
        response: "I can only provide information on real-world careers. Please ask about a non-fictional profession.",
        success: true
      });
    }

    // --- API Call ---
    try {
      // Detect if the message is incomplete and build context if needed
      const messageIsIncomplete = isMessageIncomplete(message);
      const contextualMessage = messageIsIncomplete || messageHistory.length > 0
        ? buildConversationContext(messageHistory, message)
        : message;

      // Validate that contextualMessage is not empty after processing
      if (!contextualMessage || (typeof contextualMessage === 'string' && !contextualMessage.trim())) {
        return NextResponse.json(
          { 
            error: "Message content is empty after processing. Please provide a valid message.", 
            success: false 
          },
          { status: 400 }
        );
      }

      // Prepare the content for the API call with conversation context
      const userMessageText = messageIsIncomplete 
        ? `Note: The user's current message appears to be a continuation or follow-up to previous messages. Consider the conversation history to provide a coherent response.\n\n${contextualMessage}`
        : contextualMessage;
      
      // For text-only prompts, combine into a single string (more reliable than array format)
      // For multimodal prompts with images, we'll use array format
      let finalPrompt;
      if (hasImage) {
        // Use array format for multimodal content (future implementation)
        finalPrompt = [
          { text: SYSTEM_PROMPT },
          { text: userMessageText }
        ];
      } else {
        // Combine into single string for text-only prompts (more reliable)
        finalPrompt = `${SYSTEM_PROMPT}\n\n${userMessageText}`;
        
        // Validate combined prompt is not empty
        if (!finalPrompt || !finalPrompt.trim()) {
          return NextResponse.json(
            { 
              error: "Failed to prepare prompt. Please try again with a valid message.", 
              success: false 
            },
            { status: 400 }
          );
        }
      }
      
      const result = await generateWithFallback(finalPrompt);

      // Vertex AI response format: result.response.candidates[0].content.parts[0].text
      const botResponse = result.response.candidates[0].content.parts[0].text;

      return NextResponse.json({
        response: botResponse,
        success: true
      });

    } catch (apiError) {
      console.error("Error during API call:", apiError);
      return NextResponse.json({
        response: "Sorry, I encountered an error. Please try again later.",
        success: false,
        error: apiError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        success: false 
      },
      { status: 500 }
    );
  }
}