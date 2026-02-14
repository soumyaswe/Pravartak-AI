'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateProfileProgress } from '@/actions/profile-progress';

export default function ProfileProgressDetail() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    async function fetchProgress() {
      try {
        const data = await calculateProfileProgress();
        setProgress(data);
      } catch (error) {
        console.error('Failed to fetch profile progress:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, []);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Profile Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return null;
  }

  const getColorClass = (percentage) => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Profile Completion</span>
          <span className={`text-2xl font-bold ${getColorClass(progress.completionPercentage)}`}>
            {progress.completionPercentage}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Progress value={progress.completionPercentage} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {progress.completedCount} of {progress.totalCount} items completed
          </p>
        </div>

        {/* Categories breakdown */}
        <div className="space-y-3">
          {Object.entries(progress.itemsByCategory).map(([category, items]) => {
            const isExpanded = expandedCategories[category];
            const categoryTotal = items.completed.length + items.missing.length;
            const categoryCompleted = items.completed.length;
            const categoryPercentage = Math.round((categoryCompleted / categoryTotal) * 100);

            return (
              <div key={category} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{category}</span>
                    <Badge variant={categoryPercentage === 100 ? 'default' : 'secondary'}>
                      {categoryCompleted}/{categoryTotal}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 space-y-2">
                    {/* Completed items */}
                    {items.completed.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{item.label}</span>
                      </div>
                    ))}

                    {/* Missing items */}
                    {items.missing.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>{item.label}</span>
                        <Badge
                          variant="outline"
                          className="ml-auto text-xs"
                        >
                          {item.weight >= 10 ? 'High' : item.weight >= 5 ? 'Medium' : 'Low'} Priority
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick tips */}
        {progress.missingItems.length > 0 && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm font-medium text-blue-400 mb-2">
              💡 Quick Tips to Improve Your Profile:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {progress.missingItems
                .sort((a, b) => b.weight - a.weight)
                .slice(0, 3)
                .map((item) => (
                  <li key={item.key}>• Add your {item.label.toLowerCase()}</li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
