import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/lib/supabase';

// GET /api/transactions/[id] - Get single transaction
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .select(`
        *,
        customer:customers(id, name, mobile, email, address),
        supplier:suppliers(id, name, mobile, email, address)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching transaction:', error);
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ transaction: data });
  } catch (error) {
    console.error('Error in transaction GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/transactions/[id] - Update transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Check if invoice number already exists for other transactions
    const { data: existingTransaction } = await supabase
      .from(TABLES.TRANSACTIONS)
      .select('id')
      .eq('invoice_number', invoice_number)
      .neq('id', params.id)
      .single();

    if (existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction with this invoice number already exists' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .update({
        type,
        invoice_number,
        date,
        customer_id: customer_id || null,
        supplier_id: supplier_id || null,
        items,
        total_amount: parseFloat(total_amount),
        total_items: parseInt(total_items) || items.length,
        total_quantity: parseInt(total_quantity) || items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0),
        status: status || 'completed',
      })
      .eq('id', params.id)
      .select(`
        *,
        customer:customers(id, name, mobile),
        supplier:suppliers(id, name, mobile)
      `)
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ transaction: data });
  } catch (error) {
    console.error('Error in transaction PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/[id] - Delete transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from(TABLES.TRANSACTIONS)
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting transaction:', error);
      return NextResponse.json(
        { error: 'Failed to delete transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error in transaction DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 