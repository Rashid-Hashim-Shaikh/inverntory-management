// JWT Token Management Utilities
import { supabase } from './supabase';

/**
 * Get the current JWT token from localStorage
 */
export function getCurrentToken(): string | null {
  try {
    const tokenData = localStorage.getItem('supabase.auth.token');
    if (!tokenData) return null;
    
    const parsed = JSON.parse(tokenData);
    return parsed.access_token || null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getCurrentToken() !== null;
}

/**
 * Get current user data
 */
export function getCurrentUser() {
  try {
    const userData = localStorage.getItem('supabase.auth.user');
    if (!userData) return null;
    
    return JSON.parse(userData);
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
  const token = getCurrentToken();
  
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
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
    return data.session?.access_token || null;
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
    await supabase.auth.signOut();
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.user');
  } catch (error) {
    console.error('Error during logout:', error);
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(): boolean {
  try {
    const tokenData = localStorage.getItem('supabase.auth.token');
    if (!tokenData) return true;
    
    const parsed = JSON.parse(tokenData);
    if (!parsed.expires_at) return true;
    
    const expiryTime = parsed.expires_at * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    
    return currentTime >= expiryTime;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return true;
  }
}

/**
 * Get token with automatic refresh if expired
 */
export async function getValidToken(): Promise<string | null> {
  const token = getCurrentToken();
  
  if (!token) {
    return null;
  }
  
  if (isTokenExpired()) {
    console.log('Token expired, refreshing...');
    return await refreshToken();
  }
  
  return token;
} 