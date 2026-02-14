'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import './roadmap-node.css';

/**
 * RoadmapNode - A recursive component for rendering tree-structured career roadmaps
 * 
 * This component renders itself and all its children recursively, creating a
 * flowchart-like visualization of the career path with roadmap.sh-style connecting lines.
 * 
 * @param {Object} node - The node data containing:
 *   - id: Unique identifier
 *   - label: Display title
 *   - contentFile: Markdown content describing this step
 *   - children: Array of child nodes
 * @param {number} depth - Current depth in the tree (for styling/indentation)
 * @param {Function} onNodeClick - Callback when a node is clicked (for content display)
 */
export default function RoadmapNode({ node, depth = 0, onNodeClick }) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (!node) return null;

  const hasChildren = node.children && node.children.length > 0;
  const isRootNode = depth === 0;

  // Color scheme based on depth for visual hierarchy
  const getDepthColor = (depth) => {
    const colors = [
      'bg-gradient-to-r from-purple-500 to-blue-500', // Root
      'bg-gradient-to-r from-blue-500 to-cyan-500',   // Level 1
      'bg-gradient-to-r from-cyan-500 to-teal-500',   // Level 2
      'bg-gradient-to-r from-teal-500 to-green-500',  // Level 3
      'bg-gradient-to-r from-green-500 to-lime-500',  // Level 4
      'bg-gradient-to-r from-lime-500 to-yellow-500', // Level 5+
    ];
    return colors[Math.min(depth, colors.length - 1)];
  };

  const handleNodeClick = (e) => {
    e.stopPropagation();
    if (onNodeClick) {
      onNodeClick(node);
    }
  };

  const toggleExpanded = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`node-container ${isRootNode ? 'root-node' : ''}`}>
      {/* Current Node Label */}
      <div className={`node-label-wrapper ${hasChildren && isExpanded ? 'has-children' : ''}`}>
        <Card
          className={`
            node-label
            relative
            cursor-pointer
            transition-all
            duration-300
            hover:shadow-xl
            hover:scale-105
            ${isRootNode ? 'w-48 sm:w-56' : 'w-40 sm:w-48'}
            ${depth === 0 ? 'border-2 border-purple-300' : ''}
          `}
          onClick={handleNodeClick}
        >
          {/* Node Header with Gradient */}
          <div className={`${getDepthColor(depth)} text-white p-2 sm:p-3 rounded-t-lg`}>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 flex-1">
                <h3 className="font-bold text-xs sm:text-sm leading-tight">
                  {node.label}
                </h3>
              </div>
              {hasChildren && (
                <button
                  onClick={toggleExpanded}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Node Body */}
          <div className="p-2 sm:p-3 bg-white dark:bg-gray-800">
                       
            {/* Preview of content */}
            {node.contentFile && (
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                {node.contentFile.split('\n\n')[0].substring(0, 50)}...
              </p>
            )}
          </div>

          {/* Children Count Badge
          {hasChildren && (
            <div className="absolute -bottom-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg">
              {node.children.length}
            </div>
          )} */}
        </Card>
      </div>

      {/* Children Nodes (Recursive Rendering with CSS-powered lines) */}
      {hasChildren && isExpanded && (
        <div className={`children-container ${node.children.length === 1 ? 'single-child' : 'multiple-children'}`}>
          {node.children.map((child, index) => (
            <div key={child.id || index} className="child-wrapper">
              {/* Recursive call - THE MAGIC HAPPENS HERE */}
              <RoadmapNode
                node={child}
                depth={depth + 1}
                onNodeClick={onNodeClick}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
