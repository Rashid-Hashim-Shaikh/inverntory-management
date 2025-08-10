import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { CartItem } from './store/cart';

// Firebase client config (public)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export const firestoreDb = getFirestore(app);

// Logical collection names
export const TABLES = {
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  SUPPLIERS: 'suppliers',
  TRANSACTIONS: 'transactions',
} as const;

// Keep the Database interface since the rest of the app may use these types
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
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
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
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
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
        Update: Partial<Database['public']['Tables']['suppliers']['Insert']>;
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
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
    };
  };
}
