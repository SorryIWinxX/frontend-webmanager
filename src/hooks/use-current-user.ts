import { useState, useEffect } from 'react';
import type { User } from '@/types';
import { getCurrentUser, getCurrentUserId } from '@/lib/auth-utils';

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    const currentUserId = getCurrentUserId();
    
    setUser(currentUser);
    setUserId(currentUserId);
    setIsLoading(false);

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = () => {
      const updatedUser = getCurrentUser();
      const updatedUserId = getCurrentUserId();
      setUser(updatedUser);
      setUserId(updatedUserId);
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    user,
    userId,
    isLoading,
    isLoggedIn: user !== null
  };
} 