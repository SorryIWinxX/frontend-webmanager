"use client";

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { syncTablesFromSAP } from '@/app/actions';
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, Database } from 'lucide-react';

export function SyncTab() {
  const [isSyncing, startTransition] = useTransition();
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncSummary, setSyncSummary] = useState<any>(null);
  const [syncDetails, setSyncDetails] = useState<any>(null);
  const [synchronizedItems, setSynchronizedItems] = useState<string[]>([]);
  const [firebaseLogId, setFirebaseLogId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSync = () => {
    setError(null);
    setSyncStatus(null);
    setSyncSummary(null);
    setSyncDetails(null);
    setSynchronizedItems([]);
    setFirebaseLogId(null);
    startTransition(async () => {
      try {
        const result = await syncTablesFromSAP();
        if (result.success) {
          setSyncStatus(result.message);
          setSyncSummary(result.data?.summary || null);
          setSyncDetails(result.data?.details || null);
          toast({
            title: "Sincronización exitosa",
            description: result.message,
            variant: "default",
          });
        } else {
          setError(result.message);
          setSyncSummary(result.data?.summary || null);
          setSyncDetails(result.data?.details || null);
          toast({
            title: "Sincronización fallida o parcial",
            description: result.message,
            variant: "destructive",
          });
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(errorMessage);
        toast({
          title: "Error de sincronización",
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
            Consulta a SAP y sincroniza los datos con la base de datos local.
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
              <p>Por favor espere, la sincronización puede tardar unos momentos.</p>
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
          {/* Resumen general */}
          {syncSummary && (
            <div className="mt-4 w-full max-w-2xl">
              <h3 className="text-lg font-semibold mb-2 text-center">Resumen general</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-secondary/50 p-4 rounded-md text-secondary-foreground">
                <div className="text-center">
                  <div className="font-bold text-xl">{syncSummary.totalProcessedItems}</div>
                  <div className="text-xs">Procesados</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xl">{syncSummary.totalCreatedCount}</div>
                  <div className="text-xs">Creados</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xl">{syncSummary.totalUpdatedCount}</div>
                  <div className="text-xs">Actualizados</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-xl">{syncSummary.totalErrorCount}</div>
                  <div className="text-xs">Errores</div>
                </div>
              </div>
            </div>
          )}
          {/* Detalle por tabla */}
          {syncDetails && (
            <div className="mt-6 w-full max-w-2xl">
              <h3 className="text-lg font-semibold mb-2 text-center">Detalle por tabla</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(syncDetails).map(([table, detail]: any) => (
                  <div key={table} className="border rounded-md p-4 bg-muted/30">
                    <div className="font-bold text-md mb-1 capitalize">Tabla: {table}</div>
                    <div className="text-sm mb-2">{detail.message}</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="text-center">
                        <div className="font-bold">{detail.data?.processedItems ?? 0}</div>
                        <div className="text-xs">Procesados</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold ${detail.data?.createdCount > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>{detail.data?.createdCount ?? 0}</div>
                        <div className="text-xs">Creados</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{detail.data?.updatedCount ?? 0}</div>
                        <div className="text-xs">Actualizados</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold ${detail.data?.errorCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{detail.data?.errorCount ?? 0}</div>
                        <div className="text-xs">Errores</div>
                      </div>
                    </div>
                    {detail.data?.createdCount === 0 && (
                      <div className="mt-2 text-xs text-muted-foreground text-center">No hubo nuevos registros en esta tabla.</div>
                    )}
                    {detail.data?.createdCount > 0 && (
                      <div className="mt-2 text-xs text-green-700 text-center">Se crearon {detail.data.createdCount} nuevos registros.</div>
                    )}
                  </div>
                ))}
              </div>
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
