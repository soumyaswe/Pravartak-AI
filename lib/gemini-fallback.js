import { GoogleGenerativeAI } from '@google/generative-ai';

// Fallback models in priority order
export const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash'
];

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} baseDelay - Base delay in milliseconds (default: 1000)
 * @returns {Promise<any>} - Result of the function
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
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
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms due to ${is503 ? '503' : '429'} error`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Try multiple Gemini models with fallback
 * @param {string} apiKey - Gemini API key
 * @param {string|object} prompt - Prompt to send to the model
 * @param {string[]} models - List of models to try (default: MODELS)
 * @returns {Promise<any>} - Result from the successful model
 */
export async function generateWithFallback(apiKey, prompt, models = MODELS) {
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;
  
  for (const modelName of models) {
    try {
      console.log(`Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await retryWithBackoff(async () => {
        return await model.generateContent(prompt);
      });
      
      console.log(`Successfully generated content with ${modelName}`);
      return result;
    } catch (error) {
      console.log(`Model ${modelName} failed:`, error.message);
      lastError = error;
      // Continue to next model
    }
  }
  
  // All models failed
  throw lastError || new Error('All Gemini models failed');
}

/**
 * Get a Gemini model instance with fallback capability
 * @param {string} apiKey - Gemini API key
 * @param {string} modelName - Preferred model name (default: first in MODELS)
 * @returns {object} - Model instance with fallback generateContent method
 */
export function getModelWithFallback(apiKey, modelName = MODELS[0]) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const primaryModel = genAI.getGenerativeModel({ model: modelName });
  
  // Wrap generateContent with fallback logic
  return {
    ...primaryModel,
    generateContent: async (prompt) => {
      return await generateWithFallback(apiKey, prompt);
    }
  };
}
