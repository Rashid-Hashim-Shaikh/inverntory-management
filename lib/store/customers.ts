import { create } from 'zustand';
import { authenticatedFetch } from '@/lib/auth-utils';

export interface Customer {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormData {
  name: string;
  email: string;
  mobile: string;
  address: string;
}

interface CustomerStore {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  
  // API Actions
  fetchCustomers: (search?: string) => Promise<void>;
  addCustomer: (customerData: CustomerFormData) => Promise<boolean>;
  updateCustomer: (id: string, customerData: Partial<CustomerFormData>) => Promise<boolean>;
  deleteCustomer: (id: string) => Promise<boolean>;
  
  // Local Actions
  getCustomerById: (id: string) => Customer | undefined;
  searchCustomers: (searchTerm: string) => Customer[];
  
  // State Management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  loading: false,
  error: null,
  
  // API Actions
  fetchCustomers: async (search?: string) => {
    set({ loading: true, error: null });
    
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      
      const response = await authenticatedFetch(`/api/customers?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch customers');
      }
      
      set({ customers: data.customers, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch customers',
        loading: false 
      });
    }
  },
  
  addCustomer: async (customerData: CustomerFormData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await authenticatedFetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify(customerData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create customer');
      }
      
      // Add new customer to the list
      set((state) => ({
        customers: [data.customer, ...state.customers],
        loading: false,
      }));
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create customer',
        loading: false 
      });
      return false;
    }
  },
  
  updateCustomer: async (id: string, customerData: Partial<CustomerFormData>) => {
    set({ loading: true, error: null });
    
    try {
      const response = await authenticatedFetch(`/api/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(customerData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update customer');
      }
      
      // Update customer in the list
      set((state) => ({
        customers: state.customers.map((customer) =>
          customer.id === id ? data.customer : customer
        ),
        loading: false,
      }));
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update customer',
        loading: false 
      });
      return false;
    }
  },
  
  deleteCustomer: async (id: string) => {
    set({ loading: true, error: null });
    
    try {
      const response = await authenticatedFetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete customer');
      }
      
      // Remove customer from the list
      set((state) => ({
        customers: state.customers.filter((customer) => customer.id !== id),
        loading: false,
      }));
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete customer',
        loading: false 
      });
      return false;
    }
  },
  
  // Local Actions
  getCustomerById: (id: string) => {
    return get().customers.find((customer) => customer.id === id);
  },
  
  searchCustomers: (searchTerm: string) => {
    const { customers } = get();
    if (!searchTerm.trim()) return customers;
    
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.mobile.includes(searchTerm)
    );
  },
  
  // State Management
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
})); 