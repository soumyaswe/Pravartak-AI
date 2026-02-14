'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, TrendingUp, Loader2 } from 'lucide-react';
import CareerSelector from './_components/career-selector';
import RoadmapFlowchart from './_components/roadmap-flowchart';

export default function RoadmapPage() {
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingCareerTitle, setLoadingCareerTitle] = useState('');

  const handleCareerSelect = async (career) => {
    console.log('Career selected:', career.title);
    setIsGenerating(true);
    setLoadingCareerTitle(career.title);
    console.log('Loading state set to true');
    
    try {
      // Generate AI roadmap for the selected career
      const response = await fetch('/api/roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ career: career.title }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Check if we're using fallback content
        if (result.usingFallback) {
          console.warn('Using fallback roadmap:', result.message);
        }
        
        // Pass the career with AI-generated roadmap data
        const enhancedCareer = {
          ...career,
          aiRoadmap: result.data,
          usingFallback: result.usingFallback,
          fallbackMessage: result.message
        };
        setSelectedCareer(enhancedCareer);
      } else {
        console.error('Failed to generate roadmap:', result.error);
        // Still proceed with career selection but without AI roadmap
        setSelectedCareer(career);
      }
    } catch (error) {
      console.error('Error generating roadmap:', error);
      // Still proceed with career selection but without AI roadmap
      setSelectedCareer(career);
    } finally {
      console.log('Loading state set to false');
      setIsGenerating(false);
    }
  };

  // Loading Screen - Show while API request is in progress
  if (isGenerating) {
    return (
      <div className="container mx-auto py-6 sm:py-6 px-2 sm:px-2 lg:px-4 max-w-10xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="relative">
            <Loader2 className="h-16 w-16 text-purple-600 animate-spin" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-purple-600">
              Generating Roadmap
            </h2>
            <p className="text-muted-foreground">
              Creating your personalized {loadingCareerTitle} career path...
            </p>
          </div>
          <div className="flex gap-2">
            <div className="h-2 w-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="h-2 w-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="h-2 w-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Career Selection Screen - Show when no career is selected
  if (!selectedCareer) {
    return (
      <div className="container mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="font-bold gradient-title text-5xl md:text-6xl mb-3 sm:mb-4">
            Career Roadmap Generator
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Get a personalized career roadmap with skills, learning paths, and milestones 
            tailored to your chosen profession and experience level.
          </p>
        </div>

        <CareerSelector onCareerSelect={handleCareerSelect} />
      </div>
    );
  }

  return (
    <div className="w-full py-6 max-w-10xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            {selectedCareer.title} Roadmap
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Your personalized journey to becoming a {selectedCareer.title}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            setSelectedCareer(null);
            setIsGenerating(false);
          }}
          className="flex items-center gap-2 w-full sm:w-auto text-sm"
        >
          <TrendingUp className="h-4 w-4" />
          Change Career
        </Button>
      </div>

      {/* Main Content - Flowchart Only */}
      <RoadmapFlowchart 
        career={selectedCareer}
      />
    </div>
  );
}