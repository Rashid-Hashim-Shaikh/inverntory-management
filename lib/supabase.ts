import { createClient } from '@supabase/supabase-js';
import { CartItem } from './store/cart';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table names
export const TABLES = {
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  SUPPLIERS: 'suppliers',
  TRANSACTIONS: 'transactions',
} as const;

// Database types with user_id
export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          description: string;
          price: number;
          quantity: number;
          unit: string;
          category: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          price: number;
          quantity: number;
          unit: string;
          category: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          price?: number;
          quantity?: number;
          unit?: string;
          category?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          name: string;
          email: string;
          mobile: string;
          address: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          mobile: string;
          address: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          mobile?: string;
          address?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          email: string;
          mobile: string;
          address: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          mobile: string;
          address: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          mobile?: string;
          address?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          type: 'sale' | 'purchase';
          invoice_number: string;
          date: string;
          customer_id?: string;
          supplier_id?: string;
          items: CartItem[];
          total_amount: number;
          total_items: number;
          total_quantity: number;
          status: 'completed' | 'pending' | 'cancelled';
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: 'sale' | 'purchase';
          invoice_number: string;
          date: string;
          customer_id?: string;
          supplier_id?: string;
          items: CartItem[];
          total_amount: number;
          total_items: number;
          total_quantity: number;
          status?: 'completed' | 'pending' | 'cancelled';
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: 'sale' | 'purchase';
          invoice_number?: string;
          date?: string;
          customer_id?: string;
          supplier_id?: string;
          items?: CartItem[];
          total_amount?: number;
          total_items?: number;
          total_quantity?: number;
          status?: 'completed' | 'pending' | 'cancelled';
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

 