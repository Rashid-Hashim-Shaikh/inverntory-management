'use client'

import { 
  LucideDollarSign, 
  LucideUsers, 
  LucideCalendarClock,
  LucideAlertTriangle
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { BarChart } from "@/components/ui/bar-chart";

// Mock data for the daily revenue chart with consistent values
const dailyRevenueData = [
  { date: 'Mon', value: 12000 },
  { date: 'Tue', value: 18000 },
  { date: 'Wed', value: 16000 },
  { date: 'Thu', value: 22000 },
  { date: 'Fri', value: 24000 },
  { date: 'Sat', value: 19000 },
  { date: 'Sun', value: 13000 },
];

export default function Home() {
  return (
    <div className="flex flex-col p-6 md:p-8 overflow-auto h-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Welcome to your inventory dashboard.
        </p>
      </div>

      <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Sales "
          value="₹24,780"
          icon={LucideDollarSign}
          description="Total revenue for current month"
          trend={{
            value: 12.5,
            isPositive: true
          }}
        />
        
        <StatsCard
          title="Yesterday's Sales"
          value="₹1,429"
          icon={LucideCalendarClock}
          description="Total revenue from yesterday"
          trend={{
            value: 3.2,
            isPositive: true
          }}
        />
        
        <StatsCard
          title="Low Stock Items"
          value="7"
          icon={LucideAlertTriangle}
          description="Products that need restocking"
          trend={{
            value: 2,
            isPositive: false
          }}
        />
        
        <StatsCard
          title="Total Customers"
          value="842"
          icon={LucideUsers}
          description="Active customer accounts"
          trend={{
            value: 4.6,
            isPositive: true
          }}
        />
      </div>

      <div className="grid gap-6 mt-6 pb-6">
        <BarChart 
          data={dailyRevenueData}
          title="Daily Revenue (Last 7 Days)"
        />
      </div>
    </div>
  );
}
