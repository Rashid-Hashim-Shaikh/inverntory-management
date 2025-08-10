import { NextRequest, NextResponse } from 'next/server';
import { TABLES } from '@/lib/firebase';
import { adminDb, verifyFirebaseToken } from '@/lib/firebase-server';
import { Query } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Helper function to get authenticated user from JWT
async function getAuthenticatedUser(request: NextRequest): Promise<DecodedIdToken | null> {
  return await verifyFirebaseToken(request.headers.get('authorization') || undefined);
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    try {
      const q: Query = adminDb.collection(TABLES.SUPPLIERS).orderBy('created_at', 'desc');
      const snapshot = await q.get();
      type Supplier = { id: string; name?: string; email?: string; mobile?: string } & Record<string, unknown>;
      let suppliers: Supplier[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Supplier));
      if (search) {
        const s = search.toLowerCase();
        suppliers = suppliers.filter((c) =>
          String(c.name || '').toLowerCase().includes(s) ||
          String(c.email || '').toLowerCase().includes(s) ||
          String(c.mobile || '').includes(search)
        );
      }
      return NextResponse.json({ suppliers });
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
    }
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
    const existing = await adminDb.collection(TABLES.SUPPLIERS).where('mobile', '==', mobile).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json(
        { error: 'Supplier with this mobile number already exists' },
        { status: 400 }
      );
    }

    const supplierData: Record<string, unknown> = {
      name,
      email: email || '',
      mobile,
      address: address || '',
      user_id: (user as any).uid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const ref = await adminDb.collection(TABLES.SUPPLIERS).add(supplierData);
      const created = await ref.get();
      const createdData = created.data() as { [key: string]: unknown } | undefined;
      return NextResponse.json({ supplier: { id: created.id, ...(createdData || {}) } }, { status: 201 });
    } catch (error) {
      console.error('Error creating supplier:', error);
      return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in suppliers POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 