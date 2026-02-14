'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Target, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function WelcomeHeader({ data }) {
  const { user } = useAuth();
  
  // Determine next recommended action based on user's status
  const getNextAction = () => {
    if (!data) return { title: 'Complete Your Profile', href: '/profile', icon: Target };
    
    if (data.profileCompletion < 70) {
      return { 
        title: 'Complete Your Profile', 
        href: '/profile',
        icon: Target,
        reason: `${data.profileCompletion}% complete`
      };
    }
    
    if (data.resumeCount === 0) {
      return { 
        title: 'Create Your First Resume', 
        href: '/resume',
        icon: Target,
        reason: 'Build your professional resume'
      };
    }
    
    if (data.interviewSessions === 0) {
      return { 
        title: 'Start Interview Simulation', 
        href: '/interview-simulator',
        icon: Sparkles,
        reason: 'Practice with AI interviewer'
      };
    }
    
    if (data.latestMockScore && data.latestMockScore < 80) {
      return { 
        title: 'Improve Interview Skills', 
        href: '/interview-simulator',
        icon: Target,
        reason: `Current score: ${data.latestMockScore.toFixed(0)}/100`
      };
    }
    
    if (data.coverLetterCount === 0) {
      return { 
        title: 'Generate Cover Letter', 
        href: '/ai-cover-letter',
        icon: Target,
        reason: 'Create compelling cover letters'
      };
    }
    
    return { 
      title: 'Explore Industry Insights', 
      href: '/industry-insights',
      icon: Sparkles,
      reason: 'Stay ahead of the market'
    };
  };

  const nextAction = getNextAction();
  const careerProgress = data?.profileCompletion || 0;
  const userName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="space-y-4">
          {/* Welcome Message */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1.5 flex items-center gap-2">
              Welcome back, {userName}
              <span className="text-xl">👋</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Your career journey is <span className="font-semibold text-primary">{careerProgress}% complete</span>
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <Progress value={careerProgress} className="h-2" />
          </div>

          {/* Next Recommended Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-background/60 backdrop-blur-sm rounded-lg border border-border/50">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-full bg-primary/10 mt-0.5">
                <nextAction.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Next Recommended Action</p>
                <h3 className="font-semibold text-foreground text-base">{nextAction.title}</h3>
                {nextAction.reason && (
                  <p className="text-xs text-muted-foreground mt-0.5">{nextAction.reason}</p>
                )}
              </div>
            </div>
            
            <Button 
              asChild
              size="default"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 w-full sm:w-auto"
            >
              <a href={nextAction.href} className="flex items-center gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
