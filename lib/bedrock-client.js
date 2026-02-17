import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

// Default model ID from environment
const DEFAULT_MODEL_ID = process.env.MODEL_ID;

// Fallback models in priority order
export const BEDROCK_MODELS = [
  "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
  "anthropic.claude-3-5-sonnet-20240620-v1:0",
  "anthropic.claude-3-sonnet-20240229-v1:0"
];

/**
 * Create a Bedrock Runtime client
 * @returns {BedrockRuntimeClient} - Configured Bedrock client
 */
function createBedrockClient() {
  const apiKey = process.env.BEDROCK_API_KEY;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  
  if (!apiKey) {
    throw new Error("BEDROCK_API_KEY environment variable is not set");
  }

  // Extract region from environment or default to us-east-1
  const region = "us-east-1";

  // For API key-based authentication with Bedrock
  // The API key format is typically base64 encoded credentials
  let credentials;
  
  try {
    // Decode the API key if it's in AWS format (base64)
    if (apiKey.startsWith("ABSK")) {
      // AWS API keys are base64 encoded after the colon
      const parts = apiKey.split(":");
      if (parts.length === 2) {
        const decoded = Buffer.from(parts[1], 'base64').toString('utf8');
        // Parse decoded credentials (format may vary)
        credentials = {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
        };
      } else {
        credentials = {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
        };
      }
    } else {
      // Standard AWS credentials
      credentials = {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      };
    }
  } catch (error) {
    console.error("Error parsing API key:", error);
    // Fallback to using the key directly
    credentials = {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    };
  }

  return new BedrockRuntimeClient({
    region: region,
    credentials: credentials
  });
}

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
      const isThrottling = error.name === 'ThrottlingException' || error.$metadata?.httpStatusCode === 429;
      const isServiceUnavailable = error.name === 'ServiceUnavailableException' || error.$metadata?.httpStatusCode === 503;
      
      // Don't retry if it's not a retryable error
      if (!isThrottling && !isServiceUnavailable) {
        throw error;
      }
      
      if (isLastRetry) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms due to ${error.name || error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Generate content using Bedrock with fallback models
 * @param {string|object} prompt - Prompt to send to the model (string or array of content parts)
 * @param {object} options - Configuration options
 * @param {string} options.modelId - Model ID (default: from env or DEFAULT_MODEL_ID)
 * @param {number} options.maxTokens - Maximum tokens to generate (default: 2048)
 * @param {number} options.temperature - Temperature for generation (default: 0.7)
 * @param {string[]} options.fallbackModels - Models to try in order (default: BEDROCK_MODELS)
 * @returns {Promise<object>} - Response object with text() method for compatibility
 */
export async function generateWithBedrock(prompt, options = {}) {
  const {
    modelId = DEFAULT_MODEL_ID,
    maxTokens = 2048,
    temperature = 0.7,
    fallbackModels = BEDROCK_MODELS
  } = options;

  const client = createBedrockClient();
  let lastError = null;

  // Normalize prompt to message format
  let messageContent;
  if (typeof prompt === 'string') {
    messageContent = [{ text: prompt }];
  } else if (Array.isArray(prompt)) {
    // Convert array format to Bedrock format
    messageContent = prompt.map(part => {
      if (part.text) return { text: part.text };
      if (part.inlineData) {
        return {
          image: {
            format: part.inlineData.mimeType.split('/')[1], // e.g., "jpeg" from "image/jpeg"
            source: {
              bytes: Buffer.from(part.inlineData.data, 'base64')
            }
          }
        };
      }
      return part;
    });
  } else {
    messageContent = [{ text: String(prompt) }];
  }

  // Try primary model first, then fallbacks
  const modelsToTry = [modelId, ...fallbackModels.filter(m => m !== modelId)];

  for (const currentModel of modelsToTry) {
    try {
      console.log(`Trying Bedrock model: ${currentModel}`);

      const command = new ConverseCommand({
        modelId: currentModel,
        messages: [
          {
            role: "user",
            content: messageContent
          }
        ],
        inferenceConfig: {
          maxTokens: maxTokens,
          temperature: temperature
        }
      });

      const response = await retryWithBackoff(async () => {
        return await client.send(command);
      });

      console.log(`Successfully generated content with ${currentModel}`);

      // Return response in Gemini-compatible format
      return {
        response: {
          text: () => response.output.message.content[0].text,
          candidates: [{
            content: {
              parts: [{
                text: response.output.message.content[0].text
              }]
            }
          }]
        }
      };
    } catch (error) {
      console.log(`Model ${currentModel} failed:`, error.message);
      lastError = error;

      // Handle specific AWS Bedrock errors
      if (error.name === 'AccessDeniedException') {
        console.error('Access denied. Check your Bedrock API credentials and permissions.');
      } else if (error.name === 'ValidationException') {
        console.error('Validation error. Check your request parameters.');
      }
      
      // Continue to next model
    }
  }

  // All models failed
  throw lastError || new Error('All Bedrock models failed');
}

/**
 * Get a Bedrock model wrapper with generateContent method (Gemini-compatible API)
 * @param {string} modelId - Model ID (default: from env or DEFAULT_MODEL_ID)
 * @param {object} config - Configuration options
 * @returns {object} - Model wrapper with generateContent method
 */
export function getBedrockModel(modelId = DEFAULT_MODEL_ID, config = {}) {
  return {
    modelId,
    generateContent: async (prompt) => {
      return await generateWithBedrock(prompt, {
        modelId,
        ...config
      });
    }
  };
}

/**
 * Bedrock client with fallback capability (replaces getModelWithFallback from gemini-fallback)
 * @param {string} apiKey - API key (now ignored, uses env var)
 * @param {string} modelId - Preferred model ID
 * @returns {object} - Model instance with fallback generateContent method
 */
export function getModelWithFallback(apiKey = null, modelId = DEFAULT_MODEL_ID) {
  // apiKey parameter is kept for API compatibility but not used
  // Bedrock uses BEDROCK_API_KEY from environment
  return getBedrockModel(modelId);
}

const bedrockClient = {
  generateWithBedrock,
  getBedrockModel,
  getModelWithFallback,
  retryWithBackoff,
  BEDROCK_MODELS
};

export default bedrockClient;
