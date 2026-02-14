'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, FileText, CheckCircle, Target, MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { getDashboardStats } from '@/lib/data-helpers';
import { getAssessments } from '@/actions/interview';
import { calculateProfileProgress } from '@/actions/profile-progress';
import { getActivityCounts } from '@/actions/activity-counters';

export default function StatsCards() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(null);
  const [activityCounts, setActivityCounts] = useState(null);
  const [loading, setLoading] = useState(true);

  const getLatestAssessment = () => {
    if (!assessments?.length) return null;
    // Sort by createdAt to ensure we get the most recent one
    const sorted = [...assessments].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    return sorted[0];
  };

  useEffect(() => {
    async function fetchStats() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      
      try {
        // Fetch all data in parallel
        const [dashboardStatsResult, assessmentsData, profileProgress, counts] = await Promise.all([
          getDashboardStats(user.uid),
          getAssessments(),
          calculateProfileProgress(),
          getActivityCounts()
        ]);
        
        console.log('Profile progress data received:', profileProgress);
        console.log('Assessments data received:', assessmentsData);
        console.log('Dashboard stats received:', dashboardStatsResult);
        console.log('Activity counts received:', counts);
        
        setStats(dashboardStatsResult.stats);
        setAssessments(assessmentsData || []);
        setProfileCompletion(profileProgress);
        setActivityCounts(counts);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        console.error('Error details:', error.message, error.stack);
        
        // Set default stats on error
        setStats({
          profileCompletion: 0,
          documentsCreated: 0,
          interviewSessions: 0,
          latestMockScore: null
        });
        setAssessments([]);
        setProfileCompletion({
          completionPercentage: 0,
          completedCount: 0,
          totalCount: 0,
          error: error.message
        });
        setActivityCounts({
          documentsCreated: 0,
          interviewSessions: 0
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-4 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Get latest assessment score
  const latestAssessment = getLatestAssessment();
  const latestScore = latestAssessment?.quizScore;
  
  // Get profile completion percentage from comprehensive calculation
  const completionPercentage = profileCompletion?.completionPercentage || 0;

  const careerStatsData = [
    {
      title: 'Profile Completion',
      value: `${completionPercentage}%`,
      icon: CheckCircle,
      color: completionPercentage >= 80 ? 'text-green-500' : completionPercentage >= 50 ? 'text-yellow-500' : 'text-red-500'
    },
    {
      title: 'Documents Created',
      value: activityCounts?.documentsCreated || 0,
      icon: FileText,
      color: 'text-blue-500'
    },
    {
      title: 'Interview Sessions',
      value: activityCounts?.interviewSessions || 0,
      icon: MessageCircle,
      color: 'text-purple-500'
    },
    {
      title: 'Latest Practice Score',
      value: latestScore != null ? `${latestScore.toFixed(1)}%` : 'N/A',
      icon: Target,
      color: latestScore >= 70 ? 'text-green-500' : latestScore >= 50 ? 'text-yellow-500' : 'text-orange-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {careerStatsData.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index} className="bg-card border-border hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xl font-bold text-foreground">{stat.value}</span>
              </div>
              <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}