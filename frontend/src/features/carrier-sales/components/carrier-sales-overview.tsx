'use client';

import { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CallOutcomesChart } from './call-outcomes-chart';
import { SentimentDistributionChart } from './sentiment-distribution-chart';
import { NegotiationMetricsChart } from './negotiation-metrics-chart';
import { RecentCallsTable } from './recent-calls-table';
import { TopCarriersChart } from './top-carriers-chart';
import { AIAssistantInlinePanel } from './ai-assistant-inline-panel';
import { HappyRobotFullLogo } from '@/components/icons/HappyRobotFullLogo';
import LoadManagementOverview from '@/features/load-management/components/load-management-overview';
import {
  IconPhone,
  IconTrendingUp,
  IconTrendingDown,
  IconHandOff,
  IconMoodSmile,
  IconClock,
  IconSparkles,
} from '@tabler/icons-react';
import { apiService, type CallStats, type DashboardSummary } from '@/lib/api-service';
import { DashboardSkeleton } from '@/components/ui/loading-spinner';

export default function CarrierSalesOverview() {
  const [metrics, setMetrics] = useState<CallStats | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('load-management');
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(true);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [metricsData, summaryData] = await Promise.all([
          apiService.getDashboardMetrics(),
          apiService.getDashboardSummary(),
        ]);
        setMetrics(metricsData);
        setSummary(summaryData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <DashboardSkeleton />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-destructive">Error: {error}</div>
        </div>
      </PageContainer>
    );
  }

  if (!metrics || !summary) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">No data available</div>
        </div>
      </PageContainer>
    );
  }

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  return (
    <div className="flex h-screen">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col transition-all duration-500 ease-in-out">
        <div className="sticky top-0 z-10 bg-background px-4 py-4 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HappyRobotFullLogo className="h-6" />
              <span className="text-muted-foreground text-xl font-light">|</span>
              <h2 className="text-xl font-medium tracking-tight">
                Freight Operations Dashboard
              </h2>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="load-management">Load Management</TabsTrigger>
                  <TabsTrigger value="overview">Call Analytics</TabsTrigger>
                  <TabsTrigger value="recent-calls">Recent Calls</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
                className="ml-2 h-9 w-9 rounded-full"
              >
                <IconSparkles className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-4 md:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsContent value="load-management" className="h-full flex flex-col overflow-hidden">
            <LoadManagementOverview />
          </TabsContent>

          <TabsContent value="overview" className="space-y-4 flex-1 overflow-auto h-full">
            {/* Key Metrics Cards */}
            <div
              className="relative rounded-lg overflow-hidden bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: 'url(https://img.freepik.com/premium-photo/dark-blue-orange-white-grainy-gradient-background-abstract-colors-noise-texture-backdrop-wide-banner-poster-header-cover-design_284753-2738.jpg)' }}
            >
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-4 relative z-10">
                <Card className="@container/card bg-transparent border-none text-white shadow-none group hover:bg-white/5 transition-colors cursor-pointer relative">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-1 text-white/90">
                      <IconPhone className="size-4" />
                      Total Calls
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
                      {formatNumber(metrics.total_calls)}
                    </CardTitle>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        <IconTrendingUp className="size-3" />
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium text-white">
                      Booked: {formatNumber(metrics.booked_calls)}
                    </div>
                    <div className="text-white/70">
                      Total inbound carrier calls received
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card bg-transparent border-none text-white shadow-none group hover:bg-white/5 transition-colors cursor-pointer relative">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-1 text-white/90">
                      <IconHandOff className="size-4" />
                      Conversion Rate
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
                      {formatPercentage(metrics.conversion_rate)}
                    </CardTitle>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant={metrics.conversion_rate > 20 ? 'default' : 'secondary'} className="bg-white/20 text-white border-white/30">
                        {metrics.conversion_rate > 20 ? (
                          <IconTrendingUp className="size-3" />
                        ) : (
                          <IconTrendingDown className="size-3" />
                        )}
                        {metrics.conversion_rate > 20 ? 'Good' : 'Below Target'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium text-white">
                      Booked: {formatNumber(metrics.booked_calls)} calls
                    </div>
                    <div className="text-white/70">
                      Percentage of calls resulting in bookings
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card bg-transparent border-none text-white shadow-none group hover:bg-white/5 transition-colors cursor-pointer relative">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-1 text-white/90">
                      <IconClock className="size-4" />
                      Avg Negotiation Rounds
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
                      {metrics.average_negotiation_rounds}
                    </CardTitle>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {formatPercentage(metrics.average_discount_percentage)} discount
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium text-white">
                      Failed: {formatNumber(metrics.failed_negotiations)}
                    </div>
                    <div className="text-white/70">
                      Average rounds before agreement
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card bg-transparent border-none text-white shadow-none group hover:bg-white/5 transition-colors cursor-pointer relative">
                  <CardHeader>
                    <CardDescription className="flex items-center gap-1 text-white/90">
                      <IconMoodSmile className="size-4" />
                      Positive Sentiment
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
                      {formatPercentage(
                        metrics.total_calls > 0
                          ? (metrics.sentiment_distribution.positive / metrics.total_calls) * 100
                          : 0
                      )}
                    </CardTitle>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {formatNumber(metrics.sentiment_distribution.positive)} calls
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium text-white">
                      Negative: {formatNumber(metrics.sentiment_distribution.negative)}
                    </div>
                    <div className="text-white/70">
                      Carrier satisfaction with interactions
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <CallOutcomesChart metrics={metrics} />
              <SentimentDistributionChart metrics={metrics} />
            </div>

            {/* Charts Row 2 - Performance Analytics */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <NegotiationMetricsChart metrics={metrics} />
              <TopCarriersChart carriers={summary.top_carriers} />
            </div>

          </TabsContent>

          <TabsContent value="recent-calls" className="space-y-4 overflow-auto h-full">
            <RecentCallsTable calls={summary.recent_calls} />
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* AI Assistant Panel - Full Height */}
      <AIAssistantInlinePanel
        isOpen={isAIAssistantOpen}
        metrics={metrics}
      />

      {/* Floating AI Assistant Button for Mobile */}
      <Button
        variant="default"
        size="icon"
        onClick={() => setIsAIAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg md:hidden"
      >
        <IconSparkles className="size-5" />
      </Button>
    </div>
  );
}