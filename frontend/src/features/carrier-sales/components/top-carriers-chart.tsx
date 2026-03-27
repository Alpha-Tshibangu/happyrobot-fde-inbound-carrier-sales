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

interface TopCarriersChartProps {
  carriers: Array<{
    name: string;
    call_count: number;
  }>;
}

export function TopCarriersChart({ carriers }: TopCarriersChartProps) {
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Sort carriers by call count in descending order and assign colors accordingly
  const sortedCarriers = [...carriers].sort((a, b) => b.call_count - a.call_count);

  // Use consistent blue shades with decreasing intensity for decreasing values
  const blueShades = [
    'hsl(220, 70%, 50%)', // Darkest blue for highest volume
    'hsl(220, 70%, 60%)', // Medium-dark blue
    'hsl(220, 70%, 70%)', // Medium blue
    'hsl(220, 70%, 80%)', // Light blue
    'hsl(220, 70%, 90%)', // Lighter blue
  ];

  const data = sortedCarriers.map((carrier, index) => ({
    name: carrier.name || `Carrier ${index + 1}`,
    calls: carrier.call_count,
    fill: blueShades[index % blueShades.length],
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border rounded-lg p-2 shadow-sm">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} calls
          </p>
        </div>
      );
    }
    return null;
  };

  if (!carriers.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Carriers by Volume</CardTitle>
          <CardDescription>
            Most active carriers by call frequency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No carrier data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Carriers by Volume</CardTitle>
        <CardDescription>
          Most active carriers by call frequency
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              onMouseMove={(data) => {
                if (data && data.activeTooltipIndex !== undefined) {
                  setHoveredBarIndex(data.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => setHoveredBarIndex(null)}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                className="text-sm"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis className="text-sm" />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="calls" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={hoveredBarIndex === index
                      ? `hsl(220, 70%, ${Math.max(40, 50 - index * 5)}%)`
                      : entry.fill
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {sortedCarriers.slice(0, 3).map((carrier, index) => (
            <div key={carrier.name || index} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: blueShades[index % blueShades.length] }}
                />
                {carrier.name || `Carrier ${index + 1}`}
              </span>
              <span className="font-medium">{carrier.call_count} calls</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}