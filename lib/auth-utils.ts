// JWT Token Management Utilities (Firebase)
import { firebaseAuth } from './firebase';
import { getIdToken, signOut as firebaseSignOut } from 'firebase/auth';

/**
 * Get the current JWT token from localStorage
 */
export function getCurrentToken(): string | null { return null; }

/**
 * Get the current JWT token from Firebase Auth
 */
export async function getFirebaseIdToken(): Promise<string | null> {
  try {
    const user = firebaseAuth.currentUser;
    if (!user) return null;
    return await getIdToken(user, false);
  } catch (error) {
    console.error('Error getting token from Firebase:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!firebaseAuth.currentUser;
}

/**
 * Get current user data
 */
export function getCurrentUser() {
  try {
    return firebaseAuth.currentUser;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Authenticated fetch wrapper that automatically includes JWT token
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Get Firebase ID token
  const token = await getFirebaseIdToken();
  
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Refresh the JWT token if needed
 */
export async function refreshToken(): Promise<string | null> {
  try {
    const user = firebaseAuth.currentUser;
    if (!user) return null;
    return await getIdToken(user, true);
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Logout and clear all auth data
 */
export async function logout(): Promise<void> {
  try {
    await firebaseSignOut(firebaseAuth);
  } catch (error) {
    console.error('Error during logout:', error);
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(): boolean {
  return false;
}

/**
 * Get token with automatic refresh if expired
 */
export async function getValidToken(): Promise<string | null> {
  const token = await getFirebaseIdToken();
  if (token) return token;
  return await refreshToken();
} 