
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
import { Loader2, UserPlus, Users as UsersIcon, Trash2, Edit, AlertTriangle, Copy, Briefcase } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const predefinedWorkstations = [
  'Assembly Line 1', 
  'Assembly Line 2', 
  'Packaging Station 1', 
  'Packaging Station 2', 
  'Quality Control', 
  'Warehouse Section A',
  'Maintenance Bay 1',
  'Machining Center Alpha',
  'Welding Booth 3',
  'Logistics Hub',
];

const UserFormSchema = z.object({
  username: z.string().min(3, { message: "Username (Cedula for operators) must be at least 3 characters." }),
  role: z.enum(["admin", "operator"], { required_error: "Role is required." }),
  workstation: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === "operator" && (!data.workstation || data.workstation.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Workstation is required for operator role.",
      path: ["workstation"],
    });
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
    },
  });

  const watchedRole = form.watch("role");

  useEffect(() => {
    if (watchedRole === "admin") {
      form.setValue("workstation", ""); // Clear workstation if role changes to admin
      form.clearErrors("workstation"); // Clear any workstation errors
    }
  }, [watchedRole, form]);

  const fetchUsers = () => {
    startLoadingUsers(async () => {
      try {
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
      } catch (e) {
        toast({
          title: "Error fetching users",
          description: e instanceof Error ? e.message : "An unknown error occurred.",
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
      toast({ title: "Copied!", description: "Password copied to clipboard." });
    }).catch(err => {
      toast({ title: "Copy Failed", description: "Could not copy password.", variant: "destructive" });
    });
  };


  const onSubmit = async (data: UserFormData) => {
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('role', data.role);
    if (data.role === "operator" && data.workstation) {
      formData.append('workstation', data.workstation);
    }

    startSubmitting(async () => {
      const result = await addUser(formData);
      if (result.success) {
        toast({
          title: "User Added",
          description: (
            <div>
              <p>{result.message}</p>
              {result.generatedPassword && data.role === "admin" && (
                <div className="mt-2">
                  Generated Password: 
                  <span className="font-mono bg-muted p-1 rounded mx-1">{result.generatedPassword}</span>
                  <Button variant="ghost" size="icon" className="ml-1 h-6 w-6" onClick={() => copyToClipboard(result.generatedPassword!)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground">Admin user will be forced to change this on first login.</p>
                </div>
              )}
            </div>
          ),
          duration: 10000, 
        });
        fetchUsers();
        form.reset({ username: "", role: "operator", workstation: "" });
        setIsAddUserDialogOpen(false);
      } else {
        if (result.errors) {
          result.errors.forEach(err => {
            form.setError(err.path[0] as keyof UserFormData, { message: err.message });
          });
        } else {
           toast({
            title: "Error adding user",
            description: result.message,
            variant: "destructive",
          });
        }
      }
    });
  };
  
  const handleDeleteUser = (userId: string, username: string) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`);
    if (!isConfirmed) {
      return;
    }
    startDeleting(async () => {
      const result = await deleteUser(userId);
      toast({
        title: result.success ? "User Deleted" : "Deletion Failed",
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
                Crea un nuevo usuario o elimina uno existente.
              </CardDescription>
            </div>
            <Dialog open={isAddUserDialogOpen} onOpenChange={(open) => {
              setIsAddUserDialogOpen(open);
              if (!open) form.reset({ username: "", role: "operator", workstation: "" });
            }}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md">
                  <UserPlus className="mr-2 h-5 w-5" /> Nuevo usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    Administradores se le va generar contraseña y para los operadores solamente entran con la cedula.
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
                            <Input {...field} placeholder="Cédula o Admin" />
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
                          <FormLabel className="text-right">Role</FormLabel>
                           <Select 
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    if (value === "admin") {
                                        form.setValue("workstation", "");
                                        form.clearErrors("workstation");
                                    }
                                }} 
                                defaultValue={field.value} 
                                value={field.value}
                            >
                            <FormControl className="col-span-3">
                               <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
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
                            <FormLabel className="text-right">Puesto de trabajo</FormLabel>
                            <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                value={field.value || ""} // Ensure value is not undefined for Select
                            >
                              <FormControl className="col-span-3">
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un puesto de trabajo" />
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
              <p className="ml-4 text-lg text-muted-foreground">Cargando usuarios...</p>
            </div>
          ) : users.length === 0 ? (
             <div className="text-center py-10">
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No se ha encontrado ningun usuario.</p>
                <p className="text-sm text-muted-foreground">Crea un nuevo usuario.</p>
              </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario/Cédula</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Puesto de trabajo</TableHead>
                    <TableHead>Contraseña</TableHead>
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
                      <TableCell>
                        <Badge variant={user.forcePasswordChange ? "destructive" : "secondary"} className="shadow-sm">
                          {user.forcePasswordChange ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" aria-label="Edit user" disabled> {/* Edit is illustrative */}
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          aria-label="Delete user"
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          disabled={isDeleting || user.username === 'admin'} 
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

