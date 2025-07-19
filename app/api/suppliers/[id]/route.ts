import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/lib/supabase';

// GET /api/suppliers/[id] - Get single supplier
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from(TABLES.SUPPLIERS)
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching supplier:', error);
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ supplier: data });
  } catch (error) {
    console.error('Error in supplier GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/suppliers/[id] - Update supplier
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

    // Check if mobile already exists for other suppliers
    const { data: existingSupplier } = await supabase
      .from(TABLES.SUPPLIERS)
      .select('id')
      .eq('mobile', mobile)
      .neq('id', params.id)
      .single();

    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier with this mobile number already exists' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from(TABLES.SUPPLIERS)
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
      console.error('Error updating supplier:', error);
      return NextResponse.json(
        { error: 'Failed to update supplier' },
        { status: 500 }
      );
    }

    return NextResponse.json({ supplier: data });
  } catch (error) {
    console.error('Error in supplier PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/suppliers/[id] - Delete supplier
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from(TABLES.SUPPLIERS)
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting supplier:', error);
      return NextResponse.json(
        { error: 'Failed to delete supplier' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error in supplier DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 