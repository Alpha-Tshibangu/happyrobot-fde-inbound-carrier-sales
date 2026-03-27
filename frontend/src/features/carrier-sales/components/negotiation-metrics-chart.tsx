'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconCheck, IconAlertTriangle } from '@tabler/icons-react';
import type { CallStats } from '@/lib/api-service';

interface NegotiationMetricsChartProps {
  metrics: CallStats;
}

export function NegotiationMetricsChart({ metrics }: NegotiationMetricsChartProps) {
  const negotiationSuccessRate = metrics.total_calls > 0
    ? ((metrics.booked_calls / (metrics.booked_calls + metrics.failed_negotiations)) * 100)
    : 0;

  const avgDiscountBadge = metrics.average_discount_percentage > 10
    ? 'destructive'
    : metrics.average_discount_percentage > 5
    ? 'secondary'
    : 'default';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Negotiation Performance</CardTitle>
        <CardDescription>
          Analysis of price negotiation effectiveness
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Success Rate
            </div>
            <div className="text-2xl font-bold">
              {negotiationSuccessRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {metrics.booked_calls} booked / {metrics.booked_calls + metrics.failed_negotiations} negotiated
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Avg Rounds
            </div>
            <div className="text-2xl font-bold">
              {metrics.average_negotiation_rounds}
            </div>
            <div className="text-xs text-muted-foreground">
              Rounds before agreement
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Average Discount</span>
            <Badge variant={avgDiscountBadge}>
              {metrics.average_discount_percentage.toFixed(1)}%
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Booked Calls</span>
              <span className="font-medium">{metrics.booked_calls}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Failed Negotiations</span>
              <span className="font-medium">{metrics.failed_negotiations}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rejected Outright</span>
              <span className="font-medium">{metrics.rejected_calls}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ineligible Carriers</span>
              <span className="font-medium">{metrics.ineligible_carriers}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground mb-2">Performance Insights</div>
          <div className="space-y-1 text-xs">
            {negotiationSuccessRate > 70 && (
              <div className="flex items-center gap-2 text-green-600">
                <IconCheck className="h-3 w-3" />
                <span>High negotiation success rate</span>
              </div>
            )}
            {metrics.average_negotiation_rounds < 2 && (
              <div className="flex items-center gap-2 text-green-600">
                <IconCheck className="h-3 w-3" />
                <span>Quick resolution time</span>
              </div>
            )}
            {metrics.average_discount_percentage < 5 && (
              <div className="flex items-center gap-2 text-green-600">
                <IconCheck className="h-3 w-3" />
                <span>Low discount impact</span>
              </div>
            )}
            {negotiationSuccessRate < 50 && (
              <div className="flex items-center gap-2 text-amber-600">
                <IconAlertTriangle className="h-3 w-3" />
                <span>Consider negotiation strategy review</span>
              </div>
            )}
            {metrics.average_discount_percentage > 10 && (
              <div className="flex items-center gap-2 text-amber-600">
                <IconAlertTriangle className="h-3 w-3" />
                <span>High discount rates detected</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}