'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  IconBulb,
  IconTrendingUp,
  IconAlertTriangle,
  IconSparkles,
  IconRefresh,
  IconChevronRight,
} from '@tabler/icons-react';
import { aiInsightsService, type AIInsight } from '@/lib/ai-insights-service';
import type { CallStats, DashboardSummary } from '@/lib/api-service';

interface AIInsightsPanelProps {
  metrics: CallStats;
  summary: DashboardSummary;
  preloadedInsights?: AIInsight[];
  insightsLoading?: boolean;
  onRefreshInsights?: () => void;
}

export function AIInsightsPanel({
  metrics,
  summary,
  preloadedInsights = [],
  insightsLoading = false,
  onRefreshInsights
}: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<AIInsight[]>(preloadedInsights);
  const [loading, setLoading] = useState(insightsLoading);
  const [refreshing, setRefreshing] = useState(false);

  // Update insights when preloaded ones change
  useEffect(() => {
    setInsights(preloadedInsights);
    setLoading(insightsLoading);
    if (!insightsLoading) {
      setRefreshing(false);
    }
  }, [preloadedInsights, insightsLoading]);

  const fetchInsights = async () => {
    try {
      setLoading(true);

      // Fetch all types of insights in parallel
      const [daily, anomalies, predictions, recommendations] = await Promise.all([
        aiInsightsService.generateDailyInsights(metrics, summary),
        aiInsightsService.detectAnomalies(metrics, summary),
        aiInsightsService.generatePredictions(metrics, summary),
        aiInsightsService.generateRecommendations(metrics, summary),
      ]);

      // Combine and sort by priority
      const allInsights = [...daily, ...anomalies, ...predictions, ...recommendations]
        .sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
        .slice(0, 10); // Show top 10 insights

      setInsights(allInsights);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Only fetch insights if no preloaded insights are provided
  useEffect(() => {
    if (!preloadedInsights.length && !insightsLoading) {
      fetchInsights();
    }
  }, [metrics, summary, preloadedInsights.length, insightsLoading]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (onRefreshInsights) {
      onRefreshInsights();
    } else {
      fetchInsights();
    }
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'trend':
        return <IconTrendingUp className="h-4 w-4" />;
      case 'anomaly':
        return <IconAlertTriangle className="h-4 w-4" />;
      case 'prediction':
        return <IconSparkles className="h-4 w-4" />;
      case 'recommendation':
        return <IconBulb className="h-4 w-4" />;
      default:
        return <IconChevronRight className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: AIInsight['type']) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSparkles className="h-5 w-5" />
            AI Insights
          </CardTitle>
          <CardDescription>Loading intelligent analysis...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconSparkles className="h-5 w-5" />
              AI Insights
            </CardTitle>
            <CardDescription>Powered by machine learning analysis</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="ml-auto"
          >
            <IconRefresh className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {insights.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No insights available at this time
              </div>
            ) : (
              insights.map((insight) => (
                <div
                  key={insight.id}
                  className="group relative rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-muted-foreground">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-medium leading-none">
                          {insight.title}
                        </h4>
                        <div className="flex gap-1">
                          <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                            {insight.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(insight.type)}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                      {insight.metric && insight.value && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {insight.metric}:
                          </span>
                          <span className="text-xs font-medium">
                            {insight.value}
                          </span>
                        </div>
                      )}
                      {insight.actionable && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Take Action
                          <IconChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}