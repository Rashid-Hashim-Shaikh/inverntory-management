import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem } from './cart';
import { Customer } from './customers';
import { Supplier } from './suppliers';

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
  createdAt: number;
}

interface TransactionStore {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransactionStatus: (id: string, status: Transaction['status']) => void;
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionsByType: (type: 'sale' | 'purchase') => Transaction[];
  getTransactionsByStatus: (status: Transaction['status']) => Transaction[];
  searchTransactions: (searchTerm: string) => Transaction[];
  clearTransactions: () => void;
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      
      addTransaction: (transactionData) => {
        const newTransaction: Transaction = {
          ...transactionData,
          id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
        };
        
        set((state) => ({
          transactions: [newTransaction, ...state.transactions], // Add to beginning for latest first
        }));
      },
      
      updateTransactionStatus: (id: string, status: Transaction['status']) => {
        set((state) => ({
          transactions: state.transactions.map((transaction) =>
            transaction.id === id ? { ...transaction, status } : transaction
          ),
        }));
      },
      
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
          transaction.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.customer?.mobile.includes(searchTerm) ||
          transaction.supplier?.mobile.includes(searchTerm)
        );
      },
      
      clearTransactions: () => {
        set({ transactions: [] });
      },
    }),
    {
      name: 'inventory-transactions-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ transactions: state.transactions }),
    }
  )
); 