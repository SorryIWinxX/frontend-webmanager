
"use client";

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { getUsers, addUser, deleteUser } from '@/app/actions';
import type { User, UserRole } from '@/types';
import { Loader2, UserPlus, Users as UsersIcon, Trash2, Edit, AlertTriangle, Copy, Briefcase, KeyRound } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const predefinedWorkstations = [
  'Línea de Ensamblaje 1', 
  'Línea de Ensamblaje 2', 
  'Estación de Empaque 1', 
  'Estación de Empaque 2', 
  'Control de Calidad', 
  'Almacén Sección A',
  'Bahía de Mantenimiento 1',
  'Centro de Maquinado Alpha',
  'Cabina de Soldadura 3',
  'Centro Logístico',
];

// Adjusted schema: password is now optional here, actual requirement handled by API or specific logic for admin
const UserFormSchema = z.object({
  username: z.string().min(3, { message: "El nombre de usuario (Cédula para operadores) debe tener al menos 3 caracteres." }),
  role: z.enum(["admin", "operator"], { required_error: "El rol es requerido." }),
  workstation: z.string().optional(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres.").optional().or(z.literal('')), // Optional, but if provided, min 6 chars
}).superRefine((data, ctx) => {
  if (data.role === "operator" && (!data.workstation || data.workstation.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "El puesto de trabajo es requerido para el rol de operario.",
      path: ["workstation"],
    });
  }
  if (data.role === "admin" && !data.password) {
    // This client-side check can be debated. The API should be the source of truth.
    // For now, we'll require it visually if admin is selected.
    // The external API will ultimately decide if it's required for creation.
    // ctx.addIssue({
    //   code: z.ZodIssueCode.custom,
    //   message: "La contraseña es requerida para el rol de administrador.",
    //   path: ["password"],
    // });
  }
});

type UserFormData = z.infer<typeof UserFormSchema>;

export function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, startLoadingUsers] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<UserFormData>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: {
      username: "",
      role: "operator",
      workstation: "",
      password: "",
    },
  });

  const watchedRole = form.watch("role");

  useEffect(() => {
    if (watchedRole === "admin") {
      form.setValue("workstation", ""); 
      form.clearErrors("workstation"); 
    } else {
      form.setValue("password", "");
      form.clearErrors("password");
    }
  }, [watchedRole, form]);

  const fetchUsers = () => {
    startLoadingUsers(async () => {
      try {
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
      } catch (e) {
        toast({
          title: "Error al cargar usuarios",
          description: e instanceof Error ? e.message : "Ocurrió un error desconocido.",
          variant: "destructive",
        });
      }
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "¡Copiado!", description: "Contraseña copiada al portapapeles." });
    }).catch(err => {
      toast({ title: "Error al copiar", description: "No se pudo copiar la contraseña.", variant: "destructive" });
    });
  };


  const onSubmit = async (data: UserFormData) => {
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('role', data.role);
    if (data.role === "operator" && data.workstation) {
      formData.append('workstation', data.workstation);
    }
    // Password for admin is sent if provided. External API handles generation/forcing change.
    if (data.role === "admin" && data.password) {
      formData.append('password', data.password);
    }


    startSubmitting(async () => {
      const result = await addUser(formData);
      if (result.success && result.user) {
        toast({
          title: "Usuario Agregado",
          description: (
            <div>
              <p>{result.message}</p>
              {/* Displaying generated password depends on API returning it. */}
              {/* For now, assume API handles password and informs user if needed. */}
              {result.user.role === "admin" && result.user.forcePasswordChange && (
                 <p className="text-xs text-muted-foreground mt-1">
                    El administrador deberá cambiar su contraseña al iniciar sesión.
                 </p>
              )}
            </div>
          ),
          duration: result.user.role === "admin" && result.user.forcePasswordChange ? 10000 : 5000, 
        });
        fetchUsers();
        form.reset({ username: "", role: "operator", workstation: "", password: "" });
        setIsAddUserDialogOpen(false);
      } else {
        if (result.errors) {
          result.errors.forEach(err => {
            form.setError(err.path[0] as keyof UserFormData, { message: err.message });
          });
        } else {
           toast({
            title: "Error al agregar usuario",
            description: result.message,
            variant: "destructive",
          });
        }
      }
    });
  };
  
  const handleDeleteUser = (userId: string, username: string) => {
    // Basic client-side check, the API should enforce this too.
    if (username.toLowerCase() === 'admin' && users.length === 1) {
        toast({
            title: "Acción no permitida",
            description: "No se puede eliminar el único usuario administrador.",
            variant: "destructive",
        });
        return;
    }

    const isConfirmed = window.confirm(`¿Está seguro de que desea eliminar al usuario "${username}"? Esta acción no se puede deshacer.`);
    if (!isConfirmed) {
      return;
    }
    startDeleting(async () => {
      const result = await deleteUser(userId);
      toast({
        title: result.success ? "Usuario Eliminado" : "Eliminación Fallida",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      if (result.success) {
        fetchUsers();
      }
    });
  };

  return (
    <div className="container mx-auto p-0 md:p-2 lg:p-4">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-bold text-primary flex items-center"><UsersIcon className="mr-2 h-8 w-8" />Control de usuarios</CardTitle>
              <CardDescription className="text-lg">
                Crear un nuevo usuario o eliminar uno existente. Los usuarios son gestionados por una API externa.
              </CardDescription>
            </div>
            <Dialog open={isAddUserDialogOpen} onOpenChange={(open) => {
              setIsAddUserDialogOpen(open);
              if (!open) form.reset({ username: "", role: "operator", workstation: "", password: "" });
            }}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md">
                  <UserPlus className="mr-2 h-5 w-5" /> Nuevo usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]"> {/* Increased width for password field */}
                <DialogHeader>
                  <DialogTitle>Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    Para administradores, ingrese una contraseña inicial. Para operarios, solo se requiere la cédula y puesto de trabajo.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">Usuario</FormLabel>
                          <FormControl className="col-span-3">
                            <Input {...field} placeholder="Cédula o Usuario Admin" />
                          </FormControl>
                          <FormMessage className="col-span-3 col-start-2" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">Rol</FormLabel>
                           <Select 
                                onValueChange={(value) => {
                                    field.onChange(value);
                                }} 
                                defaultValue={field.value} 
                                value={field.value}
                            >
                            <FormControl className="col-span-3">
                               <SelectTrigger>
                                <SelectValue placeholder="Seleccione un rol" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="operator">Operario</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="col-span-3 col-start-2" />
                        </FormItem>
                      )}
                    />
                    {watchedRole === 'operator' && (
                      <FormField
                        control={form.control}
                        name="workstation"
                        render={({ field }) => (
                          <FormItem className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">Puesto</FormLabel>
                            <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                value={field.value || ""}
                            >
                              <FormControl className="col-span-3">
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione un puesto" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {predefinedWorkstations.map(ws => (
                                  <SelectItem key={ws} value={ws}>{ws}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="col-span-3 col-start-2" />
                          </FormItem>
                        )}
                      />
                    )}
                     {watchedRole === 'admin' && (
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="grid grid-cols-4 items-center gap-4">
                            <FormLabel className="text-right">Contraseña</FormLabel>
                            <FormControl className="col-span-3">
                              <Input type="password" {...field} placeholder="Contraseña inicial para admin" />
                            </FormControl>
                            <FormMessage className="col-span-3 col-start-2" />
                          </FormItem>
                        )}
                      />
                    )}
                    <DialogFooter>
                       <DialogClose asChild>
                        <Button type="button" variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Crear usuario
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-4 text-lg text-muted-foreground">Cargando usuarios desde API externa...</p>
            </div>
          ) : users.length === 0 ? (
             <div className="text-center py-10">
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No se encontraron usuarios en la API externa.</p>
                <p className="text-sm text-muted-foreground">Cree un nuevo usuario.</p>
              </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario/Cédula</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Puesto de trabajo</TableHead>
                    <TableHead className="text-center">Cambio Contraseña Pendiente</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell className="capitalize">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="shadow-sm">
                            {user.role}
                        </Badge>
                      </TableCell>
                       <TableCell>
                        {user.role === 'operator' ? (
                            user.workstation ? <span className="flex items-center"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />{user.workstation}</span> : <span className="text-muted-foreground italic">N/A</span>
                        ) : (
                            <span className="text-muted-foreground italic">N/A</span>
                        )}
                        </TableCell>
                      <TableCell className="text-center">
                        {user.role === 'admin' ? (
                          user.forcePasswordChange ? 
                            <Badge variant={"destructive"} className="shadow-sm">Sí</Badge> :
                            <Badge variant={"secondary"} className="shadow-sm">No</Badge>
                        ) : (
                          <Badge variant="outline" className="shadow-sm text-muted-foreground">No Aplica</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" aria-label="Editar usuario" disabled> {/* Edit is illustrative, needs API endpoint */}
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          aria-label="Eliminar usuario"
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          disabled={isDeleting || (user.username.toLowerCase() === 'admin' && user.id === "1")} // Example: protect user with ID "1" if it's a primary admin
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
