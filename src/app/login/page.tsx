
"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();
  const [isLoggingIn, startLoginTransition] = useTransition();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('username', username);
    // Password might not be needed for operators, but send it anyway. 
    // The backend action will decide if it's necessary.
    formData.append('password', password);

    startLoginTransition(async () => {
      const result = await login(formData);
      if (result.success) {
        toast({
          title: "Login Successful",
          description: "Welcome!",
        });
        router.replace('/dashboard');
      } else {
        toast({
          title: "Login Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  const isLoading = authLoading || isLoggingIn;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Image 
              src="https://placehold.co/200x80.png?text=App+Logo" 
              alt="Company Logo" 
              width={200} 
              height={80} 
              data-ai-hint="app logo" 
            />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">App de mantenimiento</CardTitle>
          <CardDescription className="text-lg">Ingresa tus credenciales (Operadores solo Cédula)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Cédula / Usuario Admin</Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingrese su Cédula o Usuario Admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña (Solo para Admins)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingrese su contraseña (si es Admin)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // Not strictly required on client as backend handles it
                disabled={isLoading}
                className="text-base"
              />
            </div>
            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-6 w-6" />
              )}
              Ingresar
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
           © {new Date().getFullYear()} Maintenance Hub.
        </CardFooter>
      </Card>
    </div>
  );
}
