'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Mail,
  Search,
  MessageCircle,
  Video,
  TrendingUp,
  Map,
  BarChart3,
  User,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSidebar } from './dashboard-layout';
import { useAuth } from '@/contexts/auth-context';

const dashboardNavigation = [
  {
    section: "Overview",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" }
    ]
  },
  {
    section: "Documents",
    items: [
      { name: "Resume Builder", icon: FileText, href: "/resume" },
      { name: "Cover Letter", icon: Mail, href: "/ai-cover-letter" },
      { name: "CV Analyzer", icon: Search, href: "/cv-analyser" }
    ]
  },
  {
    section: "Interview Prep",
    items: [
      { name: "Practice Questions", icon: MessageCircle, href: "/interview" },
      { name: "Mock Interviews", icon: Video, href: "/mock-interview" },
      { name: "Interview Simulator", icon: Video, href: "/interview-simulator" }
    ]
  },
  {
    section: "Career Growth",
    items: [
      { name: "Industry Insights", icon: TrendingUp, href: "/industry-insights" },
      { name: "Career Roadmap", icon: Map, href: "/roadmap" },
      { name: "Progress Analytics", icon: BarChart3, href: "/analytics" }
    ]
  }
];

export default function DashboardSidebar() {
  const { isExpanded, setIsExpanded, isMobileOpen, setIsMobileOpen } = useSidebar();
  const pathname = usePathname();
  const { user } = useAuth();

  const toggleExpanded = () => setIsExpanded(!isExpanded);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* Mobile hamburger button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden bg-card hover:bg-muted border border-border text-foreground"
        onClick={toggleMobile}
      >
        {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-50',
          // Desktop behavior
          'hidden md:flex flex-col',
          isExpanded ? 'w-64' : 'w-20',
          // Mobile behavior
          'md:translate-x-0',
          isMobileOpen ? 'flex w-64 translate-x-0' : 'md:flex -translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-end p-4 border-b border-border">
          {/* Desktop toggle button */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex text-muted-foreground hover:text-foreground"
            onClick={toggleExpanded}
          >
            {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6">
          {dashboardNavigation.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {/* Section Header */}
              <div className={cn(
                'px-3 mb-2 transition-opacity duration-300',
                !isExpanded && 'md:opacity-0 md:h-0 md:overflow-hidden'
              )}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.section}
                </h3>
              </div>
              
              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group relative',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span
                        className={cn(
                          'transition-opacity duration-300',
                          !isExpanded && 'md:opacity-0 md:w-0 md:overflow-hidden'
                        )}
                      >
                        {item.name}
                      </span>

                      {/* Tooltip for collapsed state */}
                      {!isExpanded && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 hidden md:block border border-border">
                          {item.name}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section at bottom */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="User avatar" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-primary-foreground font-medium text-sm">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
            <div className={cn('transition-opacity duration-300', !isExpanded && 'md:opacity-0 md:w-0 md:overflow-hidden')}>
              <p className="text-foreground text-sm font-medium">
                {user?.displayName || 'User'}
              </p>
              <p className="text-muted-foreground text-xs">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}