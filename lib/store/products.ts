import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  purchasePrice: number;
  quantity: number;
  unit: string;
}

export interface ProductFormData {
  name: string;
  image: string;
  purchasePrice: number;
  sellPrice: number;
  quantity: number;
  unit: string;
}

interface ProductStore {
  products: Product[];
  addProduct: (productData: ProductFormData) => void;
  updateProduct: (id: number, productData: Partial<Product>) => void;
  deleteProduct: (id: number) => void;
  getProductById: (id: number) => Product | undefined;
  searchProducts: (searchTerm: string) => Product[];
  initializeProducts: () => void;
  updateInventory: (productId: number, quantityChange: number) => boolean;
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: [],
      
      addProduct: (productData: ProductFormData) => {
        const newProduct: Product = {
          id: Date.now(),
          name: productData.name,
          price: productData.sellPrice,
          purchasePrice: productData.purchasePrice,
          quantity: productData.quantity,
          unit: productData.unit,
          image: productData.image,
        };
        
        set((state) => ({
          products: [...state.products, newProduct],
        }));
      },
      
      updateProduct: (id: number, productData: Partial<Product>) => {
        set((state) => ({
          products: state.products.map((product) =>
            product.id === id ? { ...product, ...productData } : product
          ),
        }));
      },
      
      deleteProduct: (id: number) => {
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
        }));
      },
      
      getProductById: (id: number) => {
        return get().products.find((product) => product.id === id);
      },
      
      searchProducts: (searchTerm: string) => {
        const { products } = get();
        if (!searchTerm.trim()) return products;
        
        return products.filter((product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      },
      
      initializeProducts: () => {
        // No longer initializing with default products
        // Products will start empty and be added manually
      },

      updateInventory: (productId: number, quantityChange: number) => {
        const { products } = get();
        const product = products.find(p => p.id === productId);
        
        if (!product) {
          return false; // Product not found
        }

        const newQuantity = product.quantity + quantityChange;
        
        if (newQuantity < 0) {
          return false; // Cannot have negative inventory
        }

        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, quantity: newQuantity } : p
          ),
        }));

        return true; // Success
      },
    }),
    {
      name: 'inventory-products-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ products: state.products }),
    }
  )
); 