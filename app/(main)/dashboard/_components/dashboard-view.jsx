"use client";

import PersonalizedHeader from "./personalized-header";
import MagicStatsBento from "./magic-stats-bento";
import ActivityAndRecommendations from "./activity-recommendations";

export default function DashboardView() {
  return (
    <div className="space-y-6">
      {/* Personalized Header with Progress */}
      {/* <PersonalizedHeader /> */}

      {/* Magic Bento Stats Cards */}
      <MagicStatsBento
        textAutoHide={true}
        enableStars={true}
        enableSpotlight={true}
        enableBorderGlow={true}
        enableTilt={true}
        enableMagnetism={true}
        clickEffect={true}
        spotlightRadius={300}
        particleCount={12}
        glowColor="132, 0, 255"
      />

      {/* Recent Activity & AI Recommendations */}
      {/* <ActivityAndRecommendations /> */}
    </div>
  );
}
