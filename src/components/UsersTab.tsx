"use client";

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Reporter } from '@/types';
import { Loader2, UserPlus, Users as UsersIcon, Trash2, Edit, AlertTriangle, Briefcase } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getReporters, addReporter, deleteReporter } from '@/app/actions';

const ReporterFormSchema = z.object({
  cedula: z.string().min(3, { message: "La cédula debe tener al menos 3 caracteres." }),
  puestoTrabajo: z.string().min(1, { message: "El puesto de trabajo es requerido." }),
});

type ReporterFormData = z.infer<typeof ReporterFormSchema>;

export function UsersTab() {
  const [reporters, setReporters] = useState<Reporter[]>([]);
  const [isLoadingReporters, startLoadingReporters] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isAddReporterDialogOpen, setIsAddReporterDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<ReporterFormData>({
    resolver: zodResolver(ReporterFormSchema),
    defaultValues: {
      cedula: "",
      puestoTrabajo: "",
    },
  });

  const fetchReporters = () => {
    startLoadingReporters(async () => {
      try {
        const fetchedReporters = await getReporters();
        setReporters(fetchedReporters);
      } catch (e) {
        toast({
          title: "Error al cargar reporteros",
          description: e instanceof Error ? e.message : "Ocurrió un error desconocido.",
          variant: "destructive",
        });
      }
    });
  };

  useEffect(() => {
    fetchReporters();
  }, []);

  const onSubmit = async (data: ReporterFormData) => {
    const formData = new FormData();
    formData.append('cedula', data.cedula);
    formData.append('puestoTrabajo', data.puestoTrabajo);

    startSubmitting(async () => {
      const result = await addReporter(formData);
      if (result.success && result.reporter) {
        toast({
          title: "Reportero Agregado",
          description: result.message,
          duration: 5000, 
        });
        fetchReporters();
        form.reset({ cedula: "", puestoTrabajo: "" });
        setIsAddReporterDialogOpen(false);
      } else {
        if (result.errors) {
          result.errors.forEach((err: { path: string[]; message: string }) => {
            form.setError(err.path[0] as keyof ReporterFormData, { message: err.message });
          });
        } else {
           toast({
            title: "Error al agregar reportero",
            description: result.message,
            variant: "destructive",
          });
        }
      }
    });
  };
  
  const handleDeleteReporter = (reporterId: string, cedula: string) => {
    const isConfirmed = window.confirm(`¿Está seguro de que desea eliminar al reportero con cédula "${cedula}"? Esta acción no se puede deshacer.`);
    if (!isConfirmed) {
      return;
    }
    startDeleting(async () => {
      const result = await deleteReporter(reporterId);
      toast({
        title: result.success ? "Reportero Eliminado" : "Eliminación Fallida",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      if (result.success) {
        fetchReporters();
      }
    });
  };

  return (
    <div className="container mx-auto p-0 md:p-2 lg:p-4">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-bold text-primary flex items-center"><UsersIcon className="mr-2 h-8 w-8" />Control de Reporteros</CardTitle>
              <CardDescription className="text-lg">
                Crear un nuevo reportero o eliminar uno existente.
              </CardDescription>
            </div>
            <Dialog open={isAddReporterDialogOpen} onOpenChange={(open) => {
              setIsAddReporterDialogOpen(open);
              if (!open) form.reset({ cedula: "", puestoTrabajo: "" });
            }}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md">
                  <UserPlus className="mr-2 h-5 w-5" /> Nuevo reportero
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Nuevo Reportero</DialogTitle>
                  <DialogDescription>
                    Ingrese la cédula y el ID del puesto de trabajo del reportero.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <FormField
                      control={form.control}
                      name="cedula"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">Cédula</FormLabel>
                          <FormControl className="col-span-3">
                            <Input {...field} placeholder="Número de cédula" />
                          </FormControl>
                          <FormMessage className="col-span-3 col-start-2" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="puestoTrabajo"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">Puesto de Trabajo</FormLabel>
                          <FormControl className="col-span-3">
                            <Input {...field} placeholder="ID del puesto de trabajo" type="number" />
                          </FormControl>
                          <FormMessage className="col-span-3 col-start-2" />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                       <DialogClose asChild>
                        <Button type="button" variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Crear reportero
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingReporters ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-4 text-lg text-muted-foreground">Cargando reporteros...</p>
            </div>
          ) : reporters.length === 0 ? (
             <div className="text-center py-10">
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No se encontraron reporteros.</p>
                <p className="text-sm text-muted-foreground">Cree un nuevo reportero.</p>
              </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Puesto de Trabajo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reporters.map((reporter) => (
                    <TableRow key={reporter.id}>
                      <TableCell className="font-medium">{reporter.id}</TableCell>
                      <TableCell className="font-medium">{reporter.cedula}</TableCell>
                      <TableCell className="font-medium">{reporter.puestoTrabajo}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          aria-label="Eliminar reportero"
                          onClick={() => handleDeleteReporter(reporter.id, reporter.cedula)}
                          disabled={isDeleting} 
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
    </div>
  );
}
