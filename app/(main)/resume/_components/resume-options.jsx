"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Edit3,
  Calendar,
  User,
  ArrowRight,
  Sparkles,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ResumeOptions({ existingResumes = [] }) {
  const router = useRouter();
  const [selectedAction, setSelectedAction] = useState(null);

  const handleCreateNew = () => {
    router.push("/resume/new");
  };

  const handleImproveExisting = (resumeId) => {
    router.push(`/resume/edit/${resumeId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold gradient-title mb-4">
          Resume Builder
        </h1>
        <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
          Create a professional resume from scratch or improve an existing one with AI-powered suggestions
        </p>
      </div>

      {/* Action Cards */}
      <div className="flex justify-center mb-12">
        {/* Create New Resume */}
        <Card className="bg-neutral-900 border-neutral-800 hover:border-blue-500 transition-all duration-300 cursor-pointer group w-full max-w-md">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-4 bg-blue-600 rounded-full w-20 h-20 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
              <Plus className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-semibold text-white mb-2">
              Create New Resume
            </CardTitle>
            <p className="text-neutral-400">
              Start from scratch with our guided step-by-step builder
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-neutral-300">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>AI-powered content suggestions</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-300">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Professional templates</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-300">
                <User className="w-4 h-4 text-blue-400" />
                <span>ATS-friendly format</span>
              </div>
            </div>
            <Button
              onClick={handleCreateNew}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
            >
              Start Building
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Improve Existing Resume */}
        {/* <Card className="bg-neutral-900 border-neutral-800 hover:border-green-500 transition-all duration-300 cursor-pointer group">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-4 bg-green-600 rounded-full w-20 h-20 flex items-center justify-center group-hover:bg-green-500 transition-colors">
              <Edit3 className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-semibold text-white mb-2">
              Improve Existing Resume
            </CardTitle>
            <p className="text-neutral-400">
              Enhance your current resume with AI-powered improvements
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-neutral-300">
                <Sparkles className="w-4 h-4 text-green-400" />
                <span>AI content enhancement</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-300">
                <FileText className="w-4 h-4 text-green-400" />
                <span>Section-by-section improvements</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-300">
                <User className="w-4 h-4 text-green-400" />
                <span>Personalized suggestions</span>
              </div>
            </div>

            {existingResumes.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white mb-2">
                  Select a resume to improve:
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {existingResumes.slice(0, 3).map((resume) => (
                    <button
                      key={resume.id}
                      onClick={() => handleImproveExisting(resume.id)}
                      className="w-full p-3 text-left bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-700 hover:border-green-500"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white text-sm">
                            {resume.title}
                          </p>
                          <p className="text-xs text-neutral-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Updated {formatDate(resume.updatedAt)}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-green-400" />
                      </div>
                    </button>
                  ))}
                </div>
                {existingResumes.length > 3 && (
                  <Button
                    variant="outline"
                    onClick={() => router.push("/resume/my-resumes")}
                    className="w-full mt-2 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  >
                    View All Resumes ({existingResumes.length})
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-neutral-500 text-sm mb-3">
                  You don't have any resumes yet
                </p>
                <Button
                  onClick={handleCreateNew}
                  variant="outline"
                  className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                >
                  Create Your First Resume
                </Button>
              </div>
            )}
          </CardContent>
        </Card> */}
      </div>

      {/* Recent Activity */}
      {existingResumes.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Recent Resumes</h2>
          <div className="grid gap-4">
            {existingResumes.slice(0, 3).map((resume) => (
              <Card
                key={resume.id}
                className="bg-neutral-900 border-neutral-800 hover:border-neutral-600 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-neutral-800 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{resume.title}</h3>
                        <p className="text-sm text-neutral-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Last modified {formatDate(resume.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleImproveExisting(resume.id)}
                        variant="outline"
                        size="sm"
                        className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {existingResumes.length > 3 && (
            <div className="text-center mt-6">
              <Button
                onClick={() => router.push("/resume/my-resumes")}
                variant="outline"
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              >
                View All Resumes
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}