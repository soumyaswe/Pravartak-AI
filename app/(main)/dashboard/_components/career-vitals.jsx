'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, FileText, MessageCircle, Target, Award } from 'lucide-react';

export default function CareerVitals({ data }) {
  // Determine CV score color
  const getCVScoreColor = (score) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-orange-500';
  };

  // Determine interview score color
  const getInterviewScoreColor = (score) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const vitals = [
    {
      title: 'Profile Completion',
      value: `${data?.profileCompletion || 0}%`,
      icon: CheckCircle,
      color: data?.profileCompletion >= 80 ? 'text-green-500' : 
             data?.profileCompletion >= 50 ? 'text-yellow-500' : 'text-orange-500',
      bg: data?.profileCompletion >= 80 ? 'bg-green-500/10' : 
          data?.profileCompletion >= 50 ? 'bg-yellow-500/10' : 'bg-orange-500/10'
    },
    {
      title: 'CV Analyzer Score',
      value: data?.latestMockScore ? `${Math.round(data.latestMockScore)}/100` : 'N/A',
      subtitle: data?.latestMockScore ? 'Latest analysis' : 'Not analyzed yet',
      icon: Award,
      color: getCVScoreColor(data?.latestMockScore),
      bg: data?.latestMockScore >= 80 ? 'bg-green-500/10' : 
          data?.latestMockScore >= 60 ? 'bg-yellow-500/10' : 
          data?.latestMockScore ? 'bg-orange-500/10' : 'bg-muted/30'
    },
    {
      title: 'Latest Interview Score',
      value: data?.latestMockScore ? `${(data.latestMockScore / 10).toFixed(1)}/10` : 'N/A',
      subtitle: data?.latestMockScore ? 'From interview simulator' : 'Start your first interview',
      icon: Target,
      color: getInterviewScoreColor(data?.latestMockScore),
      bg: data?.latestMockScore >= 80 ? 'bg-green-500/10' : 
          data?.latestMockScore >= 60 ? 'bg-yellow-500/10' : 
          data?.latestMockScore ? 'bg-orange-500/10' : 'bg-muted/30'
    },
    {
      title: 'Documents Created',
      value: data?.documentsCreated || 0,
      subtitle: `${data?.resumeCount || 0} resumes, ${data?.coverLetterCount || 0} letters`,
      icon: FileText,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Interview Sessions',
      value: data?.interviewSessions || 0,
      subtitle: 'Practice sessions completed',
      icon: MessageCircle,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    }
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Career Vitals</CardTitle>
        <p className="text-[10px] text-muted-foreground">Your key metrics at a glance</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {vitals.map((vital, index) => {
            const Icon = vital.icon;
            
            return (
              <div 
                key={index}
                className={`p-3 rounded-lg ${vital.bg} border border-border/50 transition-all hover:shadow-md`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-1.5 rounded-lg bg-background border border-border/50">
                    <Icon className={`h-3.5 w-3.5 ${vital.color}`} />
                  </div>
                  <span className={`text-xl font-bold ${vital.color}`}>
                    {vital.value}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground mb-0.5">
                  {vital.title}
                </p>
                {vital.subtitle && (
                  <p className="text-[9px] text-muted-foreground">
                    {vital.subtitle}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
