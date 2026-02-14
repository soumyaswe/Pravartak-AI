'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Mic,
  Clock,
  MessageSquare,
  Star,
  Target,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AnalysisResults({ 
  analysis, 
  questions, 
  answers, 
  analysisHistory 
}) {
  const { analysis: finalAnalysis, metrics } = analysis;

  const getScoreColor = (score) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score) => {
    if (score >= 4) return <TrendingUp className="h-4 w-4" />;
    if (score >= 3) return <Minus className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  const getPaceStatus = (wpm) => {
    if (wpm >= 130 && wpm <= 150) return { status: 'optimal', color: 'text-green-600', icon: <Target className="h-4 w-4" /> };
    if (wpm < 130) return { status: 'slow', color: 'text-yellow-600', icon: <TrendingDown className="h-4 w-4" /> };
    return { status: 'fast', color: 'text-orange-600', icon: <TrendingUp className="h-4 w-4" /> };
  };

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium">Avg Score</span>
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(metrics.avgContentScore)}`}>
            {metrics.avgContentScore}/5
          </div>
        </Card>

        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Mic className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Pace</span>
          </div>
          <div className={`text-2xl font-bold ${getPaceStatus(metrics.avgWpm).color}`}>
            {metrics.avgWpm} WPM
          </div>
        </Card>

        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium">Pauses</span>
          </div>
          <div className="text-2xl font-bold">
            {metrics.totalPauses}
          </div>
        </Card>

        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageSquare className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium">Fillers</span>
          </div>
          <div className="text-2xl font-bold">
            {metrics.totalFillers}
          </div>
        </Card>
      </div>

      {/* Question-by-Question Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Individual Question Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questions.map((question, index) => {
              const answer = answers[question.id];
              const analysis = analysisHistory.find(h => h.questionId === question.id);
              
              return (
                <div key={question.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Q{index + 1}</Badge>
                        <Badge variant="secondary">{question.category}</Badge>
                        <Badge variant={question.difficulty === 'Easy' ? 'default' : 
                                       question.difficulty === 'Medium' ? 'secondary' : 'destructive'}>
                          {question.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mb-2">{question.question}</p>
                    </div>
                    
                    {analysis && (
                      <div className="text-right">
                        <div className={`flex items-center gap-1 ${getScoreColor(analysis.score)}`}>
                          {getScoreIcon(analysis.score)}
                          <span className="font-bold">{analysis.score}/5</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {answer ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <div className="font-medium">{Math.round(answer.duration)}s</div>
                      </div>
                      {analysis && (
                        <>
                          <div>
                            <span className="text-muted-foreground">Pace:</span>
                            <div className={`font-medium ${getPaceStatus(analysis.wpm).color}`}>
                              {analysis.wpm} WPM
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Pauses:</span>
                            <div className="font-medium">{analysis.pauseCount}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Fillers:</span>
                            <div className="font-medium">{analysis.fillerCount}</div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      Question skipped
                    </div>
                  )}

                  {analysis && analysis.justification && (
                    <div className="bg-muted/50 rounded p-3 text-sm">
                      <span className="font-medium">Feedback: </span>
                      {analysis.justification}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Analysis Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{finalAnalysis}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Content Quality</span>
                <span>{metrics.avgContentScore}/5</span>
              </div>
              <Progress value={(metrics.avgContentScore / 5) * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Speaking Pace (Target: 130-150 WPM)</span>
                <span>{metrics.avgWpm} WPM</span>
              </div>
              <Progress 
                value={Math.min(100, (metrics.avgWpm / 150) * 100)} 
                className="h-2" 
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Confidence Level</span>
                <span>{metrics.avgConfidence}%</span>
              </div>
              <Progress value={metrics.avgConfidence} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}