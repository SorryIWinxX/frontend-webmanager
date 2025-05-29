
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { currentUser, isLoading, logout } = useAuth();
  const [isPasswordChangeDialogOpen, setIsPasswordChangeDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!currentUser) {
        router.replace('/login');
      } 
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || (!currentUser && typeof window !== 'undefined')) {
    // Show loading spinner while auth state is being determined or if redirecting
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  // If currentUser is null and not loading, means redirect should have happened or will happen.
  // This check prevents rendering children if user is not authenticated.
  if (!currentUser) {
    return null; // Or a minimal loading/redirecting message
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      {isPasswordChangeDialogOpen && currentUser && (
        <ChangePasswordDialog 
          user={currentUser} 
          open={isPasswordChangeDialogOpen} 
          onOpenChange={setIsPasswordChangeDialogOpen}
        />
      )}
      <main className={`flex-grow container mx-auto px-0 sm:px-4 py-6 ${isPasswordChangeDialogOpen ? 'opacity-20 pointer-events-none' : ''}`}>
        {children}
      </main>
      <footer className={`text-center p-4 text-muted-foreground text-sm border-t ${isPasswordChangeDialogOpen ? 'opacity-20 pointer-events-none' : ''}`}>
        © {new Date().getFullYear()} Desktop Maintenance Hub. All rights reserved.
      </footer>
    </div>
  );
}

