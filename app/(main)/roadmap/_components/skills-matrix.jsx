'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import {
  Target,
  TrendingUp,
  Star,
  BookOpen,
  Award,
  CheckCircle,
  AlertCircle,
  Circle,
  Zap,
} from 'lucide-react';

const skillsData = {
  'frontend-developer': {
    beginner: {
      technical: [
        { name: 'HTML/CSS', level: 0, required: 80, priority: 'high', category: 'Core' },
        { name: 'JavaScript', level: 0, required: 85, priority: 'high', category: 'Core' },
        { name: 'React', level: 0, required: 75, priority: 'high', category: 'Framework' },
        { name: 'Git/GitHub', level: 0, required: 70, priority: 'medium', category: 'Tools' },
        { name: 'Responsive Design', level: 0, required: 80, priority: 'high', category: 'Core' },
        { name: 'TypeScript', level: 0, required: 60, priority: 'medium', category: 'Language' },
        { name: 'Testing', level: 0, required: 50, priority: 'low', category: 'Quality' },
        { name: 'Build Tools', level: 0, required: 55, priority: 'medium', category: 'Tools' },
      ],
      soft: [
        { name: 'Communication', level: 0, required: 80, priority: 'high' },
        { name: 'Problem Solving', level: 0, required: 85, priority: 'high' },
        { name: 'Teamwork', level: 0, required: 75, priority: 'medium' },
        { name: 'Time Management', level: 0, required: 70, priority: 'medium' },
        { name: 'Adaptability', level: 0, required: 75, priority: 'medium' },
        { name: 'Attention to Detail', level: 0, required: 80, priority: 'high' },
      ],
    },
    intermediate: {
      technical: [
        { name: 'Advanced React', level: 0, required: 85, priority: 'high', category: 'Framework' },
        { name: 'State Management', level: 0, required: 80, priority: 'high', category: 'Framework' },
        { name: 'TypeScript', level: 0, required: 80, priority: 'high', category: 'Language' },
        { name: 'Testing & TDD', level: 0, required: 75, priority: 'high', category: 'Quality' },
        { name: 'Performance Optimization', level: 0, required: 75, priority: 'medium', category: 'Core' },
        { name: 'Build Tools & CI/CD', level: 0, required: 70, priority: 'medium', category: 'Tools' },
        { name: 'API Integration', level: 0, required: 80, priority: 'high', category: 'Core' },
        { name: 'Web Security', level: 0, required: 65, priority: 'medium', category: 'Security' },
      ],
      soft: [
        { name: 'Leadership', level: 0, required: 70, priority: 'medium' },
        { name: 'Mentoring', level: 0, required: 65, priority: 'medium' },
        { name: 'Code Review', level: 0, required: 75, priority: 'high' },
        { name: 'Project Management', level: 0, required: 70, priority: 'medium' },
        { name: 'Client Communication', level: 0, required: 75, priority: 'high' },
      ],
    },
  },
  'data-scientist': {
    beginner: {
      technical: [
        { name: 'Python', level: 0, required: 85, priority: 'high', category: 'Programming' },
        { name: 'Statistics', level: 0, required: 80, priority: 'high', category: 'Math' },
        { name: 'Pandas/NumPy', level: 0, required: 80, priority: 'high', category: 'Libraries' },
        { name: 'Data Visualization', level: 0, required: 75, priority: 'medium', category: 'Visualization' },
        { name: 'SQL', level: 0, required: 75, priority: 'high', category: 'Database' },
        { name: 'Machine Learning Basics', level: 0, required: 70, priority: 'medium', category: 'ML' },
        { name: 'Jupyter Notebooks', level: 0, required: 70, priority: 'medium', category: 'Tools' },
      ],
      soft: [
        { name: 'Analytical Thinking', level: 0, required: 85, priority: 'high' },
        { name: 'Communication', level: 0, required: 80, priority: 'high' },
        { name: 'Business Acumen', level: 0, required: 70, priority: 'medium' },
        { name: 'Curiosity', level: 0, required: 75, priority: 'medium' },
        { name: 'Attention to Detail', level: 0, required: 80, priority: 'high' },
      ],
    },
  },
};

export default function SkillsMatrix({ career, level }) {
  const [skillLevels, setSkillLevels] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Use AI-generated roadmap to extract skills if available
  const useAIRoadmap = career.aiRoadmap && career.aiRoadmap.roadmap;
  
  let careerSkills = null;
  
  if (useAIRoadmap) {
    // Extract skills from AI roadmap
    const aiSkills = extractSkillsFromAIRoadmap(career.aiRoadmap);
    careerSkills = {
      technical: aiSkills.technical,
      soft: aiSkills.soft
    };
  } else {
    // Use hardcoded skills data
    careerSkills = skillsData[career.id]?.[level];
  }

  // Helper function to extract skills from AI roadmap
  function extractSkillsFromAIRoadmap(aiRoadmap) {
    const techKeywords = {
      'Programming': ['JavaScript', 'Python', 'Java', 'C++', 'programming', 'coding', 'development'],
      'Web Development': ['HTML', 'CSS', 'React', 'Angular', 'Vue', 'web', 'frontend', 'backend'],
      'Data Science': ['pandas', 'numpy', 'machine learning', 'data analysis', 'statistics', 'SQL'],
      'Cloud': ['AWS', 'Azure', 'cloud', 'Docker', 'Kubernetes'],
      'Databases': ['SQL', 'database', 'MongoDB', 'PostgreSQL'],
      'Tools': ['Git', 'GitHub', 'IDE', 'testing', 'debugging']
    };

    const softSkills = [
      'Communication', 'Problem Solving', 'Teamwork', 'Time Management', 
      'Adaptability', 'Leadership', 'Critical Thinking', 'Creativity'
    ];

    const extractedTechnical = [];
    const extractedSoft = [];

    // Extract technical skills from roadmap steps
    aiRoadmap.roadmap.forEach(stage => {
      stage.steps.forEach(step => {
        const stepLower = step.toLowerCase();
        
        Object.entries(techKeywords).forEach(([category, keywords]) => {
          keywords.forEach(keyword => {
            if (stepLower.includes(keyword.toLowerCase())) {
              const existingSkill = extractedTechnical.find(s => s.name === category);
              if (!existingSkill) {
                extractedTechnical.push({
                  name: category,
                  level: 0,
                  required: Math.floor(Math.random() * 20) + 70, // 70-90%
                  priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
                  category: category
                });
              }
            }
          });
        });
      });
    });

    // Add some soft skills
    softSkills.slice(0, 5).forEach(skill => {
      extractedSoft.push({
        name: skill,
        level: 0,
        required: Math.floor(Math.random() * 20) + 70,
        priority: ['high', 'medium'][Math.floor(Math.random() * 2)]
      });
    });

    return {
      technical: extractedTechnical.length > 0 ? extractedTechnical : [
        { name: 'Core Skills', level: 0, required: 80, priority: 'high', category: 'Essential' },
        { name: 'Industry Knowledge', level: 0, required: 75, priority: 'high', category: 'Domain' },
        { name: 'Professional Tools', level: 0, required: 70, priority: 'medium', category: 'Tools' }
      ],
      soft: extractedSoft
    };
  }
  
  if (!careerSkills) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Skills Matrix Coming Soon</h3>
          <p className="text-muted-foreground">
            We're building a comprehensive skills matrix for {career.title} at {level} level.
          </p>
        </CardContent>
      </Card>
    );
  }

  const updateSkillLevel = (skillName, newLevel) => {
    setSkillLevels(prev => ({
      ...prev,
      [skillName]: newLevel
    }));
  };

  const getSkillLevel = (skillName) => {
    return skillLevels[skillName] || 0;
  };

  const getSkillStatus = (skill) => {
    const currentLevel = getSkillLevel(skill.name);
    if (currentLevel >= skill.required) return 'mastered';
    if (currentLevel >= skill.required * 0.7) return 'proficient';
    if (currentLevel > 0) return 'learning';
    return 'not-started';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'mastered': return 'text-green-400 bg-green-900/20 border-green-500/20';
      case 'proficient': return 'text-blue-400 bg-blue-900/20 border-blue-500/20';
      case 'learning': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/20';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/20';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-500/30 bg-red-900/10';
      case 'medium': return 'border-yellow-500/30 bg-yellow-900/10';
      case 'low': return 'border-green-500/30 bg-green-900/10';
      default: return 'border-gray-500/30 bg-gray-900/10';
    }
  };

  const categories = careerSkills.technical ? 
    [...new Set(careerSkills.technical.map(skill => skill.category))] : 
    [];

  const filteredTechnicalSkills = careerSkills.technical?.filter(skill => 
    selectedCategory === 'all' || skill.category === selectedCategory
  ) || [];

  const calculateOverallProgress = () => {
    const allSkills = [...(careerSkills.technical || []), ...(careerSkills.soft || [])];
    const totalProgress = allSkills.reduce((sum, skill) => {
      const current = getSkillLevel(skill.name);
      const percentage = Math.min((current / skill.required) * 100, 100);
      return sum + percentage;
    }, 0);
    return Math.round(totalProgress / allSkills.length);
  };

  const getSkillGaps = () => {
    const allSkills = [...(careerSkills.technical || []), ...(careerSkills.soft || [])];
    return allSkills
      .filter(skill => getSkillLevel(skill.name) < skill.required && skill.priority === 'high')
      .sort((a, b) => b.required - getSkillLevel(b.name) - (a.required - getSkillLevel(a.name)));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Target className="h-4 w-4 sm:h-5 sm:w-5" />
            Skills Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-blue-400">
                {calculateOverallProgress()}%
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Overall Progress</div>
            </div>
            <div className="text-center p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-green-400">
                {careerSkills.technical?.filter(skill => getSkillStatus(skill) === 'mastered').length || 0}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Mastered Skills</div>
            </div>
            <div className="text-center p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-yellow-400">
                {careerSkills.technical?.filter(skill => getSkillStatus(skill) === 'learning').length || 0}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-red-400">
                {getSkillGaps().length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Priority Gaps</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Gaps Alert */}
      {getSkillGaps().length > 0 && (
        <Card className="border-orange-500/30 bg-orange-900/10">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-orange-400 text-base sm:text-lg">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              Priority Skill Gaps
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <p className="text-xs sm:text-sm text-orange-300 mb-3">
              Focus on these high-priority skills to advance your career:
            </p>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {getSkillGaps().slice(0, 5).map((skill, index) => (
                <Badge key={index} variant="outline" className="border-orange-300 text-orange-700 text-xs">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Skills */}
      {careerSkills.technical && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Technical Skills
              </CardTitle>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  All
                </Button>
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">{category}</span>
                    <span className="sm:hidden">{category.slice(0, 4)}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {filteredTechnicalSkills.map((skill, index) => {
                const currentLevel = getSkillLevel(skill.name);
                const status = getSkillStatus(skill);
                const progressPercentage = Math.min((currentLevel / skill.required) * 100, 100);

                return (
                  <div
                    key={index}
                    className={`p-3 sm:p-4 rounded-lg border-2 ${getPriorityColor(skill.priority)}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2 sm:gap-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <h4 className="text-sm sm:text-base font-semibold">{skill.name}</h4>
                        <div className="flex gap-2">
                          <Badge className={`${getStatusColor(status)} text-xs`} variant="secondary">
                            {status.replace('-', ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {skill.priority} priority
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {currentLevel}% / {skill.required}%
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Progress value={progressPercentage} className="h-2" />
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex gap-1 overflow-x-auto pb-1">
                          {[20, 40, 60, 80, 100].map((level) => (
                            <Button
                              key={level}
                              variant={currentLevel >= level ? 'default' : 'outline'}
                              size="sm"
                              className="h-6 w-8 sm:h-8 sm:w-8 p-0 text-xs flex-shrink-0"
                              onClick={() => updateSkillLevel(skill.name, level)}
                            >
                              {level}
                            </Button>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Category: {skill.category}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Soft Skills */}
      {careerSkills.soft && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              Soft Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {careerSkills.soft.map((skill, index) => {
                const currentLevel = getSkillLevel(skill.name);
                const status = getSkillStatus(skill);
                const progressPercentage = Math.min((currentLevel / skill.required) * 100, 100);

                return (
                  <div
                    key={index}
                    className={`p-3 sm:p-4 rounded-lg border-2 ${getPriorityColor(skill.priority)}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2 sm:gap-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h4 className="text-sm sm:text-base font-medium">{skill.name}</h4>
                        <Badge className={`${getStatusColor(status)} text-xs`} variant="secondary">
                          {status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {currentLevel}%
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Progress value={progressPercentage} className="h-2" />
                      <div className="flex gap-1 overflow-x-auto pb-1">
                        {[20, 40, 60, 80, 100].map((level) => (
                          <Button
                            key={level}
                            variant={currentLevel >= level ? 'default' : 'outline'}
                            size="sm"
                            className="h-6 w-8 p-0 text-xs flex-shrink-0"
                            onClick={() => updateSkillLevel(skill.name, level)}
                          >
                            {level}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-600" />
            Learning Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Next Focus Areas:</h4>
              <div className="grid md:grid-cols-3 gap-3">
                {getSkillGaps().slice(0, 3).map((skill, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <h5 className="font-medium">{skill.name}</h5>
                    <p className="text-sm text-muted-foreground">
                      Gap: {skill.required - getSkillLevel(skill.name)}% to target
                    </p>
                    <Button size="sm" className="mt-2 w-full">
                      Start Learning
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}