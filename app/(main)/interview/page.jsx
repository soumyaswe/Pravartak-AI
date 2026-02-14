"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getAssessments } from "@/actions/interview";
import StatsCards from "./_components/stats-cards";
import PerformanceChart from "./_components/performace-chart";
import QuizList from "./_components/quiz-list";
import { Loader2 } from "lucide-react";

export default function InterviewPrepPage() {
  const { user, loading: authLoading } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadAssessments() {
      if (authLoading) return;
      
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Add small delay to ensure cookies are set
        await new Promise(resolve => setTimeout(resolve, 200));
        const data = await getAssessments();
        setAssessments(data || []);
        setError(null);
      } catch (err) {
        console.error("Failed to load assessments:", err);
        setError(err.message);
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    }

    loadAssessments();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-destructive">Failed to load assessments</p>
        <button 
          onClick={() => window.location.reload()}
          className="text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-6xl font-bold gradient-title">
          Practice Questions
        </h1>
      </div>
      <div className="space-y-6">
        <StatsCards assessments={assessments} />
        <PerformanceChart assessments={assessments} />
        <QuizList assessments={assessments} />
      </div>
    </div>
  );
}
