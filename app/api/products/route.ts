import { NextRequest, NextResponse } from 'next/server';
import { TABLES } from '@/lib/firebase';
import { adminDb, verifyFirebaseToken } from '@/lib/firebase-server';
import { Query } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Helper function to get authenticated user from JWT
async function getAuthenticatedUser(request: NextRequest): Promise<DecodedIdToken | null> {
  const decoded = await verifyFirebaseToken(request.headers.get('authorization') || undefined);
  return decoded;
}

// GET /api/products - Get all products
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
    const category = searchParams.get('category');
    try {
      let q: Query = adminDb.collection(TABLES.PRODUCTS);
      if (category && category !== 'all') {
        q = q.where('category', '==', category);
      }
      q = q.orderBy('created_at', 'desc');

      const snapshot = await q.get();
      type Product = { id: string; name?: string; description?: string; category?: string; price?: number; quantity?: number; unit?: string } & Record<string, unknown>;
      let products: Product[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
      if (search) {
        const s = search.toLowerCase();
        products = products.filter((p) =>
          String(p.name || '').toLowerCase().includes(s) ||
          String(p.description || '').toLowerCase().includes(s)
        );
      }
      return NextResponse.json({ products });
    } catch (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
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
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, price, quantity, unit, category } = body;

    // Validation
    if (!name || !price || !quantity || !unit || !category) {
      return NextResponse.json(
        { error: 'Name, price, quantity, unit, and category are required' },
        { status: 400 }
      );
    }

    // Check if product with same name already exists
    const existing = await adminDb
      .collection(TABLES.PRODUCTS)
      .where('name', '==', name)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: 'Product with this name already exists' },
        { status: 400 }
      );
    }

    const productData: Record<string, unknown> = {
      name,
      description: description || '',
      price: parseFloat(price),
      quantity: parseInt(quantity),
      unit,
      category,
      user_id: (user as any).uid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const docRef = await adminDb.collection(TABLES.PRODUCTS).add(productData);
      const created = await docRef.get();
      const createdData = created.data() as { [key: string]: unknown } | undefined;
      return NextResponse.json({ product: { id: created.id, ...(createdData || {}) } }, { status: 201 });
    } catch (error) {
      console.error('Error creating product:', error);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in products POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 