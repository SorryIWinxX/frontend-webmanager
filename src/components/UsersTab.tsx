
"use client";

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from "@/components/ui/badge"; // Added missing import
import { useToast } from '@/hooks/use-toast';
import { getUsers, addUser, deleteUser } from '@/app/actions';
import type { User, UserRole } from '@/types';
import { Loader2, UserPlus, Users as UsersIcon, Trash2, Edit, AlertTriangle, Copy } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const UserFormSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
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

    startSubmitting(async () => {
      const result = await addUser(formData);
      if (result.success) {
        toast({
          title: "User Added",
          description: (
            <div>
              {result.message}
              {result.generatedPassword && (
                <div className="mt-2">
                  Generated Password: 
                  <span className="font-mono bg-muted p-1 rounded mx-1">{result.generatedPassword}</span>
                  <Button variant="ghost" size="icon" className="ml-1 h-6 w-6" onClick={() => copyToClipboard(result.generatedPassword!)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground">User will be forced to change this on first login.</p>
                </div>
              )}
            </div>
          ),
          duration: 10000, // Show toast longer for password
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
    // Basic confirmation, consider using AlertDialog for better UX
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
      <Card className="shadow-xl border-none sm:border sm:rounded-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-bold text-primary flex items-center"><UsersIcon className="mr-2 h-8 w-8" />User Management</CardTitle>
              <CardDescription className="text-lg">
                Create and manage user accounts. New users will receive a generated password and must change it upon first login.
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
                    Enter the username and role. A password will be generated.
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
                    <TableHead>Must Change Password</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
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
                          disabled={isDeleting || user.username === 'admin'} // Prevent admin deletion for safety
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

