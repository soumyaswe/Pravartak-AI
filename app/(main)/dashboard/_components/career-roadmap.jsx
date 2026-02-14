'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, CheckCircle, ArrowRight, Circle, Target } from 'lucide-react';

export default function CareerRoadmap({ data }) {
  // You can use the data prop to determine which stage the user is on based on their progress
  
  const roadmapStages = [
    {
      id: 1,
      title: 'Profile & Resume',
      status: 'completed',
      description: 'Build professional presence'
    },
    {
      id: 2,
      title: 'Skills & Interview Prep',
      status: 'current',
      description: 'Practice and improve'
    },
    {
      id: 3,
      title: 'Application & Networking',
      status: 'upcoming',
      description: 'Apply and connect'
    },
    {
      id: 4,
      title: 'Negotiation & Offer',
      status: 'upcoming',
      description: 'Land your dream job'
    }
  ];

  const getStageIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'current':
        return <ArrowRight className="h-4 w-4 text-primary animate-pulse" />;
      case 'upcoming':
        return <Circle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStageStyles = (status) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/20',
          text: 'text-green-500',
          line: 'bg-green-500'
        };
      case 'current':
        return {
          bg: 'bg-primary/10',
          border: 'border-primary/20',
          text: 'text-primary',
          line: 'bg-primary'
        };
      case 'upcoming':
        return {
          bg: 'bg-muted/30',
          border: 'border-border',
          text: 'text-muted-foreground',
          line: 'bg-muted'
        };
      default:
        return {
          bg: 'bg-muted/30',
          border: 'border-border',
          text: 'text-muted-foreground',
          line: 'bg-muted'
        };
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              Your Career Roadmap
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Senior Software Engineer</p>
          </div>
          <Button variant="outline" size="sm" asChild className="h-8 text-xs">
            <a href="/roadmap" className="flex items-center gap-1.5">
              <Target className="h-3 w-3" />
              View Full
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-3 pl-7">
          {/* Vertical Line */}
          <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-border" />
          
          {roadmapStages.map((stage, index) => {
            const styles = getStageStyles(stage.status);
            
            return (
              <div key={stage.id} className="relative">
                {/* Stage Marker */}
                <div className={`absolute -left-7 p-1 rounded-full ${styles.bg} ${styles.border} border-2 bg-background`}>
                  {getStageIcon(stage.status)}
                </div>
                
                {/* Stage Content */}
                <div className={`p-3 rounded-lg ${styles.bg} ${styles.border} border transition-all hover:shadow-md`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold text-xs mb-0.5 ${stage.status === 'current' ? 'text-primary' : 'text-foreground'}`}>
                        {stage.title}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        {stage.description}
                      </p>
                    </div>
                    {stage.status === 'completed' && (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    )}
                    {stage.status === 'current' && (
                      <div className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-semibold shrink-0">
                        IN PROGRESS
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
