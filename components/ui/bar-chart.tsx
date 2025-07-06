'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useTheme } from '@/lib/use-theme';

interface BarChartProps {
  data: { date: string; value: number }[];
  title: string;
  className?: string;
}

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{ value: number }>;
};

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm text-sm">
        <p className="font-medium">{`₹${payload[0].value.toLocaleString()}`}</p>
      </div>
    );
  }

  return null;
};

export function BarChart({ data, title, className }: BarChartProps) {
  const theme = useTheme();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 8,
                right: 24,
                left: 16,
                bottom: 8,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
              <XAxis 
                dataKey="date" 
                className="text-xs" 
                tick={{ fill: theme.colors.mutedForeground }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: theme.colors.mutedForeground }}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone"
                dataKey="value" 
                stroke={theme.colors.primary}
                strokeWidth={2}
                connectNulls={false}
                dot={{ fill: theme.colors.primary, r: 3 }}
                activeDot={{ r: 1, fill: theme.colors.primary, stroke: theme.colors.background, strokeWidth: 2 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 