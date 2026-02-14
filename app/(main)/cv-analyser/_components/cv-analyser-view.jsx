"use client";

import React, { useState, useRef } from "react";
import DOMPurify from "dompurify";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CvAnalyserView = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobTitle, setJobTitle] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Accepted file types (updated to match API)
  const acceptedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "image/png", 
    "image/jpeg", 
    "image/jpg",
    "image/webp",
    "text/plain"
  ];

  const maxFileSize = 5 * 1024 * 1024; // 5MB

  const validateFile = (file) => {
    if (!acceptedTypes.includes(file.type)) {
      return "Please upload a PDF, DOCX, PNG, JPG, WEBP, or TXT file.";
    }
    if (file.size > maxFileSize) {
      return "File size must be less than 5MB.";
    }
    return null;
  };

  const handleFileSelect = (file) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setAnalysisResult(null);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadError(null);
    setAnalysisResult(null);
    setJobTitle(""); // Clear job title when file is removed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyse = async () => {
    if (!selectedFile) return;
    
    // Validate job title
    if (!jobTitle.trim()) {
      setUploadError("Please enter a target job title.");
      return;
    }

    setIsAnalysing(true);
    setUploadError(null); // Clear any previous errors
    
    try {
      // Create FormData to send file and job title
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("jobTitle", jobTitle.trim());

      const response = await fetch("/api/cv-analyser", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.analysis);
      } else {
        setUploadError(data.error || "Analysis failed. Please try again.");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      setUploadError("Network error. Please check your connection and try again.");
    } finally {
      setIsAnalysing(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Function to sanitize HTML content
  const sanitizeHTML = (htmlContent) => {
    if (typeof window !== 'undefined') {
      // Configure DOMPurify to allow common formatting tags
      const cleanHTML = DOMPurify.sanitize(htmlContent, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code'],
        ALLOWED_ATTR: ['class', 'id']
      });
      return cleanHTML;
    }
    // Fallback for server-side rendering
    return htmlContent;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
      <style dangerouslySetInnerHTML={{__html: `
        .formatted-analysis h1 {
          font-size: 1.5rem;
          font-weight: bold;
          color: hsl(var(--primary));
          margin: 1.5rem 0 1rem 0;
        }
        .formatted-analysis h2 {
          font-size: 1.5rem;
          font-weight: bold;
          color: hsl(var(--foreground));
          margin: 1.25rem 0 0.75rem 0;
        }
        .formatted-analysis h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: hsl(var(--foreground));
          margin: 1rem 0 0.5rem 0;
        }
        .formatted-analysis p {
          font-size: 1rem;
          font-weight: normal;
          margin: 0.5rem 0;
          line-height: 1.6;
        }
        .formatted-analysis ul, .formatted-analysis ol {
          font-size: 1rem;
          margin: 0.75rem 0;
          padding-left: 2rem;
          list-style-type: disc;
        }
        .formatted-analysis ol {
          list-style-type: decimal;
        }
        .formatted-analysis li {
          font-size: 1rem;
          font-weight: normal;
          margin: 0.5rem 0;
          line-height: 1.6;
          display: list-item;
        }
        .formatted-analysis strong {
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        .formatted-analysis em {
          font-style: italic;
        }
        .formatted-analysis blockquote {
          font-size: 1rem;
          border-left: 4px solid hsl(var(--primary));
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }
        .formatted-analysis code {
          background-color: hsl(var(--muted));
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
        }
        @media (min-width: 640px) {
          .formatted-analysis h1 {
            font-size: 1.875rem;
          }
          .formatted-analysis h2 {
            font-size: 1.5rem;
            font-weight: bold;
          }
          .formatted-analysis h3 {
            font-size: 1.375rem;
          }
          .formatted-analysis p {
            font-size: 1.125rem;
            font-weight: normal;
            
          }
          .formatted-analysis li {
            font-size: 1.125rem;
            font-weight: normal;
          }
          .formatted-analysis ul, .formatted-analysis ol {
            font-size: 1.125rem;
          }
          .formatted-analysis blockquote {
            font-size: 1.125rem;
          }
          .formatted-analysis code {
            font-size: 1rem;
          }
        }
      `}} />
      {/* Header */}
      <div className="text-center space-y-3 sm:space-y-4">
        <h1 className="font-bold gradient-title text-5xl md:text-6xl">CV Analyser</h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
          Upload your resume and get detailed insights on how to improve it for better job opportunities.
        </p>
      </div>

      {/* Upload Section */}
      <Card className="mx-4 sm:mx-0">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
            Upload Your Resume
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Supported formats: PDF, DOCX, PNG, JPG, WEBP, TXT (Max size: 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-3 sm:space-y-4">
                <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold">
                    Drag and drop your resume here
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    or click to browse your files
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mt-3 sm:mt-4 text-sm sm:text-base"
                >
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.png,.jpg,.jpeg,.webp,.txt"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {/* Selected File Display */}
              <div className="flex items-center justify-between p-3 sm:p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base truncate">{selectedFile.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  className="text-muted-foreground hover:text-destructive flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>

              {/* Job Title Input */}
              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="text-sm sm:text-base font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Target Job Title
                </Label>
                <Input
                  id="jobTitle"
                  type="text"
                  placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="text-sm sm:text-base"
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Enter the job title you're targeting for tailored analysis
                </p>
              </div>

              {/* Analyse Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleAnalyse}
                  disabled={isAnalysing || !selectedFile || !jobTitle.trim()}
                  size="lg"
                  className="min-w-32 w-full sm:w-auto text-sm sm:text-base"
                >
                  {isAnalysing ? (
                    <>
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                      Analysing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Analyse CV
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {uploadError && (
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
              <div className="flex items-start gap-2 text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm font-medium leading-relaxed">{uploadError}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <Card className="mx-4 sm:mx-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              Analysis Results
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Here's what we found in your resume
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Overall Score */}
              {analysisResult.score && (
                <div className="text-center space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold">
                    Overall Score: {analysisResult.score}/100
                  </h3>
                  <Badge
                    variant={
                      analysisResult.score >= 80
                        ? "default"
                        : analysisResult.score >= 60
                        ? "secondary"
                        : "destructive"
                    }
                    className="text-xs sm:text-sm"
                  >
                    {analysisResult.score >= 80
                      ? "Excellent"
                      : analysisResult.score >= 60
                      ? "Good"
                      : "Needs Improvement"}
                  </Badge>
                </div>
              )}

              {/* Analysis Content */}
              <div className="prose prose-sm sm:prose max-w-none">
                <div 
                  className="leading-relaxed formatted-analysis"
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeHTML(analysisResult.analysis || analysisResult)
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CvAnalyserView;