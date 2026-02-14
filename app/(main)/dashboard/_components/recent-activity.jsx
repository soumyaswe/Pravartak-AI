'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, FileText, MessageCircle, Target, Award, CheckCircle } from 'lucide-react';

function getTimeAgo(dateString) {
  if (!dateString) return 'Unknown time';
  
  try {
    const now = new Date();
    const past = new Date(dateString);
    
    if (isNaN(past.getTime())) return 'Recently';
    
    const diffInMs = now - past;
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins} min${diffInMins > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (error) {
    return 'Recently';
  }
}

function getActivityLabel(type) {
  const labels = {
    RESUME_CREATED: 'Resume Created',
    RESUME_UPDATED: 'Resume Updated',
    RESUME_DOWNLOADED: 'Resume Downloaded',
    COVER_LETTER_CREATED: 'Cover Letter Generated',
    COVER_LETTER_UPDATED: 'Cover Letter Updated',
    MOCK_INTERVIEW_COMPLETED: 'Mock Interview Completed',
    INTERVIEW_PREPARED: 'Interview Prepared',
    PROFILE_UPDATED: 'Profile Updated',
    JOB_APPLIED: 'Job Applied',
    SKILL_ASSESSED: 'Skill Assessed',
    RESOURCE_SAVED: 'Resource Saved'
  };
  return labels[type] || type;
}

function getActivityIcon(type) {
  if (type?.includes('RESUME')) return FileText;
  if (type?.includes('COVER_LETTER')) return FileText;
  if (type?.includes('INTERVIEW')) return MessageCircle;
  if (type?.includes('SKILL') || type?.includes('JOB')) return Target;
  if (type?.includes('PROFILE')) return CheckCircle;
  if (type?.includes('RESOURCE')) return Award;
  return CheckCircle;
}

function getActivityColor(type) {
  if (type?.includes('RESUME')) return 'text-blue-500';
  if (type?.includes('COVER_LETTER')) return 'text-green-500';
  if (type?.includes('INTERVIEW')) return 'text-purple-500';
  if (type?.includes('SKILL') || type?.includes('JOB')) return 'text-orange-500';
  if (type?.includes('PROFILE')) return 'text-cyan-500';
  if (type?.includes('RESOURCE')) return 'text-yellow-500';
  return 'text-primary';
}

export default function RecentActivity({ data }) {
  const activities = data?.recentActivity || [];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Recent Activity
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">Your latest actions</p>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-3 rounded-full bg-muted/30 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-1.5">No recent activity</p>
            <p className="text-[10px] text-muted-foreground">
              Start creating resumes or taking interviews!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.slice(0, 5).map((activity, index) => {
              const Icon = getActivityIcon(activity.activityType);
              const color = getActivityColor(activity.activityType);
              
              return (
                <div 
                  key={activity.id || index}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className={`p-1.5 rounded-lg bg-background border border-border/50`}>
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-xs leading-tight">
                      {getActivityLabel(activity.activityType)}
                    </p>
                    {activity.description && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {getTimeAgo(activity.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
