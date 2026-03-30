'use client';

import { useEffect, useState } from 'react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconTruck,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertTriangle,
  IconCurrencyDollar,
  IconCheck,
} from '@tabler/icons-react';
import { apiService, type LoadMetrics } from '@/lib/api-service';
import { DashboardSkeleton } from '@/components/ui/loading-spinner';
import { LoadManagementSplitView } from './load-management-split-view';

export default function LoadManagementOverview() {
  const [metrics, setMetrics] = useState<LoadMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const metricsData = await apiService.getLoadMetrics();
        setMetrics(metricsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!loading && metrics) {
      // Ensure the first painted state is applied before transitioning.
      requestAnimationFrame(() => setShowContent(true));
    } else {
      setShowContent(false);
    }
  }, [loading, metrics]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No load data available</div>
      </div>
    );
  }

  const formatNumber = (value: number) => value.toLocaleString();
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatCurrency = (value: number) => {
    if (value < 0) {
      return `-$${Math.abs(value).toLocaleString()}`;
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <div
      className={[
        'h-full flex flex-col min-h-0',
        'transition-all duration-300 ease-out',
        showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      ].join(' ')}
    >
      {/* Fixed Key Metrics Cards */}
      <div className="shrink-0 mb-6">
        <div
          className="relative rounded-lg overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              'url(https://img.freepik.com/premium-photo/dark-blue-orange-white-grainy-gradient-background-abstract-colors-noise-texture-backdrop-wide-banner-poster-header-cover-design_284753-2738.jpg)',
          }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-4 relative z-10">
            {/* Available Loads */}
            <Card className="@container/card bg-transparent border-none text-white shadow-none group hover:bg-white/5 transition-colors cursor-pointer relative">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardDescription className="flex items-center gap-1 text-white/90">
                      <IconTruck className="size-4" />
                      Available Loads
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
                      {formatNumber(metrics.available_loads)}
                    </CardTitle>
                  </div>
                  <div className="hidden @[250px]/card:flex pt-1 shrink-0 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge
                      variant={metrics.urgent_loads > 0 ? 'destructive' : 'secondary'}
                      className="bg-white/20 text-white border-white/30"
                    >
                      {metrics.urgent_loads > 0 ? (
                        <>
                          <IconAlertTriangle className="size-3" />
                          {metrics.urgent_loads} Urgent
                        </>
                      ) : (
                        <>
                          <IconCheck className="size-3" />
                          No Urgents
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 font-medium text-white">Urgent: {metrics.urgent_loads}</div>
                <div className="text-white/70">Loads needing carrier coverage</div>
              </CardFooter>
            </Card>

            {/* Booked Loads */}
            <Card className="@container/card bg-transparent border-none text-white shadow-none group hover:bg-white/5 transition-colors cursor-pointer relative">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardDescription className="flex items-center gap-1 text-white/90">
                      <IconCheck className="size-4" />
                      Booked Loads
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
                      {formatNumber(metrics.booked_loads)}
                    </CardTitle>
                  </div>
                  <div className="hidden @[250px]/card:flex pt-1 shrink-0 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="default" className="bg-white/20 text-white border-white/30">
                      <IconTrendingUp className="size-3" />
                      Covered
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 font-medium text-white">In Transit: {metrics.in_transit_loads}</div>
                <div className="text-white/70">Loads with assigned carriers</div>
              </CardFooter>
            </Card>

            {/* Coverage Rate */}
            <Card className="@container/card bg-transparent border-none text-white shadow-none group hover:bg-white/5 transition-colors cursor-pointer relative">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardDescription className="flex items-center gap-1 text-white/90">
                      <IconTrendingUp className="size-4" />
                      Coverage Rate
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
                      {formatPercentage(metrics.coverage_rate)}
                    </CardTitle>
                  </div>
                  <div className="hidden @[250px]/card:flex pt-1 shrink-0 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge
                      variant={metrics.coverage_rate > 80 ? 'default' : 'secondary'}
                      className="bg-white/20 text-white border-white/30"
                    >
                      {metrics.coverage_rate > 80 ? (
                        <IconTrendingUp className="size-3" />
                      ) : (
                        <IconTrendingDown className="size-3" />
                      )}
                      {metrics.coverage_rate > 80 ? 'Good' : 'Below Target'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 font-medium text-white">{metrics.coverage_rate > 80 ? 'Above Target' : 'Below Target'}</div>
                <div className="text-white/70">Percentage of loads with carriers</div>
              </CardFooter>
            </Card>

            {/* Average Margin */}
            <Card className="@container/card bg-transparent border-none text-white shadow-none group hover:bg-white/5 transition-colors cursor-pointer relative">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardDescription className="flex items-center gap-1 text-white/90">
                      <IconCurrencyDollar className="size-4" />
                      Average Margin
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-white">
                      {formatCurrency(metrics.average_margin)}
                    </CardTitle>
                  </div>
                  <div className="hidden @[250px]/card:flex pt-1 shrink-0 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {formatCurrency(metrics.total_margin)} Total
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 font-medium text-white">{formatCurrency(metrics.total_margin)} Total</div>
                <div className="text-white/70">Profit per booked load</div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {/* Scrollable Load Management Split View */}
      <div className="flex-1 min-h-0">
        <LoadManagementSplitView />
      </div>
    </div>
  );
}