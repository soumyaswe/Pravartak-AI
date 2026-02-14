"use client";

import React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Footer() {
  const pathname = usePathname();
  
  // Check if we're on a dashboard page
  const isDashboardPage = pathname?.startsWith('/dashboard') || 
                         pathname?.startsWith('/resume') || 
                         pathname?.startsWith('/ai-cover-letter') ||
                         pathname?.startsWith('/cv-analyser') ||
                         pathname?.startsWith('/interview') ||
                         pathname?.startsWith('/mock-interview') ||
                         pathname?.startsWith('/industry-insights') ||
                         pathname?.startsWith('/roadmap') ||
                         pathname?.startsWith('/analytics');
  
  // Get sidebar state from localStorage (synced across components)
  const [sidebarExpanded, setSidebarExpanded] = React.useState(true);
  
  React.useEffect(() => {
    // Read initial state from localStorage
    const stored = localStorage.getItem('sidebar-expanded');
    if (stored !== null) {
      setSidebarExpanded(stored === 'true');
    }
    
    // Listen for storage changes (when sidebar toggles in other components)
    const handleStorageChange = (e) => {
      if (e.key === 'sidebar-expanded') {
        setSidebarExpanded(e.newValue === 'true');
      }
    };
    
    // Custom event for same-tab updates
    const handleSidebarToggle = (e) => {
      setSidebarExpanded(e.detail.isExpanded);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  return (
    <footer className={cn(
      "border-t border-border/40 py-8 sm:py-10 md:py-12 px-4 sm:px-8 md:px-16 lg:px-32 bg-background transition-all duration-300",
      isDashboardPage ? (sidebarExpanded ? "md:ml-64" : "md:ml-20") : ""
    )}>
      <div className="container mx-auto flex flex-col md:flex-row items-start md:items-start justify-between gap-6 md:gap-4">
        <div className="flex flex-col items-start justify-start text-left space-y-3 sm:space-y-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-1">
            <Image
              src="/logo-tab.png"
              alt="Logo"
              height={30}
              width={30}
              className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8"
            />
            <Image
              src="/logo.png"
              alt="Pravartak"
              height={64}
              width={168}
              className="h-12 w-auto sm:h-14 md:h-16"
            />
          </div>

          {/* Tagline */}
          <p className="text-sm sm:text-base text-[#eac1f5]">
            A platform created with{" "}
            <span className="text-red-500">💗</span> by{" "}
            <span className="text-[#B74BD2] font-semibold">
              Quad Squad
            </span>
          </p>
        </div>
        
        {/* Quick Links */}
        <div className="flex flex-col items-start justify-start space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Quick Links</h3>
          <nav className="flex flex-col space-y-2">
            <a 
              href="/#features" 
              className="text-xs sm:text-sm text-muted-foreground hover:text-[#B74BD2] transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#B74BD2] hover:after:w-full after:transition-all after:duration-300"
            >
              Features
            </a>
            <a 
              href="/#how-it-works" 
              className="text-xs sm:text-sm text-muted-foreground hover:text-[#B74BD2] transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#B74BD2] hover:after:w-full after:transition-all after:duration-300"
            >
              How It Works
            </a>
            <a 
              href="/#faqs" 
              className="text-xs sm:text-sm text-muted-foreground hover:text-[#B74BD2] transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#B74BD2] hover:after:w-full after:transition-all after:duration-300"
            >
              FAQs
            </a>
          </nav>
        </div>

        {/* Contact Us */}
        <div className="flex flex-col items-start justify-start space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Contact Us</h3>
          <div className="flex flex-col space-y-2">
            <a 
              href="mailto:support@pravartak.com" 
              className="text-xs sm:text-sm text-muted-foreground hover:text-[#B74BD2] transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              pravartak.team@gmail.com
            </a>
            <a 
              href="tel:+911234567890" 
              className="text-xs sm:text-sm text-muted-foreground hover:text-[#B74BD2] transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              +91 70449 22097
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex items-center justify-center md:items-center md:justify-center">
          <p className="text-white text-center text-xs sm:text-sm">
            &copy; 2025 Pravartak
          </p>
        </div>
      </div>
    </footer>
  );
}
