import { NextRequest, NextResponse } from 'next/server';
import { TABLES } from '@/lib/firebase';
import { adminDb, verifyFirebaseToken } from '@/lib/firebase-server';
import { Query } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Helper function to get authenticated user from JWT
async function getAuthenticatedUser(request: NextRequest): Promise<DecodedIdToken | null> {
  return await verifyFirebaseToken(request.headers.get('authorization') || undefined);
}

// GET /api/customers - Get all customers
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
      const q: Query = adminDb.collection(TABLES.CUSTOMERS).orderBy('created_at', 'desc');
      const snapshot = await q.get();
      type Customer = { id: string; name?: string; email?: string; mobile?: string } & Record<string, unknown>;
      let customers: Customer[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Customer));
      if (search) {
        const s = search.toLowerCase();
        customers = customers.filter((c) =>
          String(c.name || '').toLowerCase().includes(s) ||
          String(c.email || '').toLowerCase().includes(s) ||
          String(c.mobile || '').includes(search)
        );
      }
      return NextResponse.json({ customers });
    } catch (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in customers GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
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
    const existing = await adminDb.collection(TABLES.CUSTOMERS).where('mobile', '==', mobile).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json(
        { error: 'Customer with this mobile number already exists' },
        { status: 400 }
      );
    }

    const customerData: Record<string, unknown> = {
      name,
      email: email || '',
      mobile,
      address: address || '',
      user_id: (user as any).uid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const ref = await adminDb.collection(TABLES.CUSTOMERS).add(customerData);
      const created = await ref.get();
      const createdData = created.data() as { [key: string]: unknown } | undefined;
      return NextResponse.json({ customer: { id: created.id, ...(createdData || {}) } }, { status: 201 });
    } catch (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in customers POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 