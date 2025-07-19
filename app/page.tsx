'use client'

import { useEffect, useMemo } from 'react';
import { 
  LucideDollarSign, 
  LucidePackage, 
  LucideShoppingCart,
  LucideAlertTriangle
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { BarChart } from "@/components/ui/bar-chart";
import { useProductStore } from "@/lib/store/products";

export default function Home() {
  const { products } = useProductStore();

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const totalProducts = products.length;
    const totalInventoryValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    const totalPurchaseValue = products.reduce((sum, product) => sum + (product.purchasePrice * product.quantity), 0);
    const potentialProfit = totalInventoryValue - totalPurchaseValue;
    const lowStockItems = products.filter(product => product.quantity < 10).length;
    const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);

    return {
      totalProducts,
      totalInventoryValue,
      potentialProfit,
      lowStockItems,
      totalQuantity
    };
  }, [products]);

  // Sample inventory distribution data based on actual products
  const inventoryDistributionData = useMemo(() => {
    if (products.length === 0) {
      return [
        { date: 'No Data', value: 0 }
      ];
    }

    // Group products by unit type and show their total values
    const unitGroups = products.reduce((acc, product) => {
      const unit = product.unit;
      if (!acc[unit]) {
        acc[unit] = 0;
      }
      acc[unit] += product.price * product.quantity;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(unitGroups)
      .map(([unit, value]) => ({ date: unit, value }))
      .slice(0, 7); // Show max 7 categories
  }, [products]);
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
          title="Total Products"
          value={dashboardMetrics.totalProducts.toString()}
          icon={LucidePackage}
          description="Total number of products in inventory"
          trend={{
            value: dashboardMetrics.totalProducts,
            isPositive: dashboardMetrics.totalProducts > 0
          }}
        />
        
        <StatsCard
          title="Inventory Value"
          value={`₹${dashboardMetrics.totalInventoryValue.toLocaleString()}`}
          icon={LucideDollarSign}
          description="Total value of current inventory"
          trend={{
            value: dashboardMetrics.potentialProfit,
            isPositive: dashboardMetrics.potentialProfit > 0
          }}
        />
        
        <StatsCard
          title="Low Stock Items"
          value={dashboardMetrics.lowStockItems.toString()}
          icon={LucideAlertTriangle}
          description="Products with less than 10 units"
          trend={{
            value: dashboardMetrics.lowStockItems,
            isPositive: dashboardMetrics.lowStockItems === 0
          }}
        />
        
        <StatsCard
          title="Total Quantity"
          value={dashboardMetrics.totalQuantity.toString()}
          icon={LucideShoppingCart}
          description="Total units across all products"
          trend={{
            value: dashboardMetrics.totalQuantity,
            isPositive: dashboardMetrics.totalQuantity > 0
          }}
        />
      </div>

      <div className="grid gap-6 mt-6 pb-6">
        <BarChart 
          data={inventoryDistributionData}
          title="Inventory Value by Unit Type"
        />
      </div>
    </div>
  );
}
