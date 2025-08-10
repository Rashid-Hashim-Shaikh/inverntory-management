import { NextRequest, NextResponse } from 'next/server';
import { TABLES } from '@/lib/firebase';
import { adminDb, verifyFirebaseToken } from '@/lib/firebase-server';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Helper function to get authenticated user from JWT
async function getAuthenticatedUser(request: NextRequest): Promise<DecodedIdToken | null> {
  return await verifyFirebaseToken(request.headers.get('authorization') || undefined);
}

// POST /api/inventory/update - Update inventory based on transaction
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
    const { items, type } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    if (!type || !['sale', 'purchase'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid type (sale/purchase) is required' },
        { status: 400 }
      );
    }

    type InventoryUpdate = { productId: string; name: string; oldQuantity: number; newQuantity: number; change: number };
    const updates: InventoryUpdate[] = [];
    const errors: string[] = [];

    // Process each item
    for (const item of items) {
      try {
        // Get current product
        const doc = await adminDb.collection(TABLES.PRODUCTS).doc(item.productId).get();
        const product = doc.data() as { quantity: number } | undefined;
        if (!doc.exists || !product) {
          errors.push(`Product ${item.name} not found`);
          continue;
        }

        // Calculate new quantity
        let newQuantity = product.quantity;
        if (type === 'sale') {
          newQuantity -= item.quantity;
        } else if (type === 'purchase') {
          newQuantity += item.quantity;
        }

        // Check for negative stock in sales
        if (type === 'sale' && newQuantity < 0) {
          errors.push(`Insufficient stock for ${item.name}. Available: ${product.quantity}`);
          continue;
        }

        // Update product quantity
        try {
          await adminDb.collection(TABLES.PRODUCTS).doc(item.productId).update({
            quantity: newQuantity,
            updated_at: new Date().toISOString(),
          });
          updates.push({
            productId: item.productId,
            name: item.name,
            oldQuantity: product.quantity,
            newQuantity,
            change: type === 'sale' ? -item.quantity : item.quantity,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`Failed to update ${item.name}: ${msg}`);
        }
      } catch (error) {
        errors.push(`Error processing ${item.name}: ${error}`);
      }
    }

    // Return results
    if (errors.length > 0 && updates.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          errors,
          message: 'Failed to update inventory'
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      updates,
      errors: errors.length > 0 ? errors : undefined,
      message: `Inventory updated successfully. ${updates.length} products updated.`,
    });
  } catch (error) {
    console.error('Error in inventory update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 