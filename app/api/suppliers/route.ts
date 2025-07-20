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

// GET /api/suppliers - Get all suppliers
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

    let query = supabaseClient
      .from(TABLES.SUPPLIERS)
      .select('*')
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,mobile.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching suppliers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch suppliers' },
        { status: 500 }
      );
    }

    return NextResponse.json({ suppliers: data });
  } catch (error) {
    console.error('Error in suppliers GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/suppliers - Create new supplier
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
    const { name, email, mobile, address } = body;

    // Validation
    if (!name || !mobile) {
      return NextResponse.json(
        { error: 'Name and mobile are required' },
        { status: 400 }
      );
    }

    // Check if mobile already exists
    const { data: existingSupplier } = await supabaseClient
      .from(TABLES.SUPPLIERS)
      .select('id')
      .eq('mobile', mobile)
      .single();

    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier with this mobile number already exists' },
        { status: 400 }
      );
    }

    const supplierData = {
      name,
      email: email || '',
      mobile,
      address: address || '',
      // user_id will be auto-assigned by the database trigger
    };

    const { data, error } = await supabaseClient
      .from(TABLES.SUPPLIERS)
      .insert(supplierData)
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      return NextResponse.json(
        { error: 'Failed to create supplier' },
        { status: 500 }
      );
    }

    return NextResponse.json({ supplier: data }, { status: 201 });
  } catch (error) {
    console.error('Error in suppliers POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 