import { NextRequest, NextResponse } from 'next/server';
import { TABLES } from '@/lib/firebase';
import { adminDb } from '@/lib/firebase-server';

// GET /api/transactions/[id] - Get single transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const doc = await adminDb.collection(TABLES.TRANSACTIONS).doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    const t = doc.data() as Record<string, unknown>;
    let customer: Record<string, unknown> | null = null;
    let supplier: Record<string, unknown> | null = null;
    if ((t as any).customer_id) {
      const cDoc = await adminDb.collection(TABLES.CUSTOMERS).doc(String((t as any).customer_id)).get();
      if (cDoc.exists) customer = { id: cDoc.id, name: cDoc.data()?.name, mobile: cDoc.data()?.mobile };
    }
    if ((t as any).supplier_id) {
      const sDoc = await adminDb.collection(TABLES.SUPPLIERS).doc(String((t as any).supplier_id)).get();
      if (sDoc.exists) supplier = { id: sDoc.id, name: sDoc.data()?.name, mobile: sDoc.data()?.mobile };
    }
    return NextResponse.json({ transaction: { id: doc.id, ...t, customer, supplier } });
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const { status } = body;

    // Validation
    if (!status || !['completed', 'pending', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      );
    }
    await adminDb.collection(TABLES.TRANSACTIONS).doc(id).update({ status, updated_at: new Date().toISOString() });
    const doc = await adminDb.collection(TABLES.TRANSACTIONS).doc(id).get();
    const t = doc.data() as Record<string, unknown>;
    let customer: Record<string, unknown> | null = null;
    let supplier: Record<string, unknown> | null = null;
    if ((t as any).customer_id) {
      const cDoc = await adminDb.collection(TABLES.CUSTOMERS).doc(String((t as any).customer_id)).get();
      if (cDoc.exists) customer = { id: cDoc.id, name: cDoc.data()?.name, mobile: cDoc.data()?.mobile };
    }
    if ((t as any).supplier_id) {
      const sDoc = await adminDb.collection(TABLES.SUPPLIERS).doc(String((t as any).supplier_id)).get();
      if (sDoc.exists) supplier = { id: sDoc.id, name: sDoc.data()?.name, mobile: sDoc.data()?.mobile };
    }
    return NextResponse.json({ transaction: { id: doc.id, ...t, customer, supplier } });
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    await adminDb.collection(TABLES.TRANSACTIONS).doc(id).delete();
    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error in transaction DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 