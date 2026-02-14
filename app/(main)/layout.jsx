"use client";

import React from "react";
import ProtectedRoute from "@/components/protected-route";
import FeatureNavigation from "@/components/feature-navigation";
import { usePathname } from "next/navigation";

const MainLayout = ({ children }) => {
  const pathname = usePathname();
  
  // Don't show navigation on dashboard, onboarding, or interview-simulator (it has its own header)
  const showNavigation = !pathname.includes("/dashboard") && 
                         !pathname.includes("/onboarding") && 
                         !pathname.includes("/interview-simulator");

  return (
    <ProtectedRoute>
      {showNavigation && <FeatureNavigation />}
      <div className={
        showNavigation 
          ? "mt-[136px] px-3 sm:px-4 md:px-6 mb-12" 
          : pathname?.includes("/interview-simulator")
          ? "mt-20" // Add top margin for header, no container for full width
          : "container mx-auto mt-24 mb-20"
      }>
        {children}
      </div>
    </ProtectedRoute>
  );
};

export default MainLayout;
