import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Supplier {
  id: number;
  name: string;
  mobile: string;
  address?: string;
  gstNumber?: string;
  createdAt: number;
}

export interface SupplierFormData {
  name: string;
  mobile: string;
  address?: string;
  gstNumber?: string;
}

interface SupplierStore {
  suppliers: Supplier[];
  addSupplier: (supplierData: SupplierFormData) => void;
  updateSupplier: (id: number, supplierData: Partial<Supplier>) => void;
  deleteSupplier: (id: number) => void;
  getSupplierById: (id: number) => Supplier | undefined;
  searchSuppliers: (searchTerm: string) => Supplier[];
  initializeSuppliers: () => void;
}

export const useSupplierStore = create<SupplierStore>()(
  persist(
    (set, get) => ({
      suppliers: [],
      
      addSupplier: (supplierData: SupplierFormData) => {
        const newSupplier: Supplier = {
          id: Date.now(),
          name: supplierData.name,
          mobile: supplierData.mobile,
          address: supplierData.address || '',
          gstNumber: supplierData.gstNumber || '',
          createdAt: Date.now(),
        };
        
        set((state) => ({
          suppliers: [...state.suppliers, newSupplier],
        }));
      },
      
      updateSupplier: (id: number, supplierData: Partial<Supplier>) => {
        set((state) => ({
          suppliers: state.suppliers.map((supplier) =>
            supplier.id === id ? { ...supplier, ...supplierData } : supplier
          ),
        }));
      },
      
      deleteSupplier: (id: number) => {
        set((state) => ({
          suppliers: state.suppliers.filter((supplier) => supplier.id !== id),
        }));
      },
      
      getSupplierById: (id: number) => {
        return get().suppliers.find((supplier) => supplier.id === id);
      },
      
      searchSuppliers: (searchTerm: string) => {
        const { suppliers } = get();
        if (!searchTerm.trim()) return suppliers;
        
        return suppliers.filter((supplier) =>
          supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.mobile.includes(searchTerm) ||
          (supplier.gstNumber && supplier.gstNumber.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      },
      
      initializeSuppliers: () => {
        // No default suppliers - start with empty list
      },
    }),
    {
      name: 'inventory-suppliers-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ suppliers: state.suppliers }),
    }
  )
); 