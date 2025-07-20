import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { TABLES } from '@/lib/supabase';

// Helper function to get authenticated user from JWT
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error verifying JWT:', error);
    return null;
  }
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

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.substring(7) || '';
    const supabaseClient = createServerSupabaseClient(token);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseClient
      .from(TABLES.TRANSACTIONS)
      .select(`
        *,
        customer:customers(id, name, mobile),
        supplier:suppliers(id, name, mobile)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filter
    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%`);
    }

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply type filter
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ transactions: data });
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

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.substring(7) || '';
    const supabaseClient = createServerSupabaseClient(token);

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
    const { data: existingTransaction } = await supabaseClient
      .from(TABLES.TRANSACTIONS)
      .select('id')
      .eq('invoice_number', invoice_number)
      .single();

    if (existingTransaction) {
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

    const transactionData = {
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
      // user_id will be auto-assigned by the database trigger
    };

    const { data, error } = await supabaseClient
      .from(TABLES.TRANSACTIONS)
      .insert(transactionData)
      .select(`
        *,
        customer:customers(id, name, mobile),
        supplier:suppliers(id, name, mobile)
      `)
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ transaction: data }, { status: 201 });
  } catch (error) {
    console.error('Error in transactions POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 