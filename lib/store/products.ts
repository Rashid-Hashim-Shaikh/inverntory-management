import { create } from 'zustand';
import { authenticatedFetch } from '@/lib/auth-utils';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
  category: string;
}

interface ProductStore {
  products: Product[];
  loading: boolean;
  error: string | null;
  
  // API Actions
  fetchProducts: (search?: string, category?: string) => Promise<void>;
  addProduct: (productData: ProductFormData) => Promise<boolean>;
  updateProduct: (id: string, productData: Partial<ProductFormData>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  
  // Local Actions
  getProductById: (id: string) => Product | undefined;
  searchProducts: (searchTerm: string) => Product[];
  updateInventory: (productId: string, quantityChange: number) => Promise<boolean>;
  
  // State Management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  
  // API Actions
  fetchProducts: async (search?: string, category?: string) => {
    set({ loading: true, error: null });
    
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category && category !== 'all') params.append('category', category);
      
      const response = await authenticatedFetch(`/api/products?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }
      
      set({ products: data.products, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        loading: false 
      });
    }
  },
  
  addProduct: async (productData: ProductFormData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await authenticatedFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product');
      }
      
      // Add new product to the list
      set((state) => ({
        products: [data.product, ...state.products],
        loading: false,
      }));
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create product',
        loading: false 
      });
      return false;
    }
  },
  
  updateProduct: async (id: string, productData: Partial<ProductFormData>) => {
    set({ loading: true, error: null });
    
    try {
      const response = await authenticatedFetch(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update product');
      }
      
      // Update product in the list
      set((state) => ({
        products: state.products.map((product) =>
          product.id === id ? data.product : product
        ),
        loading: false,
      }));
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update product',
        loading: false 
      });
      return false;
    }
  },
  
  deleteProduct: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const response = await authenticatedFetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete product');
      }
      
      // Remove product from the list
      set((state) => ({
        products: state.products.filter((product) => product.id !== id),
        loading: false,
      }));
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete product',
        loading: false 
      });
      return false;
    }
  },
  
  // Local Actions
  getProductById: (id: string) => {
    return get().products.find((product) => product.id === id);
  },
  
  searchProducts: (searchTerm: string) => {
    const { products } = get();
    if (!searchTerm.trim()) return products;
    
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },
  
  updateInventory: async (productId: string, quantityChange: number) => {
    const { products } = get();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return false; // Product not found
    }

    const newQuantity = product.quantity + quantityChange;
    
    if (newQuantity < 0) {
      return false; // Cannot have negative quantity
    }

    // Update the product quantity
    const success = await get().updateProduct(productId, { quantity: newQuantity });
    
    if (success) {
      // Update local state immediately for better UX
      set((state) => ({
        products: state.products.map((p) =>
          p.id === productId ? { ...p, quantity: newQuantity } : p
        ),
      }));
    }
    
    return success;
  },
  
  // State Management
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
})); 