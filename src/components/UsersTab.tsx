"use client";

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getUsers, addUser, deleteUser } from '@/app/actions';
import type { User, UserRole } from '@/types';
import { Loader2, UserPlus, Users as UsersIcon, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const UserFormSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(["admin", "operator"], { required_error: "Role is required." }),
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
      password: "",
      role: "operator",
    },
  });

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

  const onSubmit = async (data: UserFormData) => {
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('password', data.password);
    formData.append('role', data.role);

    startSubmitting(async () => {
      const result = await addUser(formData);
      if (result.success) {
        toast({
          title: "User Added",
          description: result.message,
        });
        fetchUsers();
        form.reset();
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
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
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
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-bold text-primary flex items-center"><UsersIcon className="mr-2 h-8 w-8" />User Management</CardTitle>
              <CardDescription className="text-lg">
                Create and manage user accounts for the application.
              </CardDescription>
            </div>
            <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md">
                  <UserPlus className="mr-2 h-5 w-5" /> Add New User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new user account.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">Username</FormLabel>
                          <FormControl className="col-span-3">
                            <Input {...field} placeholder="john.doe" />
                          </FormControl>
                          <FormMessage className="col-span-3 col-start-2" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">Password</FormLabel>
                          <FormControl className="col-span-3">
                            <Input type="password" {...field} placeholder="••••••••" />
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
                           <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl className="col-span-3">
                               <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="operator">Operator</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="col-span-3 col-start-2" />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                       <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add User
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
              <p className="ml-4 text-lg text-muted-foreground">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
             <div className="text-center py-10">
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No users found.</p>
                <p className="text-sm text-muted-foreground">Click "Add New User" to create the first account.</p>
              </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" aria-label="Edit user" disabled> {/* Edit is illustrative */}
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          aria-label="Delete user"
                          onClick={() => handleDeleteUser(user.id, user.username)}
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
      </Card>
    </div>
  );
}
