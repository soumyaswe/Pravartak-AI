'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import {
  CheckCircle,
  Circle,
  Clock,
  BookOpen,
  Award,
  Target,
  TrendingUp,
  Users,
  Briefcase,
  Star,
  ArrowRight,
  Calendar,
  Zap,
} from 'lucide-react';

const roadmapData = {
  'frontend-developer': {
    beginner: [
      {
        phase: 'Foundation',
        duration: '2-3 months',
        description: 'Build your web development foundation',
        milestones: [
          {
            id: 1,
            title: 'HTML & CSS Basics',
            description: 'Learn semantic HTML and responsive CSS',
            skills: ['HTML5', 'CSS3', 'Flexbox', 'Grid'],
            timeframe: '3-4 weeks',
            resources: ['MDN Web Docs', 'freeCodeCamp', 'CSS Tricks'],
            completed: false,
          },
          {
            id: 2,
            title: 'JavaScript Fundamentals',
            description: 'Master core JavaScript concepts',
            skills: ['ES6+', 'DOM Manipulation', 'Event Handling', 'Async/Await'],
            timeframe: '4-6 weeks',
            resources: ['JavaScript.info', 'Eloquent JavaScript', 'MDN'],
            completed: false,
          },
          {
            id: 3,
            title: 'Version Control',
            description: 'Learn Git and GitHub workflow',
            skills: ['Git', 'GitHub', 'Branching', 'Pull Requests'],
            timeframe: '1-2 weeks',
            resources: ['Git Handbook', 'GitHub Learning Lab'],
            completed: false,
          },
        ],
      },
      {
        phase: 'Framework Learning',
        duration: '3-4 months',
        description: 'Master modern frontend frameworks',
        milestones: [
          {
            id: 4,
            title: 'React Fundamentals',
            description: 'Build interactive user interfaces',
            skills: ['Components', 'Props', 'State', 'Hooks'],
            timeframe: '6-8 weeks',
            resources: ['React Official Docs', 'React Tutorial', 'Scrimba'],
            completed: false,
          },
          {
            id: 5,
            title: 'State Management',
            description: 'Handle complex application state',
            skills: ['Context API', 'Redux', 'Zustand'],
            timeframe: '3-4 weeks',
            resources: ['Redux Toolkit', 'Zustand Docs'],
            completed: false,
          },
          {
            id: 6,
            title: 'Build Tools & Deployment',
            description: 'Set up development workflow',
            skills: ['Vite', 'Webpack', 'Netlify', 'Vercel'],
            timeframe: '2-3 weeks',
            resources: ['Vite Guide', 'Deployment Tutorials'],
            completed: false,
          },
        ],
      },
      {
        phase: 'Portfolio & Job Prep',
        duration: '2-3 months',
        description: 'Build portfolio and prepare for interviews',
        milestones: [
          {
            id: 7,
            title: 'Portfolio Projects',
            description: 'Create 3-5 impressive projects',
            skills: ['Project Planning', 'UI/UX', 'Clean Code'],
            timeframe: '6-8 weeks',
            resources: ['Frontend Mentor', 'Project Ideas'],
            completed: false,
          },
          {
            id: 8,
            title: 'Interview Preparation',
            description: 'Master technical interviews',
            skills: ['Coding Challenges', 'System Design', 'Behavioral'],
            timeframe: '3-4 weeks',
            resources: ['LeetCode', 'Frontend Interview Handbook'],
            completed: false,
          },
        ],
      },
    ],
    intermediate: [
      {
        phase: 'Advanced Concepts',
        duration: '3-4 months',
        description: 'Deepen your frontend expertise',
        milestones: [
          {
            id: 9,
            title: 'TypeScript Mastery',
            description: 'Add type safety to your applications',
            skills: ['TypeScript', 'Interfaces', 'Generics', 'Advanced Types'],
            timeframe: '4-6 weeks',
            resources: ['TypeScript Handbook', 'Type Challenges'],
            completed: false,
          },
          {
            id: 10,
            title: 'Testing & Quality',
            description: 'Ensure code reliability',
            skills: ['Jest', 'React Testing Library', 'E2E Testing'],
            timeframe: '3-4 weeks',
            resources: ['Testing Library Docs', 'Jest Documentation'],
            completed: false,
          },
        ],
      },
    ],
  },
  'data-scientist': {
    beginner: [
      {
        phase: 'Python & Statistics',
        duration: '3-4 months',
        description: 'Build your data science foundation',
        milestones: [
          {
            id: 1,
            title: 'Python Programming',
            description: 'Master Python for data science',
            skills: ['Python Basics', 'NumPy', 'Pandas', 'Matplotlib'],
            timeframe: '6-8 weeks',
            resources: ['Python.org', 'Pandas Documentation', 'NumPy Tutorial'],
            completed: false,
          },
          {
            id: 2,
            title: 'Statistics & Math',
            description: 'Understand statistical concepts',
            skills: ['Descriptive Statistics', 'Probability', 'Hypothesis Testing'],
            timeframe: '4-6 weeks',
            resources: ['Khan Academy Statistics', 'Think Stats'],
            completed: false,
          },
        ],
      },
      {
        phase: 'Machine Learning',
        duration: '4-5 months',
        description: 'Learn ML algorithms and applications',
        milestones: [
          {
            id: 3,
            title: 'Supervised Learning',
            description: 'Master classification and regression',
            skills: ['Linear Regression', 'Decision Trees', 'Random Forest'],
            timeframe: '6-8 weeks',
            resources: ['Scikit-learn', 'Coursera ML Course'],
            completed: false,
          },
        ],
      },
    ],
  },
};

export default function RoadmapVisualization({ career, level, path }) {
  const [completedMilestones, setCompletedMilestones] = useState(new Set());

  const toggleMilestone = (milestoneId) => {
    const newCompleted = new Set(completedMilestones);
    if (newCompleted.has(milestoneId)) {
      newCompleted.delete(milestoneId);
    } else {
      newCompleted.add(milestoneId);
    }
    setCompletedMilestones(newCompleted);
  };

  // Use AI-generated roadmap if available, otherwise fall back to hardcoded data
  const useAIRoadmap = career.aiRoadmap && career.aiRoadmap.roadmap;
  
  let phases = [];
  
  if (useAIRoadmap) {
    // Convert AI roadmap format to our component format
    phases = career.aiRoadmap.roadmap.map((stage, index) => ({
      phase: stage.title,
      duration: `${2 + index} weeks`, // Estimated duration
      description: `Complete the ${stage.title.toLowerCase()} phase`,
      milestones: stage.steps.map((step, stepIndex) => ({
        id: `${index}_${stepIndex}`,
        title: step.length > 50 ? step.substring(0, 50) + '...' : step,
        description: step,
        skills: extractSkillsFromStep(step),
        timeframe: `${1 + stepIndex} week`,
        resources: ['AI Recommended Resources', 'Online Courses', 'Documentation'],
        completed: false,
      }))
    }));
    console.log('AI Roadmap phases generated:', phases);
  } else {
    // Fallback to original hardcoded data
    phases = roadmapData[career.id]?.[level] || [];
    console.log('Using hardcoded phases:', phases.length, 'for career:', career.id, 'level:', level);
  }

  // Helper function to extract skills from step description
  function extractSkillsFromStep(step) {
    // Simple keyword extraction for common tech terms
    const techKeywords = [
      'JavaScript', 'Python', 'React', 'Node.js', 'HTML', 'CSS', 'SQL', 
      'Machine Learning', 'Data Science', 'API', 'Database', 'Cloud',
      'AWS', 'Docker', 'Git', 'Testing', 'Programming', 'Web Development'
    ];
    
    const foundSkills = techKeywords.filter(skill => 
      step.toLowerCase().includes(skill.toLowerCase())
    );
    
    return foundSkills.length > 0 ? foundSkills.slice(0, 3) : ['Core Skills', 'Professional Development'];
  }
  
  if (phases.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {useAIRoadmap ? 'AI Roadmap Generated!' : 'Roadmap Coming Soon'}
          </h3>
          <p className="text-muted-foreground">
            {useAIRoadmap 
              ? `Your personalized AI-generated roadmap for ${career.title} is ready!`
              : `We're building a comprehensive roadmap for ${career.title} at ${level} level.`
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalMilestones = phases.reduce((total, phase) => total + phase.milestones.length, 0);
  const completedCount = Array.from(completedMilestones).length;
  const progressPercentage = totalMilestones > 0 ? (completedCount / totalMilestones) * 100 : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                Your Progress
              </CardTitle>
              {useAIRoadmap && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                  <Zap className="h-3 w-3 mr-1" />
                  AI Generated
                </Badge>
              )}
            </div>
            <Badge variant="outline" className="flex items-center gap-1 self-start sm:self-center">
              <Calendar className="h-3 w-3" />
              {level.charAt(0).toUpperCase() + level.slice(1)} Level
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {completedCount} of {totalMilestones} milestones
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2 sm:h-3" />
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2">
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{phases.length}</p>
                <p className="text-xs text-muted-foreground">Phases</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-green-600">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-purple-600">
                  {Math.round(progressPercentage)}%
                </p>
                <p className="text-xs text-muted-foreground">Progress</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roadmap Phases */}
      <div className="space-y-6 sm:space-y-8">
        {phases.map((phase, phaseIndex) => (
          <Card key={phaseIndex} className="relative">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                      {phaseIndex + 1}
                    </div>
                    {phase.phase}
                  </CardTitle>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1 ml-8 sm:ml-11">{phase.description}</p>
                </div>
                <Badge variant="outline" className="flex items-center gap-1 self-start sm:self-center">
                  <Clock className="h-3 w-3" />
                  {phase.duration}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {phase.milestones.map((milestone, milestoneIndex) => {
                  const isCompleted = completedMilestones.has(milestone.id);
                  
                  return (
                    <div
                      key={milestone.id}
                      className={`border rounded-lg p-3 sm:p-4 transition-all duration-200 ${
                        isCompleted ? 'bg-green-50 border-green-200' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-5 w-5 sm:h-6 sm:w-6 rounded-full mt-1 flex-shrink-0"
                          onClick={() => toggleMilestone(milestone.id)}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          )}
                        </Button>
                        
                        <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                          <div>
                            <h4 className={`text-sm sm:text-base font-semibold ${isCompleted ? 'text-green-800' : ''}`}>
                              {milestone.title}
                            </h4>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {milestone.description}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Skills to Learn
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {milestone.skills.map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Timeframe
                              </p>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span className="text-sm">{milestone.timeframe}</span>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Resources
                              </p>
                              <div className="space-y-1">
                                {milestone.resources.slice(0, 2).map((resource, index) => (
                                  <div key={index} className="flex items-center gap-1">
                                    <BookOpen className="h-3 w-3 text-blue-600" />
                                    <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                                      {resource}
                                    </span>
                                  </div>
                                ))}
                                {milestone.resources.length > 2 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{milestone.resources.length - 2} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            
            {/* Connection line to next phase */}
            {phaseIndex < phases.length - 1 && (
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="w-8 h-8 bg-background border-2 border-muted rounded-full flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button className="flex items-center gap-2 h-auto p-4">
              <BookOpen className="h-4 w-4" />
              <div className="text-left">
                <p className="font-medium">Start Learning</p>
                <p className="text-xs opacity-80">Begin first milestone</p>
              </div>
            </Button>
            <Button variant="outline" className="flex items-center gap-2 h-auto p-4">
              <Users className="h-4 w-4" />
              <div className="text-left">
                <p className="font-medium">Join Community</p>
                <p className="text-xs opacity-80">Connect with peers</p>
              </div>
            </Button>
            <Button variant="outline" className="flex items-center gap-2 h-auto p-4">
              <Briefcase className="h-4 w-4" />
              <div className="text-left">
                <p className="font-medium">Find Mentors</p>
                <p className="text-xs opacity-80">Get guidance</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}