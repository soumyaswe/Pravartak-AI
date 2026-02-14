'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Mail, 
  Search, 
  MessageCircle, 
  Video, 
  TrendingUp, 
  Map, 
  BarChart3,
  ArrowRight 
} from 'lucide-react';

const featuresData = [
  {
    title: 'Resume Builder',
    description: 'Create ATS-optimized resumes',
    icon: FileText,
    href: '/resume',
    status: 'Ready',
    statusColor: 'bg-green-500',
    metrics: '2 resumes created'
  },
  {
    title: 'Cover Letter',
    description: 'Generate personalized cover letters',
    icon: Mail,
    href: '/ai-cover-letter',
    status: 'Draft',
    statusColor: 'bg-yellow-500',
    metrics: '1 draft saved'
  },
  {
    title: 'CV Analyzer',
    description: 'Get detailed CV feedback',
    icon: Search,
    href: '/cv-analyser',
    status: 'New Analysis',
    statusColor: 'bg-blue-500',
    metrics: 'Last: 2 days ago'
  },
  {
    title: 'Industry Insights',
    description: 'Market trends and salary data',
    icon: TrendingUp,
    href: '/industry-insights',
    status: 'Updated',
    statusColor: 'bg-purple-500',
    metrics: '5 new trends'
  },
  {
    title: 'Interview Prep',
    description: 'Practice with role-specific questions',
    icon: MessageCircle,
    href: '/interview',
    status: 'Active',
    statusColor: 'bg-green-500',
    metrics: '45 questions available'
  },
  {
    title: 'Mock Interview',
    description: 'Realistic interview simulations',
    icon: Video,
    href: '/mock-interview',
    status: 'Scheduled',
    statusColor: 'bg-orange-500',
    metrics: 'Next: Today 3:00 PM'
  },
  {
    title: 'Career Roadmap',
    description: 'Personalized career pathway',
    icon: Map,
    href: '/roadmap',
    status: 'In Progress',
    statusColor: 'bg-blue-500',
    metrics: '3 milestones pending'
  },
  {
    title: 'Progress Analytics',
    description: 'Track your career growth',
    icon: BarChart3,
    href: '/analytics',
    status: 'Updated',
    statusColor: 'bg-green-500',
    metrics: 'View detailed reports'
  }
];

export default function FeatureGrid() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Your Career Tools</h2>
        <p className="text-sm text-muted-foreground">Quick access to all features</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {featuresData.map((feature, index) => {
          const Icon = feature.icon;
          
          return (
            <Link key={index} href={feature.href}>
              <Card className="bg-card border-border hover:bg-muted/50 transition-all duration-300 hover:shadow-lg group cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`${feature.statusColor} text-white text-xs`}
                    >
                      {feature.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {feature.metrics}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}