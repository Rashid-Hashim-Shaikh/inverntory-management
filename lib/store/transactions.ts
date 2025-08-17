import { create } from 'zustand';
import { authenticatedFetch } from '@/lib/auth-utils';
import { Customer } from './customers';
import { Supplier } from './suppliers';

// Define CartItem locally since cart store was removed
export interface CartItem {
  id: string;
  productId: string;
  product: any; // Product type
  quantity: number;
  price: number;
  type: 'in' | 'out';
  addedAt: number;
}

export interface Transaction {
  id: string;
  type: 'sale' | 'purchase';
  invoiceNumber: string;
  date: string;
  customer?: Customer;
  supplier?: Supplier;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  totalQuantity: number;
  status: 'completed' | 'pending' | 'cancelled';
  createdAt: string;
}

export interface TransactionFormData {
  type: 'sale' | 'purchase';
  invoiceNumber: string;
  date: string;
  customerId?: string;
  supplierId?: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  totalQuantity: number;
  status?: 'completed' | 'pending' | 'cancelled';
}

interface TransactionStore {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  
  // API Actions
  fetchTransactions: (search?: string, status?: string, type?: string) => Promise<void>;
  addTransaction: (transactionData: TransactionFormData) => Promise<Transaction | false>;
  updateTransactionStatus: (id: string, status: Transaction['status']) => Promise<boolean>;
  
  // Local Actions
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionsByType: (type: 'sale' | 'purchase') => Transaction[];
  getTransactionsByStatus: (status: Transaction['status']) => Transaction[];
  searchTransactions: (searchTerm: string) => Transaction[];
  
  // State Management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  loading: false,
  error: null,
  
  // API Actions
  fetchTransactions: async (search?: string, status?: string, type?: string) => {
    set({ loading: true, error: null });
    
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);
      if (type && type !== 'all') params.append('type', type);
      
      const response = await authenticatedFetch(`/api/transactions?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transactions');
      }
      
      // Transform API response to match frontend format
      const transformedTransactions = data.transactions.map((transaction: {
        id: string;
        type: 'sale' | 'purchase';
        invoice_number: string;
        date: string;
        customer?: Customer;
        supplier?: Supplier;
        items: CartItem[];
        total_amount: number;
        total_items: number;
        total_quantity: number;
        status: 'completed' | 'pending' | 'cancelled';
        created_at: string;
      }) => ({
        id: transaction.id,
        type: transaction.type,
        invoiceNumber: transaction.invoice_number,
        date: transaction.date,
        customer: transaction.customer,
        supplier: transaction.supplier,
        items: transaction.items,
        totalAmount: transaction.total_amount,
        totalItems: transaction.total_items,
        totalQuantity: transaction.total_quantity,
        status: transaction.status,
        createdAt: transaction.created_at,
      }));
      
      set({ transactions: transformedTransactions, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch transactions',
        loading: false 
      });
    }
  },
  
  addTransaction: async (transactionData: TransactionFormData): Promise<Transaction | false> => {
    set({ loading: true, error: null });
    
    try {
      // Transform data to match API format
      const apiData = {
        type: transactionData.type,
        invoice_number: transactionData.invoiceNumber,
        date: transactionData.date,
        customer_id: transactionData.customerId,
        supplier_id: transactionData.supplierId,
        items: transactionData.items,
        total_amount: transactionData.totalAmount,
        total_items: transactionData.totalItems,
        total_quantity: transactionData.totalQuantity,
        status: transactionData.status || 'completed',
      };

      const response = await authenticatedFetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(apiData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create transaction');
      }
      
      // Transform the response to match frontend format
      const transformedTransaction = {
        id: data.transaction.id,
        type: data.transaction.type,
        invoiceNumber: data.transaction.invoice_number,
        date: data.transaction.date,
        customer: data.transaction.customer,
        supplier: data.transaction.supplier,
        items: data.transaction.items,
        totalAmount: data.transaction.total_amount,
        totalItems: data.transaction.total_items,
        totalQuantity: data.transaction.total_quantity,
        status: data.transaction.status,
        createdAt: data.transaction.created_at,
      };
      
      // Add new transaction to the list
      set((state) => ({
        transactions: [transformedTransaction, ...state.transactions],
        loading: false,
      }));
      
      return transformedTransaction;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create transaction',
        loading: false 
      });
      return false;
    }
  },
  
  updateTransactionStatus: async (id: string, status: Transaction['status']) => {
    set({ loading: true, error: null });
    
    try {
      const response = await authenticatedFetch(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update transaction');
      }
      
      // Transform the response to match frontend format
      const transformedTransaction = {
        id: data.transaction.id,
        type: data.transaction.type,
        invoiceNumber: data.transaction.invoice_number,
        date: data.transaction.date,
        customer: data.transaction.customer,
        supplier: data.transaction.supplier,
        items: data.transaction.items,
        totalAmount: data.transaction.total_amount,
        totalItems: data.transaction.total_items,
        totalQuantity: data.transaction.total_quantity,
        status: data.transaction.status,
        createdAt: data.transaction.created_at,
      };

      // Update transaction in the list
      set((state) => ({
        transactions: state.transactions.map((transaction) =>
          transaction.id === id ? transformedTransaction : transaction
        ),
        loading: false,
      }));
      
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update transaction',
        loading: false 
      });
      return false;
    }
  },
  
  // Local Actions
  getTransactionById: (id: string) => {
    return get().transactions.find((transaction) => transaction.id === id);
  },
  
  getTransactionsByType: (type: 'sale' | 'purchase') => {
    return get().transactions.filter((transaction) => transaction.type === type);
  },
  
  getTransactionsByStatus: (status: Transaction['status']) => {
    return get().transactions.filter((transaction) => transaction.status === status);
  },
  
  searchTransactions: (searchTerm: string) => {
    const { transactions } = get();
    if (!searchTerm.trim()) return transactions;
    
    return transactions.filter((transaction) =>
      transaction.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },
  
  // State Management
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
})); 