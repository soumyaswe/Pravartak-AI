'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, FileText, MessageCircle, Target, TrendingUp, User, Loader2, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { getDashboardStats } from '@/lib/data-helpers';
import { getAssessments } from '@/actions/interview';
import { calculateProfileProgress } from '@/actions/profile-progress';
import { getActivityCounts } from '@/actions/activity-counters';
import { getUserProfile } from '@/actions/user';
import { gsap } from 'gsap';

const DEFAULT_GLOW_COLOR = '132, 0, 255';
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_PARTICLE_COUNT = 12;

// Helper function to format time ago
function getTimeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInMs = now - past;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return past.toLocaleDateString();
}

// Helper function to get activity type label
function getActivityTypeLabel(type) {
  const labels = {
    RESUME_CREATED: 'Resume',
    RESUME_UPDATED: 'Resume',
    COVER_LETTER_CREATED: 'Cover Letter',
    MOCK_INTERVIEW_COMPLETED: 'Interview',
    ASSESSMENT_COMPLETED: 'Assessment'
  };
  return labels[type] || type;
}

// Helper function to get activity icon
function getActivityIcon(type) {
  if (type?.includes('RESUME')) return FileText;
  if (type?.includes('COVER_LETTER')) return FileText;
  if (type?.includes('INTERVIEW')) return MessageCircle;
  if (type?.includes('ASSESSMENT')) return TrendingUp;
  return CheckCircle;
}

// Helper function to create particle elements
const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement('div');
  el.className = 'particle';
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const GlobalSpotlight = ({ gridRef, spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS, glowColor = DEFAULT_GLOW_COLOR, enabled = true }) => {
  const spotlightRef = useRef(null);

  useEffect(() => {
    if (!enabled || !gridRef?.current) return;

    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight';
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        rgba(${glowColor}, 0.02) 40%,
        rgba(${glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = (e) => {
      if (!spotlightRef.current || !gridRef.current) return;

      const section = gridRef.current;
      const rect = section.getBoundingClientRect();
      const mouseInside = e.clientX >= rect.left && e.clientX <= rect.right && 
                         e.clientY >= rect.top && e.clientY <= rect.bottom;

      const cards = gridRef.current.querySelectorAll('.bento-card');

      if (!mouseInside) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3, ease: 'power2.out' });
        cards.forEach(card => card.style.setProperty('--glow-intensity', '0'));
        return;
      }

      gsap.to(spotlightRef.current, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.1,
        ease: 'power2.out'
      });

      let minDistance = Infinity;
      cards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        
        minDistance = Math.min(minDistance, distance);
        
        const proximity = spotlightRadius * 0.5;
        const fadeDistance = spotlightRadius * 0.75;
        
        let glowIntensity = 0;
        if (distance <= proximity) {
          glowIntensity = 1;
        } else if (distance <= fadeDistance) {
          glowIntensity = (fadeDistance - distance) / (fadeDistance - proximity);
        }

        const relativeX = ((e.clientX - cardRect.left) / cardRect.width) * 100;
        const relativeY = ((e.clientY - cardRect.top) / cardRect.height) * 100;

        card.style.setProperty('--glow-x', `${relativeX}%`);
        card.style.setProperty('--glow-y', `${relativeY}%`);
        card.style.setProperty('--glow-intensity', glowIntensity.toString());
      });

      const targetOpacity = minDistance <= spotlightRadius * 0.5 ? 0.8 : 0;
      gsap.to(spotlightRef.current, { opacity: targetOpacity, duration: 0.2, ease: 'power2.out' });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [gridRef, spotlightRadius, glowColor, enabled]);

  return null;
};

// ParticleCard component for star effects
const ParticleCard = ({
  children,
  className = '',
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true,
  clickEffect = false,
  enableMagnetism = false,
  cardRef
}) => {
  const localCardRef = useRef(null);
  const particlesRef = useRef([]);
  const timeoutsRef = useRef([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef(null);

  const effectiveCardRef = cardRef || localCardRef;

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !effectiveCardRef.current) return;

    const { width, height } = effectiveCardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor)
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor, effectiveCardRef]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();

    particlesRef.current.forEach(particle => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        }
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!effectiveCardRef.current || !isHoveredRef.current) return;

    if (!particlesInitialized.current) {
      initializeParticles();
    }

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !effectiveCardRef.current) return;

        const clone = particle.cloneNode(true);
        effectiveCardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(
          clone,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
        );

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true
        });

        gsap.to(clone, {
          opacity: 0.3,
          duration: 1.5,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true
        });
      }, index * 100);

      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles, effectiveCardRef]);

  useEffect(() => {
    if (!effectiveCardRef.current) return;

    const element = effectiveCardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 5,
          rotateY: 5,
          duration: 0.3,
          ease: 'power2.out',
          transformPerspective: 1000
        });
      }
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }

      if (enableMagnetism) {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    const handleMouseMove = e => {
      if (!enableTilt && !enableMagnetism) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        gsap.to(element, {
          rotateX,
          rotateY,
          duration: 0.1,
          ease: 'power2.out',
          transformPerspective: 1000
        });
      }

      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.05;
        const magnetY = (y - centerY) * 0.05;

        magnetismAnimationRef.current = gsap.to(element, {
          x: magnetX,
          y: magnetY,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    const handleClick = e => {
      if (!clickEffect) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 1000;
      `;

      element.appendChild(ripple);

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          onComplete: () => ripple.remove()
        }
      );
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('click', handleClick);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('click', handleClick);
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles, enableTilt, enableMagnetism, clickEffect, glowColor, effectiveCardRef]);

  return (
    <div ref={effectiveCardRef} className={className} style={style}>
      {children}
    </div>
  );
};

export default function MagicStatsBento({
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  enableTilt = true,
  enableMagnetism = true,
  clickEffect = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR
}) {
  const { user } = useAuth();
  const gridRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState(null);
  const [activityCounts, setActivityCounts] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const getLatestAssessment = () => {
    if (!assessments?.length) return null;
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
        const [dashboardStatsResult, assessmentsData, profileProgress, counts, profile] = await Promise.all([
          getDashboardStats(user.uid),
          getAssessments(),
          calculateProfileProgress(),
          getActivityCounts(),
          getUserProfile().catch(() => null)
        ]);
        
        // Update state with fetched data
        setStats(dashboardStatsResult.stats);
        setAssessments(assessmentsData || []);
        setProfileCompletion(profileProgress);
        setActivityCounts(counts);
        setUserProfile(profile);
        setRecentActivities(dashboardStatsResult.stats?.recentActivity || []);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        setStats({ profileCompletion: 0, documentsCreated: 0, interviewSessions: 0 });
        setAssessments([]);
        setProfileCompletion({ completionPercentage: 0 });
        setActivityCounts({ documentsCreated: 0, interviewSessions: 0 });
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const latestAssessment = getLatestAssessment();
  const latestScore = latestAssessment?.quizScore;
  const completionPercentage = profileCompletion?.completionPercentage || 0;

  const userName = user?.displayName || user?.email?.split('@')[0] || "User";
  
  // Get industry directly from userProfile.industry (from User table in database)
  const userIndustry = userProfile?.industry || "technology";
  
  // Format industry for display (convert "tech-software-development" to "Technology")
  const formatIndustry = (industry) => {
    if (!industry) return "Technology";
    
    // Handle different industry formats
    const industryMap = {
      'tech': 'Technology',
      'technology': 'Technology',
      'healthcare': 'Healthcare',
      'finance': 'Finance',
      'education': 'Education',
      'retail': 'Retail',
      'manufacturing': 'Manufacturing',
      'entertainment': 'Entertainment',
      'real-estate': 'Real Estate',
      'realestate': 'Real Estate',
      'hospitality': 'Hospitality',
      'transportation': 'Transportation',
      'energy': 'Energy',
      'agriculture': 'Agriculture',
      'construction': 'Construction',
      'telecommunications': 'Telecommunications'
    };
    
    // Get the first part before hyphen (e.g., "tech-software-development" -> "tech")
    const mainIndustry = industry.toLowerCase().split('-')[0];
    
    // Return mapped value or capitalize first letter
    return industryMap[mainIndustry] || 
           mainIndustry.charAt(0).toUpperCase() + mainIndustry.slice(1);
  };
  
  const industryDisplay = formatIndustry(userIndustry);
  
  // Career goal - placeholder until added to schema
  const userCareerGoal = "Career Success";
  
  const userData = {
    industry: industryDisplay,
    careerGoal: userCareerGoal
  };

  const cardsData = [
    {
      title: 'Profile',
      value: `${completionPercentage}%`,
      description: 'Profile Completion',
      label: 'Status',
      icon: CheckCircle,
      color: completionPercentage >= 80 ? '#10b981' : completionPercentage >= 50 ? '#f59e0b' : '#ef4444'
    },
    {
      title: 'Documents',
      value: activityCounts?.documentsCreated || 0,
      description: 'Resumes & Cover Letters',
      label: 'Created',
      icon: FileText,
      color: '#3b82f6'
    },
    {
      title: `Welcome, ${userName}`,
      value: '👋',
      description: `Your career journey in ${userData.industry}`,
      label: 'Dashboard',
      icon: User,
      color: '#8b5cf6',
      isWelcome: true
    },

    {
      title: 'Recent Activity',
      value: recentActivities.length,
      description: 'Latest actions',
      label: 'Activity',
      icon: Clock,
      color: '#06b6d4',
      isActivity: true,
      activities: recentActivities.slice(0, 3) // Show top 3 activities
    },
    {
      title: 'Latest Score',
      value: latestScore != null ? `${latestScore.toFixed(1)}%` : 'N/A',
      description: 'Practice Quiz Score',
      label: 'Performance',
      icon: Target,
      color: latestScore >= 70 ? '#10b981' : latestScore >= 50 ? '#f59e0b' : '#f97316'
    },
    
    {
      title: 'Interviews',
      value: activityCounts?.interviewSessions || 0,
      description: 'Practice Sessions',
      label: 'Completed',
      icon: MessageCircle,
      color: '#8b5cf6'
    }

  ];

  return (
    <>
      <style>
        {`
          .bento-stats-grid {
            --glow-x: 50%;
            --glow-y: 50%;
            --glow-intensity: 0;
            --glow-color: ${glowColor};
          }
          
          .bento-card {
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
          }
          
          .bento-card::after {
            content: '';
            position: absolute;
            inset: 0;
            padding: 2px;
            background: radial-gradient(300px circle at var(--glow-x) var(--glow-y),
                rgba(${glowColor}, calc(var(--glow-intensity) * 0.8)) 0%,
                rgba(${glowColor}, calc(var(--glow-intensity) * 0.4)) 30%,
                transparent 60%);
            border-radius: inherit;
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: subtract;
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            pointer-events: none;
            z-index: 1;
          }
          
          .bento-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(${glowColor}, 0.3);
          }
          
          .particle::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: rgba(${glowColor}, 0.2);
            border-radius: 50%;
            z-index: -1;
          }
          
          @media (max-width: 768px) {
            .bento-stats-grid {
              grid-template-columns: 1fr !important;
            }
            .bento-card:nth-child(3),
            .bento-card:nth-child(4) {
              grid-column: auto !important;
              grid-row: auto !important;
            }
          }
        `}
      </style>
      {enableSpotlight && (
        <GlobalSpotlight 
          gridRef={gridRef} 
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
          enabled={enableSpotlight}
        />
      )}
      <div 
        ref={gridRef}
        className="bento-stats-grid grid gap-4 max-w-6xl mx-auto mb-6"
        style={{
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridAutoRows: 'minmax(160px, auto)'
        }}
      >
        {cardsData.map((card, index) => {
          const Icon = card.icon;
          const isLarge = index === 2 || index === 3; // Make cards 3 and 4 larger
          
          const cardContent = card.isWelcome ? (
            <>
              <div className="flex justify-between items-start mb-auto">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {card.label}
                </span>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{card.value}</span>
                  <h3 className="text-xl font-bold text-foreground">
                    {card.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </>
          ) : card.isActivity ? (
            <>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {card.label}
                </span>
                <Icon className="h-5 w-5" style={{ color: card.color }} />
              </div>
              
              <div className="flex-1 flex flex-col">
                <h3 className="text-base font-semibold text-foreground mb-3">
                  {card.title}
                </h3>
                
                {card.activities && card.activities.length > 0 ? (
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {card.activities.map((activity, idx) => {
                      const ActivityIcon = getActivityIcon(activity.activityType);
                      return (
                        <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <ActivityIcon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: card.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {getActivityTypeLabel(activity.activityType)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getTimeAgo(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No recent activity
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-start mb-auto">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {card.label}
                </span>
                <Icon className="h-5 w-5" style={{ color: card.color }} />
              </div>
              
              <div className="mt-4">
                <div className="text-3xl font-bold mb-1" style={{ color: card.color }}>
                  {card.value}
                </div>
                <h3 className={`text-base font-semibold text-foreground mb-1 ${textAutoHide ? 'line-clamp-1' : ''}`}>
                  {card.title}
                </h3>
                <p className={`text-sm text-muted-foreground ${textAutoHide ? 'line-clamp-2' : ''}`}>
                  {card.description}
                </p>
              </div>
            </>
          );

          const cardStyle = {
            gridColumn: isLarge ? 'span 2' : 'span 1',
            gridRow: isLarge ? 'span 2' : 'span 1',
            '--glow-x': '50%',
            '--glow-y': '50%',
            '--glow-intensity': '0'
          };

          const cardClassName = "bento-card bg-card border border-border rounded-xl p-6 flex flex-col justify-between";

          if (enableStars) {
            return (
              <ParticleCard
                key={index}
                className={cardClassName}
                style={cardStyle}
                particleCount={particleCount}
                glowColor={glowColor}
                enableTilt={enableTilt}
                clickEffect={clickEffect}
                enableMagnetism={enableMagnetism}
              >
                {cardContent}
              </ParticleCard>
            );
          }
          
          return (
            <div
              key={index}
              className={cardClassName}
              style={cardStyle}
            >
              {cardContent}
            </div>
          );
        })}
      </div>
    </>
  );
}
