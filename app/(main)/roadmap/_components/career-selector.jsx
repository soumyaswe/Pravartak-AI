'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import {
  Code,
  Palette,
  TrendingUp,
  Users,
  Shield,
  Database,
  Brain,
  Megaphone,
  Calculator,
  Building,
  Search,
  Rocket,
  Loader2,
} from 'lucide-react';

const careerCategories = [
  {
    id: 'technology',
    name: 'Technology',
    icon: Code,
    careers: [
      {
        id: 'frontend-developer',
        title: 'Frontend Developer',
        description: 'Build user interfaces and web experiences',
        skills: ['HTML/CSS', 'JavaScript', 'React', 'TypeScript'],
        avgSalary: '₹8-25 LPA',
        demand: 'High',
        icon: Code,
      },
      {
        id: 'backend-developer',
        title: 'Backend Developer',
        description: 'Build server-side applications and APIs',
        skills: ['Node.js', 'Python', 'Databases', 'Cloud'],
        avgSalary: '₹10-30 LPA',
        demand: 'High',
        icon: Database,
      },
      {
        id: 'fullstack-developer',
        title: 'Full Stack Developer',
        description: 'End-to-end web application development',
        skills: ['Frontend', 'Backend', 'DevOps', 'Databases'],
        avgSalary: '₹12-35 LPA',
        demand: 'Very High',
        icon: Code,
      },
      {
        id: 'data-scientist',
        title: 'Data Scientist',
        description: 'Extract insights from data using ML and statistics',
        skills: ['Python', 'Machine Learning', 'Statistics', 'SQL'],
        avgSalary: '₹15-40 LPA',
        demand: 'Very High',
        icon: Brain,
      },
      {
        id: 'cybersecurity-specialist',
        title: 'Cybersecurity Specialist',
        description: 'Protect systems and data from cyber threats',
        skills: ['Network Security', 'Ethical Hacking', 'Risk Assessment'],
        avgSalary: '₹12-35 LPA',
        demand: 'High',
        icon: Shield,
      },
    ],
  },
  {
    id: 'design',
    name: 'Design & Creative',
    icon: Palette,
    careers: [
      {
        id: 'ui-ux-designer',
        title: 'UI/UX Designer',
        description: 'Design user-centered digital experiences',
        skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
        avgSalary: '₹6-20 LPA',
        demand: 'High',
        icon: Palette,
      },
      {
        id: 'product-designer',
        title: 'Product Designer',
        description: 'Design end-to-end product experiences',
        skills: ['Design Thinking', 'User Research', 'Strategy', 'Prototyping'],
        avgSalary: '₹10-25 LPA',
        demand: 'High',
        icon: Rocket,
      },
    ],
  },
  {
    id: 'business',
    name: 'Business & Management',
    icon: TrendingUp,
    careers: [
      {
        id: 'product-manager',
        title: 'Product Manager',
        description: 'Drive product strategy and execution',
        skills: ['Strategy', 'Analytics', 'Communication', 'Agile'],
        avgSalary: '₹15-50 LPA',
        demand: 'Very High',
        icon: TrendingUp,
      },
      {
        id: 'business-analyst',
        title: 'Business Analyst',
        description: 'Analyze business processes and requirements',
        skills: ['Analysis', 'Documentation', 'SQL', 'Process Mapping'],
        avgSalary: '₹8-25 LPA',
        demand: 'High',
        icon: Calculator,
      },
      {
        id: 'consultant',
        title: 'Management Consultant',
        description: 'Advise organizations on strategic decisions',
        skills: ['Strategy', 'Problem Solving', 'Communication', 'Analysis'],
        avgSalary: '₹12-40 LPA',
        demand: 'High',
        icon: Building,
      },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing & Sales',
    icon: Megaphone,
    careers: [
      {
        id: 'digital-marketer',
        title: 'Digital Marketing Specialist',
        description: 'Drive online marketing campaigns and growth',
        skills: ['SEO/SEM', 'Social Media', 'Analytics', 'Content Marketing'],
        avgSalary: '₹5-20 LPA',
        demand: 'High',
        icon: Megaphone,
      },
      {
        id: 'growth-hacker',
        title: 'Growth Hacker',
        description: 'Drive rapid business growth through experiments',
        skills: ['Analytics', 'A/B Testing', 'Product Marketing', 'Data'],
        avgSalary: '₹8-25 LPA',
        demand: 'High',
        icon: TrendingUp,
      },
    ],
  },
];

export default function CareerSelector({ onCareerSelect }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleCareerSelect = (career) => {
    // Simply pass the career to parent, API call happens there
    onCareerSelect(career);
  };

  const handleSearchSubmit = () => {
    if (searchTerm.trim()) {
      handleCareerSelect({
        id: searchTerm.trim().toLowerCase().replace(/\s+/g, '-'),
        title: searchTerm.trim(),
        description: `Explore career path for ${searchTerm.trim()}`,
        skills: [],
        avgSalary: 'Varies',
        demand: 'High',
        icon: Search,
        isCustomSearch: true
      });
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  // Popular career roles for quick access
  const popularRoles = [
    'Frontend', 'Backend', 'Full Stack', 'DevOps', 'Data Analyst', 'AI Engineer',
    'AI and Data Scientist', 'Data Engineer', 'Android', 'Machine Learning',
    'PostgreSQL', 'iOS', 'Blockchain', 'QA', 'Software Architect',
    'Cyber Security', 'UX Design', 'Technical Writer', 'Game Developer',
    'Server Side Game Developer', 'MLOps', 'Product Manager', 'Engineering Manager',
    'Developer Relations', 'BI Analyst'
  ];

  // Other career paths outside technology
  const otherCareers = [
    'Doctor', 'Nurse', 'Pharmacist', 'Physiotherapist', 'Veterinarian',
    'Lawyer', 'Chartered Accountant', 'Investment Banker', 'Financial Analyst', 'Civil Engineer',
    'Mechanical Engineer', 'Architect', 'Interior Designer', 'Fashion Designer', 'Graphic Designer',
    'Content Writer', 'Journalist', 'Teacher', 'Professor', 'HR Manager',
    'Marketing Manager', 'Sales Manager', 'Real Estate Agent', 'Chef', 'Photographer',
    'Film Director', 'Actor', 'Musician', 'Psychologist', 'Social Worker'
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Search */}
      <div className="max-w-4xl mx-auto px-4 relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search for any career, skill, technology and press Enter"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className="pl-12 py-3 text-sm sm:text-base rounded-full h-16"
            />
          </div>
        </div>
        
      </div>

      {/* Popular Role Cards Grid */}
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-xl text-center text-gray-400 py-6 mb-4 " > Popular Roles </h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {popularRoles.map((role) => (
            <Card 
              key={role}
              className="hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50"
              onClick={() => handleCareerSelect({ 
                id: role.toLowerCase().replace(/\s+/g, '-'),
                title: role,
                description: `Explore career path for ${role}`,
                skills: [],
                avgSalary: 'Varies',
                demand: 'High',
                icon: Rocket,
                isCustomSearch: true
              })}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center min-h-[100px]">
                <Rocket className="h-8 w-8 text-purple-400 mb-2 group-hover:text-purple-300 transition-colors" />
                <p className="font-medium text-sm text-white group-hover:text-purple-300 transition-colors leading-tight">
                  {role}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        

      </div>

      {/* Other Career Paths Grid */}
      <div className="max-w-6xl mx-auto px-4 mt-12">
        <h1 className="text-xl text-center text-gray-400 py-6 mb-4" > Other Career Paths </h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {otherCareers.map((career) => (
            <Card 
              key={career}
              className="hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50"
              onClick={() => handleCareerSelect({ 
                id: career.toLowerCase().replace(/\s+/g, '-'),
                title: career,
                description: `Explore career path for ${career}`,
                skills: [],
                avgSalary: 'Varies',
                demand: 'High',
                icon: Rocket,
                isCustomSearch: true
              })}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center min-h-[100px]">
                <Rocket className="h-8 w-8 text-blue-400 mb-2 group-hover:text-blue-300 transition-colors" />
                <p className="font-medium text-sm text-white group-hover:text-blue-300 transition-colors leading-tight">
                  {career}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}