"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Play, Loader2, Briefcase, Sparkles, Target } from "lucide-react";

const popularRoles = [
  "Software Engineer",
  "Data Scientist",
  "Product Manager",
  "Marketing Manager",
  "Sales Representative",
  "Business Analyst",
  "UX/UI Designer",
  "DevOps Engineer",
  "Financial Analyst",
  "Project Manager",
  "Customer Success Manager",
  "Content Writer",
];

export default function JobRoleSetup({ onStartInterview, isGenerating }) {
  const [jobRole, setJobRole] = useState("");

  const handleStart = () => {
    if (jobRole.trim()) {
      onStartInterview(jobRole.trim());
    }
  };

  const handleRoleSelect = (role) => {
    setJobRole(role);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && jobRole.trim() && !isGenerating) {
      handleStart();
    }
  };

  return (
    <Card className="w-full max-w-10xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Briefcase className="h-6 w-6 text-blue-500" />
          <CardTitle className="text-2xl">Interview Setup</CardTitle>
        </div>
        <p className="text-muted-foreground">
          Enter your target job role to get personalized interview questions
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Job Role Input */}
        <div className="space-y-2">
          <Label htmlFor="jobRole" className="text-lg font-medium">
            Job Role
          </Label>
          <Input
            id="jobRole"
            type="text"
            placeholder="e.g., Software Engineer, Product Manager, Data Scientist..."
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-base py-3 h-12"
            disabled={isGenerating}
          />
          <p className="text-sm text-muted-foreground">
            Be specific about the role you're targeting for better questions
          </p>
        </div>

        {/* Popular Roles */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">
            Or choose from popular roles:
          </Label>
          <div className="flex flex-wrap gap-2">
            {popularRoles.map((role) => (
              <Badge
                key={role}
                variant={jobRole === role ? "default" : "outline"}
                className="text-base cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1"
                onClick={() => handleRoleSelect(role)}
              >
                {role}
              </Badge>
            ))}
          </div>
        </div>

        {/* Interview Tips and Guidance */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tips for Answering */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-lg">
                  General Tips for Answering:
                </span>
              </div>
              <ul className="text-base text-muted-foreground space-y-2 ml-6">
                <li>
                  • Use the STAR method (Situation, Task, Action, Result) for
                  behavioral questions
                </li>
                <li>
                  • Be specific and provide concrete examples from your
                  experience
                </li>
                <li>• Quantify your impact wherever possible</li>
                <li>• Stay concise and relevant to the question asked</li>
                <li>• Show enthusiasm and confidence in your abilities</li>
              </ul>
            </div>

            {/* Time Allocation Guidance */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-lg text-blue-800 dark:text-blue-200">
                  Time Allocation Suggestion (per question)
                </span>
              </div>
              <div className="text-base text-blue-700 dark:text-blue-300 space-y-1">
                <div>• Think: 10-15 seconds</div>
                <div>• Structure your answer: 15-30 seconds</div>
                <div>• Main response: 60-90 seconds</div>
                <div>• Wrap up: 10-15 seconds</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recording Tips */}
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-green-600" />
                <span className="font-medium text-lg text-green-800 dark:text-green-200">
                  Recording Tips
                </span>
              </div>
              <div className="text-base text-green-700 dark:text-green-300 space-y-1">
                <div>• Find a quiet environment</div>
                <div>• Speak clearly and at a moderate pace</div>
                <div>• Minimize filler words ("um", "uh", "like")</div>
                <div>• Make sure your microphone is working properly</div>
                <div>• Practice good posture and breathing</div>
              </div>
            </div>

            {/* Interview Context */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span className="text-lg font-medium text-purple-700 dark:text-purple-300">
                  What to Expect
                </span>
              </div>
              <div className="text-base text-muted-foreground space-y-2">
                <p>
                  • <strong>5 Questions:</strong> Carefully curated for your
                  specific role
                </p>
                <p>
                  • <strong>Timed Responses:</strong> Each question has a time
                  limit (2-4 minutes)
                </p>
                <p>
                  • <strong>Voice Recording:</strong> Record your answer for
                  each question
                </p>
                <p>
                  • <strong>AI Analysis:</strong> Get instant feedback on
                  content, delivery, and confidence
                </p>
                <p>
                  • <strong>Comprehensive Report:</strong> Detailed analysis at
                  the end of the interview
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStart}
          disabled={!jobRole.trim() || isGenerating}
          className="w-full py-6 text-lg"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating Questions...
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Start AI Mock Interview
            </>
          )}
        </Button>

        {isGenerating && (
          <div className="text-center text-sm text-muted-foreground">
            <p>AI is generating personalized questions for "{jobRole}"</p>
            <p>This may take 10-15 seconds...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
