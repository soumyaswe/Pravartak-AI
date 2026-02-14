'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Award,
  BookOpen,
  Users,
  Clock
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Mock data for analytics
const skillProgressData = [
  { skill: 'JavaScript', current: 85, target: 95, improvement: 12 },
  { skill: 'React', current: 78, target: 90, improvement: 8 },
  { skill: 'Node.js', current: 72, target: 85, improvement: 15 },
  { skill: 'Python', current: 65, target: 80, improvement: 20 },
  { skill: 'TypeScript', current: 60, target: 75, improvement: 25 }
];

const monthlyActivityData = [
  { month: 'Jan', interviews: 2, applications: 8, skills: 3 },
  { month: 'Feb', interviews: 4, applications: 12, skills: 5 },
  { month: 'Mar', interviews: 6, applications: 15, skills: 4 },
  { month: 'Apr', interviews: 8, applications: 18, skills: 6 },
  { month: 'May', interviews: 12, applications: 22, skills: 7 },
  { month: 'Jun', interviews: 10, applications: 20, skills: 8 }
];

const careerGoalProgress = [
  { goal: 'Technical Skills', progress: 78, total: 100 },
  { goal: 'Soft Skills', progress: 85, total: 100 },
  { goal: 'Industry Knowledge', progress: 65, total: 100 },
  { goal: 'Networking', progress: 45, total: 100 },
  { goal: 'Portfolio Projects', progress: 90, total: 100 }
];

const timeSpentData = [
  { name: 'Interview Prep', value: 35, color: '#8884d8' },
  { name: 'Skill Learning', value: 30, color: '#82ca9d' },
  { name: 'Resume Building', value: 15, color: '#ffc658' },
  { name: 'Networking', value: 10, color: '#ff7300' },
  { name: 'Job Applications', value: 10, color: '#0088fe' }
];

export default function AnalyticsView() {
  const totalHours = timeSpentData.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Progress Analytics</h1>
          <p className="text-muted-foreground">Track your career development journey</p>
        </div>
        <Badge variant="outline" className="text-sm">
          Last updated: Today
        </Badge>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Score</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">4.2/5</div>
            <p className="text-xs text-green-500 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +0.3 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Improved</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">12</div>
            <p className="text-xs text-green-500 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +3 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interview Success Rate</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">73%</div>
            <p className="text-xs text-green-500 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15% improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{totalHours}h</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Activity Trends</CardTitle>
            <CardDescription>Track your career development activities over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="interviews" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.8}
                />
                <Area 
                  type="monotone" 
                  dataKey="applications" 
                  stackId="1" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.8}
                />
                <Area 
                  type="monotone" 
                  dataKey="skills" 
                  stackId="1" 
                  stroke="#ffc658" 
                  fill="#ffc658" 
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Allocation Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Time Allocation</CardTitle>
            <CardDescription>How you're spending your development time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={timeSpentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {timeSpentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Skills Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Development Progress</CardTitle>
            <CardDescription>Track your progress towards skill mastery goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {skillProgressData.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{skill.skill}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {skill.current}% / {skill.target}%
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      +{skill.improvement}%
                    </Badge>
                  </div>
                </div>
                <Progress value={skill.current} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Career Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Career Goals Progress</CardTitle>
            <CardDescription>Overall progress towards your career objectives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {careerGoalProgress.map((goal, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{goal.goal}</span>
                  <span className="text-xs text-muted-foreground">
                    {goal.progress}%
                  </span>
                </div>
                <Progress value={goal.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Key Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-600">Strengths</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Consistent interview performance improvement</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Strong portfolio project completion rate</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Above-average technical skill progression</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-orange-600">Areas for Improvement</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Increase networking activities and connections</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Focus more time on industry knowledge</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Consider more advanced Python projects</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}