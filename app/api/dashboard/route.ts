import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/lib/supabase';

// GET /api/dashboard - Get dashboard analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    // Get current date and period start date
    const now = new Date();
    const periodStart = new Date();
    periodStart.setDate(now.getDate() - parseInt(period));

    // Get total products count
    const { count: totalProducts } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*', { count: 'exact', head: true });

    // Get low stock products (quantity < 10)
    const { data: lowStockProducts } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .lt('quantity', 10)
      .order('quantity', { ascending: true });

    // Get total customers count
    const { count: totalCustomers } = await supabase
      .from(TABLES.CUSTOMERS)
      .select('*', { count: 'exact', head: true });

    // Get total suppliers count
    const { count: totalSuppliers } = await supabase
      .from(TABLES.SUPPLIERS)
      .select('*', { count: 'exact', head: true });

    // Get transactions for the period
    const { data: transactions } = await supabase
      .from(TABLES.TRANSACTIONS)
      .select('*')
      .gte('date', periodStart.toISOString().split('T')[0])
      .lte('date', now.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Calculate analytics
    const totalSales = transactions
      ?.filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + parseFloat(t.total_amount), 0) || 0;

    const totalPurchases = transactions
      ?.filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + parseFloat(t.total_amount), 0) || 0;

    const totalTransactions = transactions?.length || 0;
    const salesTransactions = transactions?.filter(t => t.type === 'sale').length || 0;
    const purchaseTransactions = transactions?.filter(t => t.type === 'purchase').length || 0;

    // Calculate daily sales for chart
    const dailySales = transactions
      ?.filter(t => t.type === 'sale')
      .reduce((acc, t) => {
        const date = t.date;
        acc[date] = (acc[date] || 0) + parseFloat(t.total_amount);
        return acc;
      }, {} as Record<string, number>) || {};

    // Convert to chart format
    const salesChartData = Object.entries(dailySales).map(([date, amount]) => ({
      date,
      sales: amount,
    }));

    // Get top selling products
    const { data: topProducts } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .order('quantity', { ascending: false })
      .limit(5);

    // Get recent transactions
    const { data: recentTransactions } = await supabase
      .from(TABLES.TRANSACTIONS)
      .select(`
        *,
        customer:customers(name),
        supplier:suppliers(name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      analytics: {
        totalProducts: totalProducts || 0,
        totalCustomers: totalCustomers || 0,
        totalSuppliers: totalSuppliers || 0,
        totalSales,
        totalPurchases,
        totalTransactions,
        salesTransactions,
        purchaseTransactions,
        lowStockCount: lowStockProducts?.length || 0,
      },
      charts: {
        salesData: salesChartData,
      },
      topProducts: topProducts || [],
      recentTransactions: recentTransactions || [],
      lowStockProducts: lowStockProducts || [],
    });
  } catch (error) {
    console.error('Error in dashboard GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 