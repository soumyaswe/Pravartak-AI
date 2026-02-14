import ResumeBuilder from "../_components/resume-builder";

export const dynamic = 'force-dynamic';

export default function NewResumePage() {
  return (
    <div className="w-full py-6">
      <ResumeBuilder mode="create" />
    </div>
  );
}