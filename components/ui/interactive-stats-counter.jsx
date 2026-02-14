"use client";

import React, { useState, useEffect, useRef } from 'react';

const InteractiveStatsCounter = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState({
    users: 0,
    resumes: 0,
    interviews: 0,
    success: 0
  });

  const statsRef = useRef(null);

  const finalStats = {
    users: 10000,
    resumes: 25000,
    interviews: 15000,
    success: 95
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setStats({
        users: Math.floor(finalStats.users * progress),
        resumes: Math.floor(finalStats.resumes * progress),
        interviews: Math.floor(finalStats.interviews * progress),
        success: Math.floor(finalStats.success * progress)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setStats(finalStats);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isVisible]);

  return (
    <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 max-w-2xl mx-auto">
      <div className="text-center p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/20 hover:border-primary/50 transition-colors">
        <div className="text-3xl md:text-4xl font-bold text-primary">
          {stats.users.toLocaleString()}+
        </div>
        <div className="text-sm text-muted-foreground mt-1">Active Users</div>
      </div>
      
      <div className="text-center p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/20 hover:border-primary/50 transition-colors">
        <div className="text-3xl md:text-4xl font-bold text-primary">
          {stats.resumes.toLocaleString()}+
        </div>
        <div className="text-sm text-muted-foreground mt-1">Resumes Created</div>
      </div>
      
      <div className="text-center p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/20 hover:border-primary/50 transition-colors">
        <div className="text-3xl md:text-4xl font-bold text-primary">
          {stats.interviews.toLocaleString()}+
        </div>
        <div className="text-sm text-muted-foreground mt-1">Mock Interviews</div>
      </div>
      
      <div className="text-center p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/20 hover:border-primary/50 transition-colors">
        <div className="text-3xl md:text-4xl font-bold text-primary">
          {stats.success}%
        </div>
        <div className="text-sm text-muted-foreground mt-1">Success Rate</div>
      </div>
    </div>
  );
};

export default InteractiveStatsCounter;