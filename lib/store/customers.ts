import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  address?: string;
  gstNumber?: string;
  createdAt: number;
}

export interface CustomerFormData {
  name: string;
  mobile: string;
  address?: string;
  gstNumber?: string;
}

interface CustomerStore {
  customers: Customer[];
  addCustomer: (customerData: CustomerFormData) => void;
  updateCustomer: (id: number, customerData: Partial<Customer>) => void;
  deleteCustomer: (id: number) => void;
  getCustomerById: (id: number) => Customer | undefined;
  searchCustomers: (searchTerm: string) => Customer[];
  initializeCustomers: () => void;
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customers: [],
      
      addCustomer: (customerData: CustomerFormData) => {
        const newCustomer: Customer = {
          id: Date.now(),
          name: customerData.name,
          mobile: customerData.mobile,
          address: customerData.address || '',
          gstNumber: customerData.gstNumber || '',
          createdAt: Date.now(),
        };
        
        set((state) => ({
          customers: [...state.customers, newCustomer],
        }));
      },
      
      updateCustomer: (id: number, customerData: Partial<Customer>) => {
        set((state) => ({
          customers: state.customers.map((customer) =>
            customer.id === id ? { ...customer, ...customerData } : customer
          ),
        }));
      },
      
      deleteCustomer: (id: number) => {
        set((state) => ({
          customers: state.customers.filter((customer) => customer.id !== id),
        }));
      },
      
      getCustomerById: (id: number) => {
        return get().customers.find((customer) => customer.id === id);
      },
      
      searchCustomers: (searchTerm: string) => {
        const { customers } = get();
        if (!searchTerm.trim()) return customers;
        
        return customers.filter((customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.mobile.includes(searchTerm) ||
          (customer.gstNumber && customer.gstNumber.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      },
      
      initializeCustomers: () => {
        // No default customers - start with empty list
      },
    }),
    {
      name: 'inventory-customers-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ customers: state.customers }),
    }
  )
); 