import { getResumes } from "@/actions/resume";
import ResumeOptions from "./_components/resume-options.jsx";

export const dynamic = 'force-dynamic';

export default async function ResumePage() {
  // Get all user's resumes to show existing ones
  let existingResumes = [];
  try {
    existingResumes = await getResumes();
  } catch (error) {
    console.error("Error fetching resumes:", error);
    // Don't block the page if there's an error
  }

  return (
    <div className="w-full py-6">
      <ResumeOptions existingResumes={existingResumes} />
    </div>
  );
}
