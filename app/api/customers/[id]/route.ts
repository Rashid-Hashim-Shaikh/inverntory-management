import { NextRequest, NextResponse } from 'next/server';
import { TABLES } from '@/lib/firebase';
import { adminDb, verifyFirebaseToken } from '@/lib/firebase-server';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Helper function to get authenticated user from JWT
async function getAuthenticatedUser(request: NextRequest): Promise<DecodedIdToken | null> {
  return await verifyFirebaseToken(request.headers.get('authorization') || undefined);
}

// GET /api/customers/[id] - Get single customer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      const doc = await adminDb.collection(TABLES.CUSTOMERS).doc(params.id).get();
      if (!doc.exists) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ customer: { id: doc.id, ...doc.data() } });
    } catch (error) {
      console.error('Error fetching customer:', error);
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
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

    // Check if mobile already exists for other customers
    const existing = await adminDb
      .collection(TABLES.CUSTOMERS)
      .where('mobile', '==', mobile)
      .limit(1)
      .get();
    if (!existing.empty && existing.docs[0].id !== params.id) {
      return NextResponse.json(
        { error: 'Customer with this mobile number already exists' },
        { status: 400 }
      );
    }

    try {
      await adminDb.collection(TABLES.CUSTOMERS).doc(params.id).update({
        name,
        email: email || '',
        mobile,
        address: address || '',
        updated_at: new Date().toISOString(),
      });
      const updated = await adminDb.collection(TABLES.CUSTOMERS).doc(params.id).get();
      return NextResponse.json({ customer: { id: updated.id, ...updated.data() } });
    } catch (error) {
      console.error('Error updating customer:', error);
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }
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
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      await adminDb.collection(TABLES.CUSTOMERS).doc(params.id).delete();
      return NextResponse.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      console.error('Error deleting customer:', error);
      return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in customer DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 