'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Lightbulb, 
  FileText, 
  MessageCircle, 
  TrendingUp,
  User,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { getDashboardStats } from '@/lib/data-helpers';

function getTimeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInMs = now - past;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins} minute${diffInMins > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  return past.toLocaleDateString();
}

function getActivityTypeLabel(type) {
  const labels = {
    RESUME_CREATED: 'Resume Created',
    RESUME_UPDATED: 'Resume Updated',
    COVER_LETTER_CREATED: 'Cover Letter Created',
    MOCK_INTERVIEW_COMPLETED: 'Mock Interview Completed',
    ASSESSMENT_COMPLETED: 'Assessment Completed'
  };
  return labels[type] || type;
}

const aiRecommendations = [
  {
    title: 'Practice Behavioral Questions',
    description: 'Focus on STAR method responses',
    priority: 'high',
    href: '/interview'
  },
  {
    title: 'Update LinkedIn Profile',
    description: 'Add your recent certifications',
    priority: 'medium',
    href: '/onboarding'
  },
  {
    title: 'Apply to Software Engineer Roles',
    description: '3 matching positions found',
    priority: 'high',
    href: '/industry-insights'
  },
  {
    title: 'Complete Career Assessment',
    description: 'Unlock personalized roadmap',
    priority: 'low',
    href: '/analytics'
  }
];

export default function ActivityAndRecommendations() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      
      try {
        const { stats } = await getDashboardStats(user.uid);
        setActivities(stats.recentActivity || []);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        // Set empty activities on error
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [user]);
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getActivityIcon = (type) => {
    if (type?.includes('RESUME')) return FileText;
    if (type?.includes('COVER_LETTER')) return FileText;
    if (type?.includes('INTERVIEW')) return MessageCircle;
    if (type?.includes('ASSESSMENT')) return TrendingUp;
    return CheckCircle;
  };

  return (
    <div className="space-y-6">
      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p className="text-sm">No recent activity yet.</p>
              <p className="text-xs mt-2">Start creating resumes or taking mock interviews!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const Icon = getActivityIcon(activity.activityType);
                
                return (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">
                        {getActivityTypeLabel(activity.activityType)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getTimeAgo(activity.createdAt)}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}