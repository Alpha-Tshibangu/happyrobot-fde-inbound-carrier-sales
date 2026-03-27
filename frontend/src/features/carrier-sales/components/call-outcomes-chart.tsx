'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { CallStats } from '@/lib/api-service';

interface CallOutcomesChartProps {
  metrics: CallStats;
}

const COLORS = {
  booked: 'hsl(220, 70%, 50%)',
  rejected: 'hsl(220, 70%, 60%)',
  failed_negotiation: 'hsl(220, 70%, 70%)',
  ineligible: 'hsl(220, 40%, 80%)',
};

export function CallOutcomesChart({ metrics }: CallOutcomesChartProps) {
  const data = [
    {
      name: 'Booked',
      value: metrics.booked_calls,
      color: COLORS.booked,
    },
    {
      name: 'Rejected',
      value: metrics.rejected_calls,
      color: COLORS.rejected,
    },
    {
      name: 'Failed Negotiation',
      value: metrics.failed_negotiations,
      color: COLORS.failed_negotiation,
    },
    {
      name: 'Ineligible Carriers',
      value: metrics.ineligible_carriers,
      color: COLORS.ineligible,
    },
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / metrics.total_calls) * 100).toFixed(1);
      return (
        <div className="bg-background border rounded-lg p-2 shadow-sm">
          <p className="text-sm font-medium">{data.name}</p>
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
        <CardTitle>Call Outcomes</CardTitle>
        <CardDescription>
          Distribution of call results from {metrics.total_calls} total calls
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">{item.name}</span>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}