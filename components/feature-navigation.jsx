"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  Menu,
  X,
  Briefcase,
  TrendingUp,
  MessageSquare,
  User,
  Microscope,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Resume Builder",
    href: "/resume",
    icon: FileText,
  },
  {
    name: "Cover Letter",
    href: "/ai-cover-letter",
    icon: MessageSquare,
  },
  {
    name: "CV Analyser",
    href: "/cv-analyser",
    icon: Briefcase,
  },
  {
    name: "Practice Questions",
    href: "/interview",
    icon: GraduationCap,
  },
  {
    name: "Mock Interviews",
    href: "/mock-interview",
    icon: Microscope,
  },
  {
    name: "Interview Simulator",
    href: "/interview-simulator",
    icon: GraduationCap,
  },
  {
    name: "Industry Insights",
    href: "/industry-insights",
    icon: TrendingUp,
  },
  {
    name: "Career Roadmap",
    href: "/roadmap",
    icon: BookOpen,
  },
  {
    name: "Progress Analytics",
    href: "/analytics",
    icon: TrendingUp,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
];

export default function FeatureNavigation({ showBackButton = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      {/* Fixed Navigation Bar with Hamburger and Back Button */}
      <div className="fixed top-20 left-0 right-0 h-14 bg-background/60 backdrop-blur-xl border-b border-border/20 z-40 flex items-center px-4 gap-3 supports-[backdrop-filter]:bg-background/40">
        {/* Hamburger Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Back Button */}
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        )}

        {/* Current Page Title */}
        <div className="flex-1 text-sm font-medium text-muted-foreground truncate">
          {navigationItems.find((item) => {
            const isMatch = pathname === item.href || 
              (pathname.startsWith(item.href) && 
               !navigationItems.some(navItem => 
                 navItem.href !== item.href && 
                 navItem.href.startsWith(item.href) && 
                 pathname.startsWith(navItem.href)
               ));
            return isMatch;
          })?.name || ""}
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 top-[136px]"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-[136px] bottom-0 w-64 bg-background border-r border-border/40 z-50 transition-transform duration-300 ease-in-out overflow-y-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4">
          {/* Close Button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-lg">Navigation</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (pathname.startsWith(item.href) && 
                 !navigationItems.some(navItem => 
                   navItem.href !== item.href && 
                   navItem.href.startsWith(item.href) && 
                   pathname.startsWith(navItem.href)
                 ));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={toggleSidebar}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
