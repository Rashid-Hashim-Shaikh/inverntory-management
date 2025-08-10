'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { firebaseAuth } from './firebase';
import {
  User,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  session: string | null; // Firebase ID token
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser: User | null) => {
      setUser(fbUser);
      const token = fbUser ? await fbUser.getIdToken() : null;
      setSession(token);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(firebaseAuth);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 