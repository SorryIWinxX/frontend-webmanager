
"use client";

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { syncFromSAP } from '@/app/actions';
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, Database } from 'lucide-react';

export function SyncTab() {
  const [isSyncing, startTransition] = useTransition();
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [synchronizedItems, setSynchronizedItems] = useState<string[]>([]);
  const [firebaseLogId, setFirebaseLogId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSync = () => {
    setError(null);
    setSyncStatus(null);
    setSynchronizedItems([]);
    setFirebaseLogId(null);
    startTransition(async () => {
      try {
        const result = await syncFromSAP();
        if (result.success) {
          setSyncStatus(result.message);
          setSynchronizedItems(result.synchronizedData || []);
          if (result.firebaseLogId) {
            setFirebaseLogId(result.firebaseLogId);
          }
          toast({
            title: "Synchronization Successful",
            description: result.message,
            variant: "default",
          });
        } else {
          setError(result.message);
          setSynchronizedItems(result.synchronizedData || []); // Show items even on partial failure
          toast({
            title: "Synchronization Partially Failed or Failed",
            description: result.message,
            variant: "destructive",
          });
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(errorMessage);
        toast({
          title: "Synchronization Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="container mx-auto p-0 md:p-2 lg:p-4 flex flex-col items-center">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Sincronizacion de datos</CardTitle>
          <CardDescription className="text-lg">
            Consulta a SAP y sincroniza los datos con la base de datos local (Firebase).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <Button
            size="lg"
            className="w-full max-w-xs text-lg py-8 bg-accent hover:bg-accent/90 text-accent-foreground transition-transform hover:scale-105"
            onClick={handleSync}
            disabled={isSyncing}
            aria-live="polite"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-6 w-6" />
                Sincronizar con SAP
              </>
            )}
          </Button>
          
          {isSyncing && (
            <div className="text-center text-muted-foreground">
              <p>Please wait, fetching data and writing to Firebase can take a few moments.</p>
              <div className="mt-2 w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md w-full text-center">
              <AlertTriangle className="inline-block mr-2 h-5 w-5" />
              {error}
            </div>
          )}
          {syncStatus && !error && (
            <div className="mt-4 p-4 bg-green-500/10 text-green-700 border border-green-500/20 rounded-md w-full text-center">
              <CheckCircle className="inline-block mr-2 h-5 w-5" />
              {syncStatus}
            </div>
          )}
          {synchronizedItems.length > 0 && (
            <div className="mt-4 w-full">
              <h3 className="text-lg font-semibold mb-2 text-center">Nombres de tablas sincronizadas:</h3>
              <ul className="list-disc list-inside bg-secondary/50 p-4 rounded-md space-y-1 text-secondary-foreground">
                {synchronizedItems.map(item => (
                  <li key={item} className="text-sm">{item}</li>
                ))}
              </ul>
            </div>
          )}
           {firebaseLogId && !error && (
            <div className="mt-2 text-sm text-muted-foreground text-center flex items-center justify-center">
              <Database className="mr-1 h-4 w-4" />
              <span>Firebase Log ID: {firebaseLogId}</span>
            </div>
          )}
        </CardContent>
    </div>
  );
}
