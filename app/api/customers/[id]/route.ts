import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/lib/supabase';

// GET /api/customers/[id] - Get single customer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from(TABLES.CUSTOMERS)
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching customer:', error);
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer: data });
  } catch (error) {
    console.error('Error in customer GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, email, mobile, address } = body;

    // Validation
    if (!name || !mobile) {
      return NextResponse.json(
        { error: 'Name and mobile are required' },
        { status: 400 }
      );
    }

    // Check if mobile already exists for other customers
    const { data: existingCustomer } = await supabase
      .from(TABLES.CUSTOMERS)
      .select('id')
      .eq('mobile', mobile)
      .neq('id', params.id)
      .single();

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this mobile number already exists' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from(TABLES.CUSTOMERS)
      .update({
        name,
        email: email || '',
        mobile,
        address: address || '',
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      return NextResponse.json(
        { error: 'Failed to update customer' },
        { status: 500 }
      );
    }

    return NextResponse.json({ customer: data });
  } catch (error) {
    console.error('Error in customer PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from(TABLES.CUSTOMERS)
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting customer:', error);
      return NextResponse.json(
        { error: 'Failed to delete customer' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error in customer DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 