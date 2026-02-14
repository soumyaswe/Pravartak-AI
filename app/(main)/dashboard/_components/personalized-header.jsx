'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function PersonalizedHeader() {
  const { user } = useAuth();
  
  const userData = {
    name: user?.displayName || user?.email?.split('@')[0] || "User",
    careerProgress: 67,
    nextAction: "Complete Mock Interview",
    nextActionHref: "/mock-interview",
    careerGoal: "Senior Software Engineer",
    industry: "Technology"
  };

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 mb-8">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Section - Welcome & Progress */}
          <div className="space-y-4 flex-1">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Welcome back, {userData.name} 👋
              </h1>
              <p className="text-muted-foreground">
                Your career journey in {userData.industry} • Goal: {userData.careerGoal}
              </p>
            </div>
            
            {/* Progress Bar */}
            {/* <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Career Progress</span>
                <span className="text-sm text-muted-foreground">{userData.careerProgress}% complete</span>
              </div>
              <Progress value={userData.careerProgress} className="h-2" />
            </div> */}
          </div>
          
          {/* Right Section - Next Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Next recommended action:</p>
              <p className="font-semibold text-foreground">{userData.nextAction}</p>
            </div>
            
            <Button 
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <a href={userData.nextActionHref} className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Get Started
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
        
        {/* Quick Stats Row */}
        {/* <div className="mt-6 pt-6 border-t border-border/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">12</p>
              <p className="text-xs text-muted-foreground">Interviews Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">3</p>
              <p className="text-xs text-muted-foreground">Documents Ready</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">4.2</p>
              <p className="text-xs text-muted-foreground">Career Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">5</p>
              <p className="text-xs text-muted-foreground">Skills Improved</p>
            </div>
          </div> 
        </div>*/}
      </CardContent>
    </Card>
  );
}