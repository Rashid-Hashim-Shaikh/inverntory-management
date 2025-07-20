import { create } from 'zustand';

export interface Supplier {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierFormData {
  name: string;
  email: string;
  mobile: string;
  address: string;
}

interface SupplierStore {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  
  // API Actions
  fetchSuppliers: (search?: string) => Promise<void>;
  addSupplier: (supplierData: SupplierFormData) => Promise<boolean>;
  updateSupplier: (id: string, supplierData: Partial<SupplierFormData>) => Promise<boolean>;
  deleteSupplier: (id: string) => Promise<boolean>;
  
  // Local Actions
  getSupplierById: (id: string) => Supplier | undefined;
  searchSuppliers: (searchTerm: string) => Supplier[];
  
  // State Management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useSupplierStore = create<SupplierStore>((set, get) => ({
  suppliers: [],
  loading: false,
  error: null,
  
  // API Actions
  fetchSuppliers: async (search?: string) => {
    set({ loading: true, error: null });
    
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/suppliers?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch suppliers');
      }
      
      set({ suppliers: data.suppliers, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch suppliers',
        loading: false 
      });
    }
  },
  
  addSupplier: async (supplierData: SupplierFormData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create supplier');
      }
      
      // Add new supplier to the list
      set((state) => ({
        suppliers: [data.supplier, ...state.suppliers],
        loading: false,
      }));
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create supplier',
        loading: false 
      });
      return false;
    }
  },
  
  updateSupplier: async (id: string, supplierData: Partial<SupplierFormData>) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update supplier');
      }
      
      // Update supplier in the list
      set((state) => ({
        suppliers: state.suppliers.map((supplier) =>
          supplier.id === id ? data.supplier : supplier
        ),
        loading: false,
      }));
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update supplier',
        loading: false 
      });
      return false;
    }
  },
  
  deleteSupplier: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete supplier');
      }
      
      // Remove supplier from the list
      set((state) => ({
        suppliers: state.suppliers.filter((supplier) => supplier.id !== id),
        loading: false,
      }));
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete supplier',
        loading: false 
      });
      return false;
    }
  },
  
  // Local Actions
  getSupplierById: (id: string) => {
    return get().suppliers.find((supplier) => supplier.id === id);
  },
  
  searchSuppliers: (searchTerm: string) => {
    const { suppliers } = get();
    if (!searchTerm.trim()) return suppliers;
    
    return suppliers.filter((supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.mobile.includes(searchTerm)
    );
  },
  
  // State Management
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
})); 