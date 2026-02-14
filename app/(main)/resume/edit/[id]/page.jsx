import { getResumeById } from "@/actions/resume";
import ResumeBuilder from "../../_components/resume-builder";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditResumePage({ params }) {
  const { id } = await params;
  
  let resume = null;
  try {
    resume = await getResumeById(id);
  } catch (error) {
    console.error("Error fetching resume:", error);
    notFound();
  }

  if (!resume) {
    notFound();
  }

  return (
    <div className="w-full py-6">
      <ResumeBuilder mode="edit" initialResume={resume} />
    </div>
  );
}