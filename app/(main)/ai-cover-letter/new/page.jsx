import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import CoverLetterGenerator from "../_components/cover-letter-generator";

export default function NewCoverLetterPage() {
  return (
    <div className="py-6">
      <div className="flex flex-col space-y-2 mb-8">
        <Link href="/ai-cover-letter">
          <Button variant="link" className="gap-2 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Cover Letters
          </Button>
        </Link>

        <div className="pb-2">
          <h1 className="text-5xl font-bold mb-2">
            Create Cover Letter
          </h1>
          <p className="text-muted-foreground text-lg">
            Generate a tailored cover letter for your job application
          </p>
        </div>
      </div>

      <CoverLetterGenerator />
    </div>
  );
}
