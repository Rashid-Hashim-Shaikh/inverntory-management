import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from './products';

export interface CartItem {
  id: string; // Unique cart item ID
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  type: 'in' | 'out';
  addedAt: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addToCart: (product: Product, type: 'in' | 'out', quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItem: (itemId: string, updates: Partial<Pick<CartItem, 'quantity' | 'price'>>) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  getTotalItems: () => number;
  getTotalValue: () => number;
  getCartItemsByType: (type: 'in' | 'out') => CartItem[];
  processCart: (updateInventory: (productId: string, quantityChange: number) => Promise<boolean>) => Promise<{ success: boolean; errors: string[] }>;
}



export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addToCart: (product: Product, type: 'in' | 'out', quantity = 1) => {
        set((state) => {
          // Check if the same product with the same type already exists in cart
          const existingItemIndex = state.items.findIndex(
            item => item.productId === product.id && item.type === type
          );

          if (existingItemIndex >= 0) {
            // Update existing item quantity
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + quantity,
              addedAt: Date.now(), // Update timestamp
            };

            return {
              items: updatedItems,
              isOpen: true,
            };
          } else {
            // Create new item
            const cartItemId = `${product.id}-${type}-${Date.now()}`;
            const newItem: CartItem = {
              id: cartItemId,
              productId: product.id,
              product,
              quantity,
              price: product.price,
              type,
              addedAt: Date.now(),
            };

            return {
              items: [...state.items, newItem],
              isOpen: true, // Auto-open cart when item is added
            };
          }
        });
      },

      removeFromCart: (itemId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      updateCartItem: (itemId: string, updates: Partial<Pick<CartItem, 'quantity' | 'price'>>) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      setCartOpen: (open: boolean) => {
        set({ isOpen: open });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalValue: () => {
        return get().items.reduce((total, item) => {
          return total + (item.price * item.quantity);
        }, 0);
      },

      getCartItemsByType: (type: 'in' | 'out') => {
        return get().items.filter((item) => item.type === type);
      },

      processCart: async (updateInventory: (productId: string, quantityChange: number) => Promise<boolean>) => {
        const { items } = get();
        const errors: string[] = [];

        // Process each cart item
        for (const item of items) {
          // For 'in' operations, add to inventory (+)
          // For 'out' operations, remove from inventory (-)
          const quantityChange = item.type === 'in' ? item.quantity : -item.quantity;
          
          const success = await updateInventory(item.productId, quantityChange);
          
          if (!success) {
            const operation = item.type === 'in' ? 'stock in' : 'stock out';
            errors.push(`Failed to process ${operation} of ${item.quantity} ${item.product.unit} of ${item.product.name}`);
          }
        }

        // If all operations were successful, clear the cart
        if (errors.length === 0) {
          set({ items: [] });
        }

        return {
          success: errors.length === 0,
          errors,
        };
      },
    }),
    {
      name: 'inventory-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Clear cart to avoid migration issues
          state.items = [];
        }
      },
    }
  )
); 