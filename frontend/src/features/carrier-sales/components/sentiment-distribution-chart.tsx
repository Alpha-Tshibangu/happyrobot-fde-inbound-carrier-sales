'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { CallStats } from '@/lib/api-service';

interface SentimentDistributionChartProps {
  metrics: CallStats;
}

export function SentimentDistributionChart({ metrics }: SentimentDistributionChartProps) {
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const data = [
    {
      sentiment: 'Positive',
      count: metrics.sentiment_distribution.positive,
      fill: 'hsl(220, 70%, 50%)',
    },
    {
      sentiment: 'Neutral',
      count: metrics.sentiment_distribution.neutral,
      fill: 'hsl(220, 70%, 60%)',
    },
    {
      sentiment: 'Negative',
      count: metrics.sentiment_distribution.negative,
      fill: 'hsl(220, 70%, 70%)',
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / metrics.total_calls) * 100).toFixed(1);
      return (
        <div className="bg-background border rounded-lg p-2 shadow-sm">
          <p className="text-sm font-medium">{label} Sentiment</p>
          <p className="text-sm text-muted-foreground">
            {data.value} calls ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Analysis</CardTitle>
        <CardDescription>
          Carrier sentiment distribution across all calls
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              onMouseMove={(data) => {
                if (data && data.activeTooltipIndex !== undefined) {
                  setHoveredBarIndex(data.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => setHoveredBarIndex(null)}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="sentiment" className="text-sm" />
              <YAxis className="text-sm" />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={hoveredBarIndex === index
                      ? `hsl(220, 70%, ${40 + index * 5}%)`
                      : entry.fill
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {data.map((item) => (
            <div key={item.sentiment} className="text-center">
              <div className="text-2xl font-bold">{item.count}</div>
              <div className="text-sm text-muted-foreground">{item.sentiment}</div>
              <div className="text-xs text-muted-foreground">
                {((item.count / metrics.total_calls) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}