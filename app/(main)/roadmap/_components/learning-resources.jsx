'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import {
  BookOpen,
  Video,
  Monitor,
  Award,
  Users,
  ExternalLink,
  Star,
  Clock,
  DollarSign,
  Globe,
  PlayCircle,
  FileText,
  Headphones,
  Code,
  Target,
  TrendingUp,
} from 'lucide-react';

const learningResources = {
  'frontend-developer': {
    beginner: {
      courses: [
        {
          title: 'The Complete Web Developer Course',
          provider: 'Udemy',
          type: 'video',
          duration: '40 hours',
          rating: 4.6,
          price: 'paid',
          level: 'beginner',
          skills: ['HTML', 'CSS', 'JavaScript', 'React'],
          url: '#',
          description: 'Complete introduction to web development from scratch',
        },
        {
          title: 'FreeCodeCamp Responsive Web Design',
          provider: 'FreeCodeCamp',
          type: 'interactive',
          duration: '300 hours',
          rating: 4.8,
          price: 'free',
          level: 'beginner',
          skills: ['HTML', 'CSS', 'Responsive Design'],
          url: '#',
          description: 'Hands-on web design certification program',
        },
        {
          title: 'JavaScript Basics',
          provider: 'MDN Web Docs',
          type: 'documentation',
          duration: 'Self-paced',
          rating: 4.9,
          price: 'free',
          level: 'beginner',
          skills: ['JavaScript'],
          url: '#',
          description: 'Comprehensive JavaScript documentation and tutorials',
        },
        {
          title: 'React for Beginners',
          provider: 'Scrimba',
          type: 'interactive',
          duration: '15 hours',
          rating: 4.7,
          price: 'free',
          level: 'beginner',
          skills: ['React', 'JavaScript'],
          url: '#',
          description: 'Interactive React course with real projects',
        },
      ],
      projects: [
        {
          title: 'Personal Portfolio Website',
          difficulty: 'beginner',
          duration: '2-3 weeks',
          skills: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'],
          description: 'Build a responsive portfolio to showcase your work',
          features: ['Responsive design', 'Contact form', 'Project gallery', 'Smooth animations'],
        },
        {
          title: 'Todo List App',
          difficulty: 'beginner',
          duration: '1-2 weeks',
          skills: ['HTML', 'CSS', 'JavaScript', 'Local Storage'],
          description: 'Create a functional todo application with persistence',
          features: ['Add/delete tasks', 'Mark as complete', 'Filter tasks', 'Local storage'],
        },
        {
          title: 'Weather App',
          difficulty: 'intermediate',
          duration: '2-3 weeks',
          skills: ['React', 'API Integration', 'State Management'],
          description: 'Build a weather app using external APIs',
          features: ['Current weather', 'Location search', 'Forecasts', 'Responsive design'],
        },
      ],
      books: [
        {
          title: 'Eloquent JavaScript',
          author: 'Marijn Haverbeke',
          type: 'technical',
          rating: 4.5,
          price: 'free',
          description: 'Modern introduction to programming with JavaScript',
          url: '#',
        },
        {
          title: 'You Don\'t Know JS',
          author: 'Kyle Simpson',
          type: 'technical',
          rating: 4.8,
          price: 'free',
          description: 'Deep dive into JavaScript fundamentals',
          url: '#',
        },
        {
          title: 'CSS: The Definitive Guide',
          author: 'Eric A. Meyer',
          type: 'reference',
          rating: 4.4,
          price: 'paid',
          description: 'Comprehensive guide to CSS',
          url: '#',
        },
      ],
      communities: [
        {
          name: 'Frontend Mentor',
          type: 'challenge',
          members: '500K+',
          description: 'Real-world frontend challenges with designs',
          url: '#',
        },
        {
          name: 'Dev.to Frontend Community',
          type: 'forum',
          members: '1M+',
          description: 'Articles, discussions, and networking for developers',
          url: '#',
        },
        {
          name: 'React Community Discord',
          type: 'chat',
          members: '100K+',
          description: 'Live chat and help for React developers',
          url: '#',
        },
        {
          name: 'Stack Overflow',
          type: 'q&a',
          members: '21M+',
          description: 'Programming questions and answers',
          url: '#',
        },
      ],
      tools: [
        {
          name: 'VS Code',
          category: 'editor',
          price: 'free',
          description: 'Popular code editor with excellent extensions',
          url: '#',
        },
        {
          name: 'Chrome DevTools',
          category: 'debugging',
          price: 'free',
          description: 'Browser developer tools for debugging',
          url: '#',
        },
        {
          name: 'Figma',
          category: 'design',
          price: 'freemium',
          description: 'Design tool for creating UI mockups',
          url: '#',
        },
        {
          name: 'Git & GitHub',
          category: 'version-control',
          price: 'free',
          description: 'Version control and code hosting',
          url: '#',
        },
      ],
    },
  },
  'data-scientist': {
    beginner: {
      courses: [
        {
          title: 'Python for Data Science and Machine Learning',
          provider: 'Udemy',
          type: 'video',
          duration: '25 hours',
          rating: 4.7,
          price: 'paid',
          level: 'beginner',
          skills: ['Python', 'Pandas', 'NumPy', 'Machine Learning'],
          url: '#',
          description: 'Complete Python data science bootcamp',
        },
        {
          title: 'Kaggle Learn',
          provider: 'Kaggle',
          type: 'interactive',
          duration: 'Self-paced',
          rating: 4.6,
          price: 'free',
          level: 'beginner',
          skills: ['Python', 'Machine Learning', 'Data Visualization'],
          url: '#',
          description: 'Free micro-courses on data science topics',
        },
      ],
      projects: [
        {
          title: 'Exploratory Data Analysis',
          difficulty: 'beginner',
          duration: '1-2 weeks',
          skills: ['Python', 'Pandas', 'Matplotlib'],
          description: 'Analyze a dataset and create visualizations',
          features: ['Data cleaning', 'Statistical analysis', 'Visualizations', 'Insights'],
        },
      ],
      books: [
        {
          title: 'Python for Data Analysis',
          author: 'Wes McKinney',
          type: 'technical',
          rating: 4.6,
          price: 'paid',
          description: 'Essential guide to data manipulation with pandas',
          url: '#',
        },
      ],
      communities: [
        {
          name: 'Kaggle Community',
          type: 'competition',
          members: '13M+',
          description: 'Data science competitions and datasets',
          url: '#',
        },
      ],
      tools: [
        {
          name: 'Jupyter Notebook',
          category: 'environment',
          price: 'free',
          description: 'Interactive computing environment',
          url: '#',
        },
      ],
    },
  },
};

export default function LearningResources({ career, level }) {
  const [selectedType, setSelectedType] = useState('courses');
  
  // Use AI-generated roadmap to create relevant resources if available
  const useAIRoadmap = career.aiRoadmap && career.aiRoadmap.roadmap;
  
  let resources = null;
  
  if (useAIRoadmap) {
    // Generate resources based on AI roadmap
    resources = generateResourcesFromAIRoadmap(career.aiRoadmap, career.title);
  } else {
    // Use hardcoded resources
    resources = learningResources[career.id]?.[level];
  }

  // Helper function to generate resources from AI roadmap
  function generateResourcesFromAIRoadmap(aiRoadmap, careerTitle) {
    const courses = [];
    const projects = [];
    const books = [];
    const communities = [];
    const tools = [];

    // Generate courses based on roadmap stages
    aiRoadmap.roadmap.forEach((stage, index) => {
      courses.push({
        title: `${stage.title} Mastery Course`,
        provider: 'AI Recommended',
        type: 'video',
        duration: `${10 + index * 5} hours`,
        rating: 4.5 + Math.random() * 0.4,
        price: index === 0 ? 'free' : 'paid',
        level: level,
        skills: stage.steps.slice(0, 3).map(step => {
          const words = step.split(' ');
          return words.slice(0, 2).join(' ');
        }),
        url: '#',
        description: `Comprehensive course covering ${stage.title.toLowerCase()} for ${careerTitle}`,
      });

      // Generate a project for each stage
      projects.push({
        title: `${stage.title} Project`,
        difficulty: index === 0 ? 'beginner' : index === 1 ? 'intermediate' : 'advanced',
        duration: `${1 + index} weeks`,
        skills: stage.steps.slice(0, 4).map(step => {
          const words = step.split(' ');
          return words.slice(0, 2).join(' ');
        }),
        description: `Build a practical project to demonstrate ${stage.title.toLowerCase()} skills`,
        features: stage.steps.slice(0, 4),
      });
    });

    // Add some books
    books.push(
      {
        title: `The Complete ${careerTitle} Guide`,
        author: 'Industry Expert',
        type: 'technical',
        rating: 4.6,
        price: 'paid',
        description: `Comprehensive guide to becoming a successful ${careerTitle}`,
        url: '#',
      },
      {
        title: `${careerTitle} Best Practices`,
        author: 'Professional Author',
        type: 'reference',
        rating: 4.4,
        price: 'free',
        description: `Essential practices and patterns for ${careerTitle}s`,
        url: '#',
      }
    );

    // Add communities
    communities.push(
      {
        name: `${careerTitle} Community`,
        type: 'forum',
        members: '50K+',
        description: `Connect with other ${careerTitle}s and share knowledge`,
        url: '#',
      },
      {
        name: `${careerTitle} Network`,
        type: 'professional',
        members: '25K+',
        description: `Professional networking for ${careerTitle}s`,
        url: '#',
      }
    );

    // Add tools
    tools.push(
      {
        name: 'Professional IDE',
        category: 'development',
        price: 'freemium',
        description: 'Integrated development environment for your work',
        url: '#',
      },
      {
        name: 'Industry Tools',
        category: 'productivity',
        price: 'paid',
        description: `Essential tools for ${careerTitle}s`,
        url: '#',
      }
    );

    return { courses, projects, books, communities, tools };
  }
  
  if (!resources) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Learning Resources Coming Soon</h3>
          <p className="text-muted-foreground">
            We're curating the best learning resources for {career.title} at {level} level.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'interactive': return <Monitor className="h-4 w-4" />;
      case 'documentation': return <FileText className="h-4 w-4" />;
      case 'podcast': return <Headphones className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getPriceColor = (price) => {
    return price === 'free' ? 'text-green-600' : 'text-blue-600';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs value={selectedType} onValueChange={setSelectedType}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto p-1">
          <TabsTrigger value="courses" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <PlayCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Courses</span>
            <span className="sm:hidden">Learn</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Code className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Projects</span>
            <span className="sm:hidden">Build</span>
          </TabsTrigger>
          <TabsTrigger value="books" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Books</span>
            <span className="sm:hidden">Read</span>
          </TabsTrigger>
          <TabsTrigger value="communities" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Communities</span>
            <span className="sm:hidden">Join</span>
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Target className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Tools</span>
            <span className="sm:hidden">Use</span>
          </TabsTrigger>
        </TabsList>

        {/* Courses */}
        <TabsContent value="courses" className="mt-4 sm:mt-6">
          <div className="grid gap-3 sm:gap-4">
            {resources.courses?.map((course, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4 gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(course.type)}
                          <h3 className="text-base sm:text-lg font-semibold">{course.title}</h3>
                        </div>
                        <Badge variant="outline" className="self-start sm:self-center text-xs">
                          {course.provider}
                        </Badge>
                      </div>
                      <p className="text-sm sm:text-base text-muted-foreground mb-3">{course.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          {course.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(course.rating)}
                          <span className="ml-1">{course.rating}</span>
                        </div>
                        <div className={`flex items-center gap-1 ${getPriceColor(course.price)}`}>
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                          {course.price}
                        </div>
                        <Badge className={`${getDifficultyColor(course.level)} text-xs`}>
                          {course.level}
                        </Badge>
                      </div>
                    </div>
                    <Button className="w-full lg:w-auto lg:ml-4 text-sm">
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      View Course
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {course.skills.map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )) || (
              <div className="text-center py-8 text-muted-foreground">
                No courses available for this level yet.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Projects */}
        <TabsContent value="projects" className="mt-4 sm:mt-6">
          <div className="grid gap-3 sm:gap-4">
            {resources.projects?.map((project, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4 gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4 sm:h-5 sm:w-5" />
                          <h3 className="text-base sm:text-lg font-semibold">{project.title}</h3>
                        </div>
                        <Badge className={`${getDifficultyColor(project.difficulty)} text-xs self-start sm:self-center`}>
                          {project.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm sm:text-base text-muted-foreground mb-3">{project.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs sm:text-sm mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {project.duration}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-2">Key Features:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {project.features.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    <Button className="ml-4">
                      <Code className="h-4 w-4 mr-2" />
                      Start Project
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {project.skills.map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )) || (
              <div className="text-center py-8 text-muted-foreground">
                No projects available for this level yet.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Books */}
        <TabsContent value="books" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {resources.books?.map((book, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-12 sm:w-12 sm:h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold mb-1 truncate">{book.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">by {book.author}</p>
                      <p className="text-xs sm:text-sm mb-3 line-clamp-2">{book.description}</p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2">
                          {renderStars(book.rating)}
                          <span className="text-xs sm:text-sm">{book.rating}</span>
                        </div>
                        <div className={`text-xs sm:text-sm ${getPriceColor(book.price)}`}>
                          {book.price}
                        </div>
                      </div>
                      
                      <Button size="sm" className="mt-3 w-full text-xs sm:text-sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Book
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) || (
              <div className="text-center py-8 text-muted-foreground">
                No books available for this level yet.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Communities */}
        <TabsContent value="communities" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {resources.communities?.map((community, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5" />
                        <h3 className="font-semibold">{community.name}</h3>
                        <Badge variant="outline">{community.type}</Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{community.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        {community.members} members
                      </div>
                    </div>
                    <Button size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Join
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) || (
              <div className="text-center py-8 text-muted-foreground">
                No communities available for this level yet.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tools */}
        <TabsContent value="tools" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {resources.tools?.map((tool, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-5 w-5" />
                        <h3 className="font-semibold">{tool.name}</h3>
                        <Badge variant="outline">{tool.category}</Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{tool.description}</p>
                      <div className={`text-sm ${getPriceColor(tool.price)}`}>
                        {tool.price}
                      </div>
                    </div>
                    <Button size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Get Tool
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) || (
              <div className="text-center py-8 text-muted-foreground">
                No tools available for this level yet.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}