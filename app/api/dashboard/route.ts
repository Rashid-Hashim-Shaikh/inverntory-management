import { NextRequest, NextResponse } from 'next/server';
import { TABLES } from '@/lib/firebase';
import { adminDb, verifyFirebaseToken } from '@/lib/firebase-server';

// Helper function to get authenticated user from JWT
import type { DecodedIdToken } from 'firebase-admin/auth';
async function getAuthenticatedUser(request: NextRequest): Promise<DecodedIdToken | null> {
  return await verifyFirebaseToken(request.headers.get('authorization') || undefined);
}

// GET /api/dashboard - Get dashboard analytics
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Counts
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    // Get current date and period start date
    const now = new Date();
    const periodStart = new Date();
    periodStart.setDate(now.getDate() - parseInt(period));

    const totalProducts = (await adminDb.collection(TABLES.PRODUCTS).count().get()).data().count || 0;
    const lowStockSnap = await adminDb.collection(TABLES.PRODUCTS).where('quantity', '<', 10).orderBy('quantity', 'asc').get();
    const lowStockProducts = lowStockSnap.docs.map((d): Record<string, unknown> => ({ id: d.id, ...d.data() }));

    const totalCustomers = (await adminDb.collection(TABLES.CUSTOMERS).count().get()).data().count || 0;
    const totalSuppliers = (await adminDb.collection(TABLES.SUPPLIERS).count().get()).data().count || 0;

    const txSnap = await adminDb
      .collection(TABLES.TRANSACTIONS)
      .where('date', '>=', periodStart.toISOString().split('T')[0])
      .where('date', '<=', now.toISOString().split('T')[0])
      .orderBy('date', 'asc')
      .get();
    type TxDoc = { type?: string; date?: string; total_amount?: number } & Record<string, unknown>;
    const transactions: TxDoc[] = txSnap.docs.map((d) => d.data() as TxDoc);

    // Calculate analytics
    const totalSales = transactions
      ?.filter((t) => t.type === 'sale')
      .reduce((sum: number, t) => sum + parseFloat(String(t.total_amount)), 0) || 0;

    const totalPurchases = transactions
      ?.filter((t) => t.type === 'purchase')
      .reduce((sum: number, t) => sum + parseFloat(String(t.total_amount)), 0) || 0;

    const totalTransactions = transactions?.length || 0;
    const salesTransactions = transactions?.filter((t) => t.type === 'sale').length || 0;
    const purchaseTransactions = transactions?.filter((t) => t.type === 'purchase').length || 0;

    // Calculate daily sales for chart
    const dailySales = transactions
      ?.filter((t) => t.type === 'sale')
      .reduce((acc: Record<string, number>, t) => {
        const date = String(t.date);
        acc[date] = (acc[date] || 0) + parseFloat(String(t.total_amount));
        return acc;
      }, {} as Record<string, number>) || {};

    // Convert to chart format
    const salesChartData = Object.entries(dailySales).map(([date, amount]) => ({
      date,
      sales: amount,
    }));

    // Get top selling products
    const topProductsSnap = await adminDb.collection(TABLES.PRODUCTS).orderBy('quantity', 'desc').limit(5).get();
    const topProducts = topProductsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

    // Get recent transactions
    const recentTxSnap = await adminDb.collection(TABLES.TRANSACTIONS).orderBy('created_at', 'desc').limit(10).get();
    const recentTransactions = recentTxSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

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