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
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs" 
                tick={{ fill: 'var(--muted-foreground)' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'var(--muted-foreground)' }}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="basis"
                dataKey="value" 
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                connectNulls
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'var(--background)', strokeWidth: 2 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 