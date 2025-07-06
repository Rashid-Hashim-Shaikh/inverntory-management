"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        
        {description && (
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        )}
        
        {trend && (
          <div className="mt-2">
            <span
              className={cn(
                "text-xs font-medium",
                trend.isPositive
                  ? "text-green-600 dark:text-green-500"
                  : "text-red-600 dark:text-red-500"
              )}
            >
              {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
            </span>
            <span className="ml-1 text-xs text-neutral-500 dark:text-neutral-400">
              from last period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 