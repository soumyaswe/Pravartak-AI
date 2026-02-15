// Server-side authentication helper for AWS Cognito
// Reads authentication from cookies set by client-side Amplify

import { cookies } from "next/headers";
import { db } from "@/lib/prisma";

export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    
    // Debug: Log all available cookies
    const allCookies = cookieStore.getAll();
    console.log('[auth-server] Available cookies:', allCookies.map(c => c.name).join(', '));
    
    // Try Cognito cookies first (new authentication)
    let userCookie = cookieStore.get('cognito-user');
    let tokenCookie = cookieStore.get('cognito-token');
    let isCognito = true;
    
    console.log('[auth-server] Cognito cookies:', {
      hasCognitoUser: !!userCookie,
      hasCognitoToken: !!tokenCookie
    });
    
    
    if (!userCookie) {
      console.error('[auth-server] No authentication cookie found');
      throw new Error(
        "Authentication required. Please log in to continue."
      );
    }

    let userData;
    try {
      userData = JSON.parse(decodeURIComponent(userCookie.value));
    } catch (parseError) {
      throw new Error("Invalid authentication data. Please log in again.");
    }
    
    const userId = userData.uid;
    
    if (!userId) {
      throw new Error("Invalid user data in authentication cookie. Please log in again.");
    }
    
    console.log(`[auth-server] Authenticating Cognito user: ${userId}`);

    try {
      // Test database connection first
      try {
        await db.$connect();
      } catch (connectError) {
        const errorMessage = connectError.message || String(connectError);
        if (errorMessage.includes("Can't reach database") || 
            errorMessage.includes("connection") ||
            errorMessage.includes("ECONNREFUSED") ||
            errorMessage.includes("localhost:5432")) {
          throw new Error(
            `Database connection failed: Can't reach database server at localhost:5432\n\n` +
            `Please make sure your database server is running at localhost:5432.`
          );
        }
        throw connectError;
      }

      // Find user by cognitoUserId
      const user = await db.user.findUnique({
        where: { cognitoUserId: userId },
      });

      if (!user) {
        // User exists in Cognito but not in database - this is fine, they need to complete onboarding
        console.log(`[auth-server] User ${userId} authenticated but no profile found - needs onboarding`);
        
        // Return a minimal user object instead of throwing
        // This allows the app to recognize them as authenticated but needing onboarding
        return {
          cognitoUserId: userId,
          email: userData.email || null,
          needsOnboarding: true,
          // This will cause isOnboarded to be false, redirecting to /onboarding
          industry: null
        };
      }

      console.log(`[auth-server] User authenticated successfully: ${user.email}`);
      return user;
    } catch (dbError) {
      // Check if it's a database connection error
      if (dbError.message?.includes("Database connection failed") ||
          dbError.message?.includes("Can't reach database") ||
          dbError.message?.includes("DATABASE_URL") || 
          dbError.message?.includes("Environment variable not found") ||
          dbError.message?.includes("connection") ||
          dbError.message?.includes("ECONNREFUSED")) {
        throw new Error(`Database connection failed: ${dbError.message}`);
      }
      // Re-throw other database errors
      throw dbError;
    }
  } catch (error) {
    // Preserve the original error message for better debugging
    if (error.message?.includes("Database connection failed")) {
      throw error;
    }
    throw new Error(`Unauthorized: ${error.message}`);
  }
}