/**
 * Vertex AI Server Utility for Next.js
 * 
 * This module provides secure server-side access to Vertex AI (Gemini models)
 * using Application Default Credentials (ADC) from Google Cloud.
 * Environment variables are read at runtime for proper Cloud Run deployment.
 * 
 * ✅ Security: No API keys stored or exposed to frontend
 * ✅ Firebase/GCP: Works automatically with service account on Cloud Run/Functions
 * ✅ Local Dev: Uses GOOGLE_APPLICATION_CREDENTIALS environment variable
 * 
 * Usage in API routes:
 *   import { getVertexAIModel, generateWithFallback } from '@/lib/vertex-ai';
 *   const model = getVertexAIModel('gemini-1.5-flash');
 *   const result = await model.generateContent(prompt);
 */

import { VertexAI } from '@google-cloud/vertexai';

// Fallback models in priority order - using latest stable models
// Gemini 2.0 Flash is the fastest and most cost-effective
const MODELS = [
  'gemini-2.0-flash-exp',  // Latest Gemini 2.0 (experimental but stable)
  'gemini-1.5-flash',      // Stable Gemini 1.5 fallback
  'gemini-2.5-flash',      // Gemini 2.5 stable (no -exp suffix - that format is for REST API only, not Vertex AI)
];

// Singleton instance
let vertexAIInstance = null;

/**
 * Get the GCP Project ID from multiple sources
 * @returns {string|null} Project ID or null if not found
 */
function getProjectId() {
  // Try explicit project ID environment variables first
  if (process.env.GOOGLE_CLOUD_PROJECT_ID) return process.env.GOOGLE_CLOUD_PROJECT_ID;
  if (process.env.GCP_PROJECT_ID) return process.env.GCP_PROJECT_ID;
  if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
  if (process.env.GOOGLE_CLOUD_PROJECT) return process.env.GOOGLE_CLOUD_PROJECT;
  if (process.env.GCP_PROJECT) return process.env.GCP_PROJECT;
  
  // Try to extract from FIREBASE_CONFIG (automatically set by Firebase App Hosting)
  if (process.env.FIREBASE_CONFIG) {
    try {
      const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
      if (firebaseConfig.projectId) {
        return firebaseConfig.projectId;
      }
    } catch (error) {
      console.warn('Failed to parse FIREBASE_CONFIG:', error.message);
    }
  }
  
  // Fallback to NEXT_PUBLIC variable (available at build time)
  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  }
  
  return null;
}

/**
 * Initialize Vertex AI with Application Default Credentials
 * @returns {VertexAI} Initialized Vertex AI instance
 */
function getVertexAI() {
  if (!vertexAIInstance) {
    // Read environment variables at runtime (not at module load time)
    const PROJECT_ID = getProjectId();
    const LOCATION = process.env.GOOGLE_CLOUD_REGION || 'us-central1';
    
    if (!PROJECT_ID) {
      console.error('❌ Available env vars:', Object.keys(process.env).filter(k => k.includes('PROJECT') || k.includes('FIREBASE')));
      throw new Error('GOOGLE_CLOUD_PROJECT_ID or GCP_PROJECT_ID environment variable is required');
    }

    console.log(`🔷 Initializing Vertex AI (Project: ${PROJECT_ID}, Region: ${LOCATION})`);
    
    vertexAIInstance = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
    });
  }
  return vertexAIInstance;
}

/**
 * Get a Generative Model instance
 * @param {string} modelName - Model name (e.g., 'gemini-1.5-flash')
 * @returns {GenerativeModel} Generative model instance
 */
export function getVertexAIModel(modelName = 'gemini-1.5-flash') {
  const vertexAI = getVertexAI();
  return vertexAI.getGenerativeModel({ model: modelName });
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<any>} Result from function
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastRetry = i === maxRetries - 1;
      const is503 = error.message?.includes('503') || error.message?.includes('overloaded');
      const is429 = error.message?.includes('429') || error.message?.includes('quota');
      
      // Don't retry if it's not a retryable error
      if (!is503 && !is429) {
        throw error;
      }
      
      if (isLastRetry) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, i);
      console.log(`⚠️ Vertex AI: Retry ${i + 1}/${maxRetries} after ${delay}ms due to ${is503 ? '503' : '429'} error`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Validate that prompt has content before sending to Vertex AI
 * @param {string|object|array} prompt - Prompt to validate
 * @returns {boolean} True if prompt has valid content
 */
function validatePrompt(prompt) {
  if (!prompt) {
    return false;
  }
  
  // String prompt must not be empty
  if (typeof prompt === 'string') {
    return prompt.trim().length > 0;
  }
  
  // Array prompt must have at least one non-empty element
  if (Array.isArray(prompt)) {
    if (prompt.length === 0) {
      return false;
    }
    
    // Check if at least one element has content
    // Vertex AI arrays should contain objects with 'text' or 'inlineData' properties
    return prompt.some(item => {
      if (typeof item === 'string') {
        // Legacy support: plain strings are valid but will be converted
        return item.trim().length > 0;
      }
      if (typeof item === 'object' && item !== null) {
        // Check for inlineData (for images/files)
        if (item.inlineData && item.inlineData.data && item.inlineData.data.length > 0) {
          return true;
        }
        // Check for text property (required format for Vertex AI arrays)
        if (item.text && typeof item.text === 'string' && item.text.trim().length > 0) {
          return true;
        }
        // Check for fileData (for uploaded files)
        if (item.fileData && (item.fileData.fileUri || item.fileData.mimeType)) {
          return true;
        }
        // Empty object is invalid
        return false;
      }
      return false;
    });
  }
  
  // Object prompt must have some content
  if (typeof prompt === 'object') {
    return Object.keys(prompt).length > 0;
  }
  
  return false;
}

/**
 * Generate content with automatic model fallback
 * @param {string|object|array} prompt - Text prompt or structured request
 * @param {string[]} models - Array of model names to try (default: MODELS)
 * @returns {Promise<object>} Generation result
 */
export async function generateWithFallback(prompt, models = MODELS) {
  // Validate prompt before attempting to generate
  if (!validatePrompt(prompt)) {
    const errorMsg = 'Prompt is empty or invalid. At least one content field is required.';
    console.error(`❌ Vertex AI: ${errorMsg}`);
    console.error(`   Prompt type: ${typeof prompt}`);
    console.error(`   Prompt value:`, typeof prompt === 'string' ? `"${prompt.substring(0, 100)}..."` : JSON.stringify(prompt).substring(0, 200));
    throw new Error(errorMsg);
  }
  
  let lastError = null;
  
  for (const modelName of models) {
    try {
      console.log(`🔷 Vertex AI: Trying model: ${modelName}`);
      
      // Log prompt details before sending
      if (typeof prompt === 'string') {
        console.log(`   📝 Prompt type: string, length: ${prompt.length}`);
      } else if (Array.isArray(prompt)) {
        console.log(`   📝 Prompt type: array, length: ${prompt.length}`);
        prompt.forEach((part, idx) => {
          if (typeof part === 'string') {
            console.log(`      [${idx}] string: "${part.substring(0, 50)}..."`);
          } else if (part && typeof part === 'object') {
            if (part.text) {
              console.log(`      [${idx}] text: "${part.text.substring(0, 50)}..."`);
            } else if (part.inlineData) {
              console.log(`      [${idx}] inlineData: ${part.inlineData.mimeType}, ${part.inlineData.data?.length || 0} bytes`);
            }
          }
        });
      }
      
      const model = getVertexAIModel(modelName);
      
      const result = await retryWithBackoff(async () => {
        return await model.generateContent(prompt);
      });
      
      console.log(`✅ Vertex AI: Successfully generated content with ${modelName}`);
      return result;
    } catch (error) {
      console.log(`❌ Vertex AI: Model ${modelName} failed:`, error.message);
      lastError = error;
      // Continue to next model
    }
  }
  
  // All models failed
  throw lastError || new Error('All Vertex AI models failed');
}

/**
 * Generate content with streaming support
 * @param {string|object} prompt - Text prompt or structured request
 * @param {string} modelName - Model name (default: 'gemini-1.5-flash')
 * @returns {Promise<AsyncIterable>} Stream of responses
 */
export async function generateContentStream(prompt, modelName = 'gemini-1.5-flash') {
  const model = getVertexAIModel(modelName);
  return await model.generateContentStream(prompt);
}

/**
 * Check if Vertex AI is properly configured
 * @returns {boolean} True if configured
 */
export function isVertexAIConfigured() {
  return !!getProjectId();
}

export default {
  getVertexAIModel,
  generateWithFallback,
  generateContentStream,
  isVertexAIConfigured,
  MODELS,
};
