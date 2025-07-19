import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/lib/supabase';

// POST /api/inventory/update - Update inventory based on transaction
export async function POST(request: NextRequest) {
  try {
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

    const updates = [];
    const errors = [];

    // Process each item
    for (const item of items) {
      try {
        // Get current product
        const { data: product, error: fetchError } = await supabase
          .from(TABLES.PRODUCTS)
          .select('*')
          .eq('id', item.productId)
          .single();

        if (fetchError || !product) {
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
        const { error: updateError } = await supabase
          .from(TABLES.PRODUCTS)
          .update({ quantity: newQuantity })
          .eq('id', item.productId);

        if (updateError) {
          errors.push(`Failed to update ${item.name}: ${updateError.message}`);
        } else {
          updates.push({
            productId: item.productId,
            name: item.name,
            oldQuantity: product.quantity,
            newQuantity,
            change: type === 'sale' ? -item.quantity : item.quantity,
          });
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