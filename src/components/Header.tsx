
"use client";

import { Building2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { logout, currentUser } = useAuth();

  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 size={28} />
          <h1 className="text-2xl font-semibold">Desktop Maintenance Hub</h1>
        </div>
        {currentUser && (
          <div className="flex items-center gap-2">
            <span className="text-sm hidden sm:inline">Welcome, {currentUser.username} ({currentUser.role})</span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground">
              <LogOut className="mr-1 h-4 w-4" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
