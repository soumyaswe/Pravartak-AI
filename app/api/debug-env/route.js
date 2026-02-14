import { NextResponse } from "next/server";

/**
 * Debug route to verify environment variables are available at runtime
 * This is a server-only route - never call this from client components
 */
export async function GET() {
  // Allow in all environments for debugging App Hosting secrets
  // TODO: Disable in production after verifying secrets are working
  return NextResponse.json({
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL 
      ? `${process.env.DATABASE_URL.substring(0, 20)}...` 
      : null,
    databaseUrlLength: process.env.DATABASE_URL?.length ?? 0,
    hasGeminiApiKey: !!process.env.GEMINI_API_KEY,
    geminiApiKeyPrefix: process.env.GEMINI_API_KEY
      ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...`
      : null,
    hasBackendUrl: !!process.env.NEXT_PUBLIC_BACKEND_URL,
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || null,
    hasGoogleCloudProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
    googleCloudProjectId: process.env.GOOGLE_CLOUD_PROJECT_ID || null,
    nodeEnv: process.env.NODE_ENV,
    // Note: We only expose prefixes, not full secret values for security
  });
}

