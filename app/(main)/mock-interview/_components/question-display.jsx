'use client';

import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, HelpCircle, Target, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';

export default function QuestionDisplay({ 
  question, 
  questionNumber, 
  jobRole,
  totalQuestions = 5,
  answeredQuestions = {},
  onQuestionSelect,
  onPrevious,
  onNext,
  onSkip
}) {
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-500';
      case 'Medium':
        return 'bg-yellow-500';
      case 'Hard':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-3 py-1">
              Question {questionNumber}
            </Badge>
            <Badge variant="secondary">
              {question.category}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              className={`text-white ${getDifficultyColor(question.difficulty)}`}
            >
              {question.difficulty}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatTime(question.timeLimit)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Question */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-1">
              <HelpCircle className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2 leading-relaxed">
                {question.question}
              </h2>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Navigation Buttons */}
      <CardFooter className="flex justify-between items-center border-t p-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={questionNumber === 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <Button
          variant="outline"
          onClick={onSkip}
          className="flex items-center gap-2"
        >
          <SkipForward className="h-4 w-4" />
          Skip Question
        </Button>

        <Button
          onClick={onNext}
          className="flex items-center gap-2"
        >
          {questionNumber === totalQuestions ? 'Finish' : 'Next'}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}