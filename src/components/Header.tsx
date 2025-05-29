
"use client";

import Image from 'next/image';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { logout, currentUser } = useAuth();

  return (
    <header className="bg-gray-800 text-primary-foreground p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Image 
            src="/logos/wytech.png" 
            alt="Company Logo" 
            width={80} 
            height={80}
            data-ai-hint="company logo"
          />
          <h1 className="text-2xl px-8 font-semibold">App de mantenimiento</h1>
        </div>
        {currentUser && (
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm hidden sm:inline">Bienvenido, {currentUser.username} ({currentUser.id})</span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground">
              <LogOut className="mr-1 h-4 w-4" />
              Salir
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
