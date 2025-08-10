import { NextRequest, NextResponse } from 'next/server';
import { TABLES } from '@/lib/firebase';
import { adminDb, verifyFirebaseToken } from '@/lib/firebase-server';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Helper function to get authenticated user from JWT
async function getAuthenticatedUser(request: NextRequest): Promise<DecodedIdToken | null> {
  const decoded = await verifyFirebaseToken(request.headers.get('authorization') || undefined);
  return decoded;
}

// GET /api/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      const doc = await adminDb.collection(TABLES.PRODUCTS).doc(id).get();
      if (!doc.exists) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ product: { id: doc.id, ...doc.data() } });
    } catch (error) {
      console.error('Error fetching product:', error);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error in product GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const existingDoc = await adminDb.collection(TABLES.PRODUCTS).doc(id).get();
    if (!existingDoc.exists) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    const existingProduct = existingDoc.data() as any;

    // Merge with existing data for partial updates
    const updateData = {
      name: name ?? existingProduct.name,
      description: description ?? existingProduct.description,
      price: price !== undefined ? parseFloat(price) : existingProduct.price,
      quantity: quantity !== undefined ? parseInt(quantity) : existingProduct.quantity,
      unit: unit ?? existingProduct.unit,
      category: category ?? existingProduct.category,
    };

    // Validation for required fields
    if (!updateData.name || updateData.price === undefined || updateData.quantity === undefined) {
      return NextResponse.json(
        { error: 'Name, price, and quantity are required' },
        { status: 400 }
      );
    }

    try {
      await adminDb.collection(TABLES.PRODUCTS).doc(id).update({
        ...updateData,
        updated_at: new Date().toISOString(),
      });
      const updated = await adminDb.collection(TABLES.PRODUCTS).doc(id).get();
      return NextResponse.json({ product: { id: updated.id, ...updated.data() } });
    } catch (error) {
      console.error('Error updating product:', error);
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in product PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      await adminDb.collection(TABLES.PRODUCTS).doc(id).delete();
      return NextResponse.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in product DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 