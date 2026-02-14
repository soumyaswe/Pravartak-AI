"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Map, Info } from "lucide-react";
import RoadmapNode from "./roadmap-node";
import RoadmapModal from "./roadmap-modal";

/**
 * RoadmapFlowchart - Main component for displaying interactive career roadmap
 *
 * This component manages the state for:
 * - Selected node for modal display
 * - Modal open/close state
 *
 * It renders the recursive tree structure and handles node interactions
 */
export default function RoadmapFlowchart({ career }) {
  // State management for modal and selected node
  const [selectedNode, setSelectedNode] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if AI roadmap data exists
  const hasRoadmapData = career?.aiRoadmap?.roadmap;

  // Handle node click - open modal with node content
  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    // Delay clearing selected node to allow exit animation
    setTimeout(() => setSelectedNode(null), 200);
  };

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardContent className="p-0">
        {/* Loading State */}
        {!career && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" />
              <p className="text-muted-foreground">Loading roadmap...</p>
            </div>
          </div>
        )}

        {/* No Roadmap Data */}
        {career && !hasRoadmapData && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Roadmap data is being generated. This may take a moment...
            </AlertDescription>
          </Alert>
        )}

        {/* Roadmap Visualization */}
        {career && hasRoadmapData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-5">
              {/* Info Banner */}
              <div className="w-[900px] bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-lg text-purple-900 dark:text-purple-100 mb-1">
                      Interactive Roadmap Guide
                    </h3>
                    <p className="text-base text-purple-700 dark:text-purple-300">
                      Click on any node to learn more about that step. Each node
                      contains detailed information, resources, and guidance to
                      help you progress in your {career.title} journey.
                    </p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-3">Roadmap Legend</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded"></div>
                    <span className="text-muted-foreground text-base">
                      Foundation Level
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded"></div>
                    <span className="text-muted-foreground text-base">
                      Intermediate Skills
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-cyan-500 to-teal-500 rounded"></div>
                    <span className="text-muted-foreground text-base">
                      Advanced Concepts
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-teal-500 to-green-500 rounded"></div>
                    <span className="text-muted-foreground text-base">
                      Professional Mastery
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Roadmap Tree Visualization */}
            <div className="roadmap-container rounded-xl p-6 sm:p-8">
              {/* Center the roadmap */}
              <div className="flex justify-center w-full">
                <RoadmapNode
                  node={career.aiRoadmap.roadmap}
                  depth={0}
                  onNodeClick={handleNodeClick}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Modal Component - Rendered outside the card */}
      <RoadmapModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        node={selectedNode}
      />
    </Card>
  );
}
