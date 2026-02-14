'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Lightbulb, Briefcase, MessageCircle, TrendingUp, User } from 'lucide-react';

const actionPlanItems = [
  {
    title: 'Apply to Software Engineer Roles',
    description: '3 matching positions found',
    priority: 'high',
    href: '/industry-insights',
    icon: Briefcase
  },
  {
    title: 'Practice Behavioral Questions',
    description: 'Focus on STAR method responses',
    priority: 'medium',
    href: '/mock-interview',
    icon: MessageCircle
  },
  {
    title: 'Update LinkedIn Profile',
    description: 'Add your Interview Simulator completion',
    priority: 'low',
    href: '/profile',
    icon: User
  }
];

export default function ActionPlan({ data }) {
  // You can use the data prop to generate dynamic recommendations in the future
  
  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'high':
        return {
          badge: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20',
          border: 'border-l-red-500'
        };
      case 'medium':
        return {
          badge: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20',
          border: 'border-l-yellow-500'
        };
      case 'low':
        return {
          badge: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20',
          border: 'border-l-green-500'
        };
      default:
        return {
          badge: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
          border: 'border-l-gray-500'
        };
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-primary" />
          Your Action Plan
        </CardTitle>
        <p className="text-xs text-muted-foreground">Prioritized tasks based on your career goals</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {actionPlanItems.map((item, index) => {
            const Icon = item.icon;
            const styles = getPriorityStyles(item.priority);
            
            return (
              <div 
                key={index}
                className={`p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all border-l-4 ${styles.border} group`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-background border border-border group-hover:border-primary/50 transition-colors">
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="font-semibold text-foreground text-xs group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <Badge className={`${styles.badge} text-[10px] font-medium shrink-0`}>
                        {item.priority}
                      </Badge>
                    </div>
                    
                    <p className="text-[10px] text-muted-foreground mb-2">
                      {item.description}
                    </p>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-[10px] text-primary hover:text-primary hover:bg-primary/10 -ml-2"
                      asChild
                    >
                      <a href={item.href} className="flex items-center gap-1">
                        Take Action 
                        <ArrowRight className="h-3 w-3" />
                      </a>
                    </Button>
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
