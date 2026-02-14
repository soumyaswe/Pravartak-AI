import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";
import CvAnalyserView from "./_components/cv-analyser-view";

export const dynamic = 'force-dynamic';

export default async function CvAnalyserPage() {
  try {
    const { isOnboarded } = await getUserOnboardingStatus();

    // If not onboarded, redirect to onboarding page
    if (!isOnboarded) {
      redirect("/onboarding");
    }

    return (
      <div className="w-full py-4 sm:py-6 lg:py-8">
        <CvAnalyserView />
      </div>
    );
  } catch (error) {
    // If authentication fails, redirect to sign-in
    redirect("/sign-in");
  }
}