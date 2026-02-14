"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { saveMockInterviewToDb } from "@/lib/data-helpers";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle,
  Clock,
  Mic,
  MicOff,
  Volume2,
  Loader2,
  Sparkles,
  Brain,
} from "lucide-react";
import InterviewProgress from "./_components/interview-progress";
import QuestionDisplay from "./_components/question-display";
import VoiceRecorder from "./_components/voice-recorder";
import JobRoleSetup from "./_components/job-role-setup";
import AnalysisResults from "./_components/analysis-results";

export default function MockInterviewPage() {
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [jobRole, setJobRole] = useState("");
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [error, setError] = useState("");
  const [finalAnalysis, setFinalAnalysis] = useState(null);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress =
    totalQuestions > 0
      ? ((currentQuestionIndex + 1) / totalQuestions) * 100
      : 0;

  const generateQuestions = async (role) => {
    setIsGeneratingQuestions(true);
    setError("");

    try {
      const response = await fetch("/api/mock-interview/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobRole: role }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Failed to generate questions";
        const hint = data.hint ? `\n\n💡 ${data.hint}` : '';
        throw new Error(errorMessage + hint);
      }

      setQuestions(data.questions);
      setJobRole(data.jobRole);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setAnalysisHistory([]);
      setError("");

      return true;
    } catch (error) {
      const errorMsg = error.message || "Failed to generate questions";
      setError(errorMsg);
      
      // Show toast for better visibility
      if (errorMsg.includes('leaked') || errorMsg.includes('403')) {
        toast.error('API Key Blocked', {
          description: 'Your Gemini API key has been blocked. Please check GET_NEW_API_KEY.md for instructions.',
          duration: 8000,
        });
      } else {
        toast.error('Failed to Generate Questions', {
          description: errorMsg,
          duration: 5000,
        });
      }
      
      return false;
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const startInterview = async (role) => {
    const success = await generateQuestions(role);
    if (success) {
      setIsInterviewStarted(true);
      setSessionStartTime(new Date());
    }
  };

  const goToNextQuestion = async () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnalysis(null); // Clear analysis when moving to next question
    } else {
      await completeInterview();
    }
  };

  const completeInterview = async () => {
    setIsGeneratingAnalysis(true);

    try {
      // Check if we have any analysis history
      if (analysisHistory.length === 0) {
        toast.error(
          "No answers recorded. Please answer at least one question."
        );
        setIsGeneratingAnalysis(false);
        return;
      }

      const response = await fetch("/api/mock-interview/final-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          history: analysisHistory,
          jobRole: jobRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate analysis");
      }

      const data = await response.json();
      setFinalAnalysis(data);

      // Save interview results to database
      if (user?.uid && data) {
        try {
          // Calculate scores from metrics
          const overallScore = data.metrics?.avgContentScore
            ? (data.metrics.avgContentScore / 5) * 100
            : null;

          const communicationScore = data.metrics?.avgConfidence || null;

          // Calculate content and clarity scores based on available metrics
          const contentScore = data.metrics?.avgContentScore
            ? (data.metrics.avgContentScore / 5) * 100
            : null;

          // Clarity score based on speech metrics (WPM and fillers)
          let clarityScore = null;
          if (
            data.metrics?.avgWpm &&
            data.metrics?.totalFillers !== undefined
          ) {
            const wpmScore = Math.max(
              0,
              Math.min(100, ((data.metrics.avgWpm - 100) / 50) * 50 + 50)
            );
            const fillerPenalty = Math.min(30, data.metrics.totalFillers * 5);
            clarityScore = Math.max(0, wpmScore - fillerPenalty);
          }

          // Extract strengths and improvements from analysis text
          const analysisText = data.analysis || "";
          const strengthsMatch = analysisText.match(
            /##\s*💪\s*Strengths([\s\S]*?)##/i
          );
          const improvementsMatch = analysisText.match(
            /##\s*📈\s*Areas for Improvement([\s\S]*?)##/i
          );

          const strengths = strengthsMatch
            ? strengthsMatch[1]
                .split("\n")
                .filter((line) => line.trim().startsWith("-"))
                .map((line) => line.replace(/^-\s*/, "").trim())
            : ["Good effort"];

          const improvements = improvementsMatch
            ? improvementsMatch[1]
                .split("\n")
                .filter((line) => line.trim().startsWith("-"))
                .map((line) => line.replace(/^-\s*/, "").trim())
            : ["Keep practicing"];

          await saveMockInterviewToDb({
            cognitoUserId: user.uid,
            type: "BEHAVIORAL", // or get from state
            industry: user.industry || "General",
            experienceLevel: user.experience || "INTERMEDIATE",
            duration: Math.round((Date.now() - sessionStartTime) / 1000 / 60), // minutes
            questions: questions.map((q) => q.question || q),
            responses: analysisHistory.map((h) => h.response || ""),
            overallScore,
            communicationScore,
            contentScore,
            clarityScore,
            feedback: data.analysis,
            strengths,
            improvements,
            recommendations: [
              "Continue practicing",
              "Review feedback carefully",
            ],
            email: user.email,
            name: user.displayName || user.name || "User",
          });
          toast.success("Interview results saved successfully!");
        } catch (saveError) {
          console.error("Error saving interview results:", saveError);
          toast.error("Interview completed but failed to save results");
        }
      }
    } catch (error) {
      console.error("Error generating final analysis:", error);
      toast.error(error.message || "Failed to complete interview analysis");

      // Still mark as completed but with no analysis
      setFinalAnalysis(null);
    } finally {
      setIsGeneratingAnalysis(false);
      setIsInterviewCompleted(true);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setCurrentAnalysis(null); // Clear analysis when moving to previous question
    }
  };

  const restartInterview = () => {
    setCurrentQuestionIndex(0);
    setIsInterviewStarted(false);
    setIsInterviewCompleted(false);
    setQuestions([]);
    setAnswers({});
    setAnalysisHistory([]);
    setSessionStartTime(null);
    setJobRole("");
    setError("");
    setFinalAnalysis(null);
    setCurrentAnalysis(null);
  };

  const handleAnalysisComplete = (analysisData) => {
    setCurrentAnalysis(analysisData);
  };

  const saveAnswer = (questionId, audioBlob, duration, analysisData = null) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        audioBlob,
        duration,
        timestamp: new Date(),
        analysis: analysisData,
      },
    }));

    // Add to analysis history if we have analysis data
    if (analysisData) {
      setAnalysisHistory((prev) => [
        ...prev,
        {
          questionId,
          question: currentQuestion?.question,
          ...analysisData,
        },
      ]);
    }
  };

  // Job role setup screen
  if (!isInterviewStarted && !isInterviewCompleted) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-10xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-8 w-8 text-purple-500" />
            <h1 className="font-bold gradient-title text-5xl md:text-6xl">
              AI-Powered Mock Interview
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            Practice with AI-generated questions tailored to your role
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
            <AlertDescription className="text-red-700 dark:text-red-300">
              <div className="space-y-2">
                <p className="font-semibold">{error}</p>
                {(error.includes('leaked') || error.includes('403') || error.includes('API key')) && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Quick Fix:</strong> Your API key has been blocked by Google. 
                      <br />
                      📖 See <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded">GET_NEW_API_KEY.md</code> in the project root for step-by-step instructions.
                    </p>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <JobRoleSetup
          onStartInterview={startInterview}
          isGenerating={isGeneratingQuestions}
        />
      </div>
    );
  }

  // Interview completion screen
  if (isInterviewCompleted) {
    const totalDuration = sessionStartTime
      ? Math.round((new Date() - sessionStartTime) / 1000 / 60)
      : 0;
    const answeredQuestions = Object.keys(answers).length;

    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Interview Completed!</h1>
          <p className="text-xl text-muted-foreground">
            Great job completing your mock interview for{" "}
            <strong>{jobRole}</strong>
          </p>
        </div>

        <Card className="p-8 mb-8">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-500">
                {totalQuestions}
              </div>
              <div className="text-muted-foreground">Questions Asked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-500">
                {answeredQuestions}
              </div>
              <div className="text-muted-foreground">Answered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-500">
                {totalDuration}m
              </div>
              <div className="text-muted-foreground">Total Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-500">
                {finalAnalysis?.metrics?.avgContentScore || "N/A"}
              </div>
              <div className="text-muted-foreground">Avg Score</div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Final Analysis */}
          {isGeneratingAnalysis ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">
                Analyzing your performance with AI...
              </p>
            </div>
          ) : finalAnalysis ? (
            <AnalysisResults
              analysis={finalAnalysis}
              questions={questions}
              answers={answers}
              analysisHistory={analysisHistory}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Analysis unavailable at the moment.
              </p>
            </div>
          )}

          <div className="flex justify-center gap-4 mt-8">
            <Button variant="outline" onClick={restartInterview}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Take Another Interview
            </Button>
            <Button onClick={() => window.print()}>
              Print Analysis Report
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Main interview interface
  return (
    <div className="w-full py-4 max-w-10xl mx-auto">
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Progress/Navigation */}
        <div className="lg:col-span-3">
          <InterviewProgress
            currentQuestion={currentQuestionIndex + 1}
            totalQuestions={totalQuestions}
            progress={progress}
            onPrevious={goToPreviousQuestion}
            onNext={goToNextQuestion}
            canGoPrevious={currentQuestionIndex > 0}
            canGoNext={true}
            jobRole={jobRole}
            answeredQuestions={answers}
            onQuestionSelect={(index) => setCurrentQuestionIndex(index)}
          />
        </div>

        {/* Question Panel */}
        <div className="lg:col-span-6">
          <QuestionDisplay
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            jobRole={jobRole}
            totalQuestions={totalQuestions}
            answeredQuestions={answers}
            onQuestionSelect={(index) => setCurrentQuestionIndex(index)}
            onPrevious={goToPreviousQuestion}
            onNext={goToNextQuestion}
            onSkip={goToNextQuestion}
          />
        </div>

        {/* Recording Panel */}
        <div className="lg:col-span-3">
          <VoiceRecorder
            questionId={currentQuestion?.id}
            timeLimit={currentQuestion?.timeLimit}
            onSaveAnswer={saveAnswer}
            existingAnswer={answers[currentQuestion?.id]}
            currentQuestion={currentQuestion}
            jobRole={jobRole}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </div>
      </div>

      {/* Current Question Analysis Results - Below the three cards */}
      {currentAnalysis && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h4 className="font-medium text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                AI Analysis Results - Question {currentQuestionIndex + 1}
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {currentAnalysis.score}/5
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Content Score
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {currentAnalysis.wpm}
                  </div>
                  <div className="text-sm text-muted-foreground">Words/Min</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {currentAnalysis.pauseCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Pauses</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {currentAnalysis.fillerCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Fillers</div>
                </div>
              </div>

              {currentAnalysis.justification && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>Feedback:</strong> {currentAnalysis.justification}
                  </p>
                </div>
              )}

              {currentAnalysis.transcript && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>Transcript:</strong> {currentAnalysis.transcript}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
