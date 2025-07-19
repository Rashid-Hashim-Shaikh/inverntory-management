'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, Minus, ShoppingCart, Trash2, IndianRupee, Check, AlertCircle } from 'lucide-react';
import { useCartStore, CartItem } from '@/lib/store/cart';
import { useProductStore } from '@/lib/store/products';
import { useTheme } from '@/lib/use-theme';
import { ContactSelectionModal } from '@/components/contact-selection-modal';
import { Customer } from '@/lib/store/customers';
import { Supplier } from '@/lib/store/suppliers';

export function CartSidebar() {
  const theme = useTheme();
  const router = useRouter();
  const {
    items,
    isOpen,
    removeFromCart,
    updateCartItem,
    clearCart,
    setCartOpen,
    getTotalItems,
    getTotalValue,
    getCartItemsByType,
    processCart,
  } = useCartStore();

  const { updateInventory } = useProductStore();

  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ quantity: number; purchasePrice: number }>({
    quantity: 1,
    purchasePrice: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<{ success: boolean; errors: string[] } | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactType, setContactType] = useState<'customer' | 'supplier'>('customer');


  const inItems = getCartItemsByType('in');
  const outItems = getCartItemsByType('out');

  const handleEditStart = (item: CartItem) => {
    setEditingItem(item.id);
    setEditValues({
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
    });
  };

  const handleEditSave = (itemId: string) => {
    updateCartItem(itemId, editValues);
    setEditingItem(null);
  };

  const handleEditCancel = () => {
    setEditingItem(null);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      updateCartItem(itemId, { quantity: newQuantity });
    }
  };

  const handleProceed = async () => {
    // Check if we have items that need contact selection
    const hasOutItems = outItems.length > 0;
    const hasInItems = inItems.length > 0;
    
    if (hasOutItems && hasInItems) {
      // Mixed cart - ask for customer first (for OUT items)
      setContactType('customer');
      setShowContactModal(true);
      return;
    } else if (hasOutItems) {
      // Only OUT items - ask for customer
      setContactType('customer');
      setShowContactModal(true);
      return;
    } else if (hasInItems) {
      // Only IN items - ask for supplier
      setContactType('supplier');
      setShowContactModal(true);
      return;
    }

    // No items in cart
    setProcessResult({
      success: false,
      errors: ['Cart is empty.'],
    });
  };

  const handleContactSelect = (contact: Customer | Supplier) => {
    setShowContactModal(false);
    
    // If we have OUT items and selected customer, navigate to PDF preview page
    if (contactType === 'customer' && outItems.length > 0) {
      console.log('Navigating to PDF preview for customer:', contact.id);
      // Keep cart open when navigating to invoice preview
      // Use setTimeout to ensure modal closes before navigation
      setTimeout(() => {
        try {
          router.push(`/invoice-preview?customerId=${contact.id}`);
        } catch (error) {
          console.error('Navigation error:', error);
        }
      }, 100);
      return;
    }
    
    // If we have mixed cart and just selected customer, now ask for supplier
    if (contactType === 'customer' && inItems.length > 0 && outItems.length > 0) {
      setContactType('supplier');
      setShowContactModal(true);
      return;
    }

    // Process the cart with selected contact(s)
    processCartWithContact();
  };

  const processCartWithContact = async () => {
    setIsProcessing(true);
    setProcessResult(null);

    try {
      const result = processCart(updateInventory);
      setProcessResult(result);
      
      if (result.success) {
        // Auto-close cart after successful processing
        setTimeout(() => {
          setCartOpen(false);
          setProcessResult(null);
        }, 2000);
      }
    } catch {
      setProcessResult({
        success: false,
        errors: ['An unexpected error occurred while processing the cart.'],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const CartItemComponent = ({ item }: { item: CartItem }) => {
    const isEditing = editingItem === item.id;

    return (
      <div
        className="p-3 rounded-lg border mb-3"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        }}
      >
        {/* Product Info */}
        <div className="flex items-center gap-3 mb-2">
          <img
            src={item.product.image}
            alt={item.product.name}
            className="w-12 h-12 object-cover rounded"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAxOEwyOCAyNkgyMEgxNkwyMCAxOFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTIwIDE4TDE2IDI2SDI4TDIwIDE4WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
            }}
          />
          <div className="flex-1">
            <h4 className="font-medium text-sm line-clamp-1" style={{ color: theme.colors.foreground }}>
              {item.product.name}
            </h4>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  item.type === 'in' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}
              >
                {item.type.toUpperCase()}
              </span>
              <span className="text-xs" style={{ color: theme.colors.mutedForeground }}>
                {item.product.unit}
              </span>
            </div>
          </div>
          <button
            onClick={() => removeFromCart(item.id)}
            className="p-1 rounded hover:bg-red-100 text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Quantity and Price Controls */}
        {isEditing ? (
          <div className="space-y-2">
            {/* Quantity Input */}
            <div>
              <label className="text-xs font-medium" style={{ color: theme.colors.mutedForeground }}>
                Quantity
              </label>
              <input
                type="number"
                value={editValues.quantity}
                onChange={(e) =>
                  setEditValues(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))
                }
                min="1"
                className="w-full px-2 py-1 text-sm border rounded"
                style={{
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.input,
                  color: theme.colors.foreground,
                }}
              />
            </div>

            {/* Price Input */}
            <div>
              <label className="text-xs font-medium" style={{ color: theme.colors.mutedForeground }}>
                Price per unit
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <input
                  type="number"
                  value={editValues.purchasePrice}
                  onChange={(e) =>
                    setEditValues(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))
                  }
                  min="0"
                  step="0.01"
                  className="w-full pl-6 pr-2 py-1 text-sm border rounded"
                  style={{
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.input,
                    color: theme.colors.foreground,
                  }}
                />
              </div>
            </div>

            {/* Edit Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleEditSave(item.id)}
                className="flex-1 px-2 py-1 text-xs rounded font-medium"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.primaryForeground,
                }}
              >
                Save
              </button>
              <button
                onClick={handleEditCancel}
                className="flex-1 px-2 py-1 text-xs rounded font-medium"
                style={{
                  backgroundColor: theme.colors.secondary,
                  color: theme.colors.secondaryForeground,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Quantity Controls */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: theme.colors.mutedForeground }}>
                Quantity:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  className="p-1 rounded hover:bg-gray-100"
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-sm font-medium min-w-[2rem] text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Price Display */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: theme.colors.mutedForeground }}>
                Unit Price:
              </span>
              <span className="text-sm font-medium" style={{ color: theme.colors.primary }}>
                ₹{item.purchasePrice.toLocaleString()}
              </span>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: theme.colors.border }}>
              <span className="text-sm font-medium">Total:</span>
              <span className="text-sm font-bold" style={{ color: theme.colors.primary }}>
                ₹{(item.quantity * item.purchasePrice).toLocaleString()}
              </span>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => handleEditStart(item)}
              className="w-full px-2 py-1 text-xs rounded font-medium mt-2"
              style={{
                backgroundColor: theme.colors.accent,
                color: theme.colors.accentForeground,
              }}
            >
              Edit
            </button>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div
        className="p-4 border-b flex items-center justify-between"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        }}
      >
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" style={{ color: theme.colors.primary }} />
          <h2 className="font-semibold" style={{ color: theme.colors.foreground }}>
            Cart ({getTotalItems()})
          </h2>
        </div>
        <button
          onClick={() => setCartOpen(false)}
          className="p-1 rounded hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Your cart is empty</p>
          </div>
        ) : (
          <div>
            {/* In Items */}
            {inItems.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3 text-green-700">Stock In ({inItems.length})</h3>
                {inItems.map((item) => (
                  <CartItemComponent key={item.id} item={item} />
                ))}
              </div>
            )}

            {/* Out Items */}
            {outItems.length > 0 && (
              <div>
                <h3 className="font-medium mb-3 text-blue-700">Stock Out ({outItems.length})</h3>
                {outItems.map((item) => (
                  <CartItemComponent key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div
          className="p-4 border-t"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">Total Value:</span>
            <span className="font-bold text-lg" style={{ color: theme.colors.primary }}>
              ₹{getTotalValue().toLocaleString()}
            </span>
          </div>

          {/* Process Result */}
          {processResult && (
            <div className={`mb-3 p-2 rounded text-sm ${
              processResult.success 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {processResult.success ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {processResult.success ? 'Success!' : 'Error'}
                </span>
              </div>
              {processResult.success ? (
                <p>Cart processed successfully. Inventory updated.</p>
              ) : (
                <div>
                  {processResult.errors.map((error, index) => (
                    <p key={index} className="mt-1">{error}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleProceed}
              disabled={isProcessing}
              className="w-full px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.primaryForeground,
              }}
            >
              {isProcessing ? 'Processing...' : 'Proceed'}
            </button>
            
            <button
              onClick={clearCart}
              className="w-full px-4 py-2 rounded font-medium"
              style={{
                backgroundColor: theme.colors.destructive,
                color: theme.colors.destructiveForeground,
              }}
            >
              Clear Cart
            </button>
          </div>
        </div>
      )}

      {/* Contact Selection Modal */}
      <ContactSelectionModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        type={contactType}
        onSelect={handleContactSelect}
      />


    </div>
  );
} 