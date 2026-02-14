'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  Circle,
  Timer,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function InterviewProgress({ 
  currentQuestion, 
  totalQuestions, 
  progress, 
  onPrevious, 
  onNext, 
  canGoPrevious, 
  canGoNext,
  jobRole,
  answeredQuestions = {},
  onQuestionSelect
}) {
  const [sessionTime, setSessionTime] = useState(0);

  // Track session time
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (questionIndex) => {
    if (questionIndex < currentQuestion - 1) return 'completed';
    if (questionIndex === currentQuestion - 1) return 'current';
    return 'upcoming';
  };

  return (
    <Card className="w-full h-fit">
      <CardContent className="p-4 md:p-6">
        {/* Header Section */}
        <div className="space-y-4 mb-6">
          <div className="space-y-1">
            
            <h2 className="text-lg font-bold ">
              {jobRole ? `Mock Interview for ${jobRole}` : 'Mock Interview Session'}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Timer className="h-4 w-4" />
            <span>Session: {formatTime(sessionTime)}</span>
          </div>
        </div>

        {/* Question Navigation Palette */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="space-y-2">
            <span className="font-medium text-base">Question Navigation</span>
            <div className="flex items-center justify-between gap-2 text-sm mb-10 py-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Not Answered</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: totalQuestions }, (_, index) => {
              const qNum = index + 1;
              const isAnswered = answeredQuestions[index] || answeredQuestions[qNum];
              const isCurrent = qNum === currentQuestion;
              
              return (
                <button
                  key={qNum}
                  onClick={() => onQuestionSelect && onQuestionSelect(index)}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                    transition-all border-2
                    ${isAnswered 
                      ? 'bg-green-500 border-green-600 text-white hover:bg-green-600' 
                      : 'bg-red-500 border-red-600 text-white hover:bg-red-600'
                    }
                    ${isCurrent ? 'border-2 border-white' : 'hover:scale-105'}
                  `}
                >
                  {qNum}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}