import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";
import CvAnalyserView from "./_components/cv-analyser-view";

export const dynamic = 'force-dynamic';

export default async function CvAnalyserPage() {
  try {
    const onboardingStatus = await getUserOnboardingStatus();
    
    // Log the status for debugging
    console.log('[cv-analyser] Onboarding status:', onboardingStatus);
    
    // If there's a database error but user is authenticated, allow access
    // (User is logged in, just couldn't check onboarding status)
    if (onboardingStatus.dbError) {
      console.warn('[cv-analyser] Database error detected, but user is authenticated. Allowing access.');
      // Allow access despite DB error since user IS authenticated
      return (
        <div className="w-full py-4 sm:py-6 lg:py-8">
          <CvAnalyserView />
        </div>
      );
    }

    // If not onboarded, redirect to onboarding page
    if (!onboardingStatus.isOnboarded) {
      console.log('[cv-analyser] User not onboarded, redirecting to /onboarding');
      redirect("/onboarding");
    }

    return (
      <div className="w-full py-4 sm:py-6 lg:py-8">
        <CvAnalyserView />
      </div>
    );
  } catch (error) {
    console.error('[cv-analyser] Caught error:', error.message);
    
    // Only redirect to sign-in for actual authentication errors
    if (error.message?.includes("Authentication required") || 
        error.message?.includes("not authenticated") ||
        error.message?.includes("Unauthorized")) {
      console.log('[cv-analyser] Authentication error detected, redirecting to /sign-in');
      redirect("/sign-in");
    }
    
    // For other errors, re-throw to show Next.js error page
    throw error;
  }
}