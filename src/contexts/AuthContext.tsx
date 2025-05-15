
"use client";

import type { User } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser as loginUserAction, changePassword as changePasswordAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (formData: FormData) => Promise<{ success: boolean; message: string; error?: string; user?: User }>;
  logout: () => void;
  updateCurrentUser: (updatedUser: User) => void;
  forcePasswordChange: (userId: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser) as User;
      setCurrentUser(parsedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (formData: FormData) => {
    setIsLoading(true);
    const result = await loginUserAction(formData);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      localStorage.setItem('currentUser', JSON.stringify(result.user));
    } else {
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
    }
    setIsLoading(false);
    // Ensure the full result, including user, is passed back
    return { success: result.success, message: result.message, error: result.error, user: result.user };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  const updateCurrentUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };
  
  const forcePasswordChange = async (userId: string, newPassword: string) => {
    const result = await changePasswordAction(userId, newPassword);
    if (result.success && currentUser) {
      // Only update forcePasswordChange if it was previously true and user is admin
      // Operators don't use this flow.
      if (currentUser.role === 'admin' && currentUser.forcePasswordChange) {
        const updatedUser = { ...currentUser, forcePasswordChange: false };
        updateCurrentUser(updatedUser);
      }
    }
    return result;
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout, updateCurrentUser, forcePasswordChange }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
