import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/lib/supabase';

// GET /api/products - Get all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    let query = supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Apply category filter
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    return NextResponse.json({ products: data });
  } catch (error) {
    console.error('Error in products GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, quantity, unit, category } = body;

    // Validation
    if (!name || !price || quantity === undefined) {
      return NextResponse.json(
        { error: 'Name, price, and quantity are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .insert({
        name,
        description: description || '',
        price: parseFloat(price),
        quantity: parseInt(quantity),
        unit: unit || 'pcs',
        category: category || 'General',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error) {
    console.error('Error in products POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 