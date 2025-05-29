import type { User } from '@/types';

/**
 * Get the current user from localStorage
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const storedUser = localStorage.getItem('currentUser');
  if (!storedUser) return null;
  
  try {
    return JSON.parse(storedUser) as User;
  } catch {
    return null;
  }
}

/**
 * Get the current user ID
 */
export function getCurrentUserId(): string | null {
  const user = getCurrentUser();
  return user?.id || null;
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

/**
 * Clear user session
 */
export function clearUserSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
  }
} 