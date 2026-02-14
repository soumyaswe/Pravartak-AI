import { getIndustryInsights } from "@/actions/dashboard";
import DashboardView from "./_component/dashboard-view";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  try {
    const onboardingStatus = await getUserOnboardingStatus();
    
    // Check if there was an error (e.g., database connection)
    const hasError = onboardingStatus.error;
    const isDatabaseError = hasError && (
      onboardingStatus.error.includes("Database connection") || 
      onboardingStatus.error.includes("database") ||
      onboardingStatus.error.includes("server error") ||
      onboardingStatus.error.includes("Failed to check") ||
      onboardingStatus.error.includes("connection")
    );
    const isAuthError = hasError && (
      onboardingStatus.error.includes("Authentication") || 
      onboardingStatus.error.includes("not authenticated") ||
      onboardingStatus.error.includes("log in") ||
      onboardingStatus.error.includes("User not authenticated")
    );

    // If it's a database error, show the page with error state instead of redirecting
    if (isDatabaseError) {
      console.error("Database error in industry insights:", onboardingStatus.error);
      const insights = await getIndustryInsights().catch(() => null);
      return (
        <div className="w-full">
          <DashboardView insights={insights} needsOnboarding={false} />
        </div>
      );
    }

    // If it's an authentication error, redirect to sign-in
    if (isAuthError) {
      redirect("/sign-in");
    }

    const { isOnboarded } = onboardingStatus;

    // If user is not onboarded, still show the page but getIndustryInsights will return null
    // This allows users to see the page structure and be prompted to complete onboarding
    // Only redirect to onboarding if it's an authentication issue (handled above)
    
    // If there was an error but it's not database/auth, show the page anyway
    if (hasError && !isDatabaseError && !isAuthError) {
      console.warn("Unknown error in onboarding status:", onboardingStatus.error);
      const insights = await getIndustryInsights().catch(() => null);
      return (
        <div className="w-full">
          <DashboardView insights={insights} needsOnboarding={!isOnboarded} />
        </div>
      );
    }

    // Try to get insights - will return null if user has no industry set
    const insights = await getIndustryInsights().catch(() => null);
    
    // If user is not onboarded, show the page with a prompt to complete onboarding
    if (!isOnboarded) {
      return (
        <div className="w-full">
          <DashboardView insights={insights} needsOnboarding={true} />
        </div>
      );
    }

    return (
      <div className="w-full">
        <DashboardView insights={insights} needsOnboarding={false} />
      </div>
    );
  } catch (error) {
    // Only redirect to sign-in if it's an authentication error
    // Database errors should be handled gracefully
    console.error("Error in industry insights page:", error);
    
    if (error.message?.includes("Authentication") || 
        error.message?.includes("Unauthorized") ||
        error.message?.includes("not authenticated") ||
        error.message?.includes("log in")) {
      redirect("/sign-in");
    }
    
    // For other errors (like database), try to show the page anyway
    const insights = await getIndustryInsights().catch(() => null);
    return (
      <div className="w-full">
        <DashboardView insights={insights} needsOnboarding={false} />
      </div>
    );
  }
}
