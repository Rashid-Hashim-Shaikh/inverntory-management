import { NextRequest, NextResponse } from 'next/server';
import { TABLES } from '@/lib/firebase';
import { adminDb, verifyFirebaseToken } from '@/lib/firebase-server';
import { Query } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Helper function to get authenticated user from JWT
async function getAuthenticatedUser(request: NextRequest): Promise<DecodedIdToken | null> {
  return await verifyFirebaseToken(request.headers.get('authorization') || undefined);
}

// GET /api/transactions - Get all transactions
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    try {
      const q: Query = adminDb.collection(TABLES.TRANSACTIONS).orderBy('created_at', 'desc');
      let filtered: Query = q;
      if (status && status !== 'all') filtered = filtered.where('status', '==', status);
      if (type && type !== 'all') filtered = filtered.where('type', '==', type);
      const snapshot = await filtered.offset(offset).limit(limit).get();
      type Tx = { invoice_number?: string; customer_id?: string; supplier_id?: string; type?: string; date?: string; total_amount?: number } & Record<string, unknown>;
      let transactions = await Promise.all(
        snapshot.docs.map(async (d): Promise<Record<string, unknown>> => {
          const t = d.data() as Tx;
          let customer: Record<string, unknown> | null = null;
          let supplier: Record<string, unknown> | null = null;
          if (t.customer_id) {
            const cDoc = await adminDb.collection(TABLES.CUSTOMERS).doc(t.customer_id).get();
            if (cDoc.exists) customer = { id: cDoc.id, name: cDoc.data()?.name, mobile: cDoc.data()?.mobile };
          }
          if (t.supplier_id) {
            const sDoc = await adminDb.collection(TABLES.SUPPLIERS).doc(t.supplier_id).get();
            if (sDoc.exists) supplier = { id: sDoc.id, name: sDoc.data()?.name, mobile: sDoc.data()?.mobile };
          }
          return { id: d.id, ...t, customer, supplier };
        })
      );
      if (search) {
        const s = search.toLowerCase();
        transactions = transactions.filter((t) => String((t as Tx).invoice_number || '').toLowerCase().includes(s));
      }
      return NextResponse.json({ transactions });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in transactions GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      type,
      invoice_number,
      date,
      customer_id,
      supplier_id,
      items,
      total_amount,
      total_items,
      total_quantity,
      status
    } = body;

    // Validation
    if (!type || !invoice_number || !date || !items || !total_amount) {
      return NextResponse.json(
        { error: 'Type, invoice number, date, items, and total amount are required' },
        { status: 400 }
      );
    }

    // Check if invoice number already exists
    const existing = await adminDb.collection(TABLES.TRANSACTIONS).where('invoice_number', '==', invoice_number).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json(
        { error: 'Transaction with this invoice number already exists' },
        { status: 400 }
      );
    }

    // Convert date from Indian format (DD/MM/YYYY) to ISO format (YYYY-MM-DD)
    const convertDate = (dateString: string) => {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
      return dateString; // Return as-is if not in expected format
    };

    const transactionData: {
      type: string;
      invoice_number: string;
      date: string;
      customer_id: string | null;
      supplier_id: string | null;
      items: unknown;
      total_amount: number;
      total_items: number;
      total_quantity: number;
      status: string;
      user_id: string;
      created_at: string;
      updated_at: string;
    } = {
      type,
      invoice_number,
      date: convertDate(date),
      customer_id: customer_id || null,
      supplier_id: supplier_id || null,
      items,
      total_amount: parseFloat(total_amount),
      total_items: parseInt(total_items) || items.length,
      total_quantity: parseInt(total_quantity) || items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0),
      status: status || 'completed',
      user_id: user.uid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    try {
      const ref = await adminDb.collection(TABLES.TRANSACTIONS).add(transactionData);
      // Populate customer and supplier for response
      let customer = null;
      let supplier = null;
      if (transactionData.customer_id) {
        const cDoc = await adminDb.collection(TABLES.CUSTOMERS).doc(transactionData.customer_id).get();
        if (cDoc.exists) customer = { id: cDoc.id, name: cDoc.data()?.name, mobile: cDoc.data()?.mobile };
      }
      if (transactionData.supplier_id) {
        const sDoc = await adminDb.collection(TABLES.SUPPLIERS).doc(transactionData.supplier_id).get();
        if (sDoc.exists) supplier = { id: sDoc.id, name: sDoc.data()?.name, mobile: sDoc.data()?.mobile };
      }
      return NextResponse.json({ transaction: { id: ref.id, ...transactionData, customer, supplier } }, { status: 201 });
    } catch (error) {
      console.error('Error creating transaction:', error);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in transactions POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 