
"use client";

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface ChangePasswordDialogProps {
  user: User; // Expecting the full user object, but will only proceed if admin and forcePasswordChange is true
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ user, open, onOpenChange }: ChangePasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, startChangeTransition] = useTransition();
  const { toast } = useToast();
  const { forcePasswordChange: authForcePasswordChange } = useAuth(); // Renamed to avoid conflict

  // Only proceed if user is admin and needs to change password
  const shouldRenderDialog = user.role === 'admin' && user.forcePasswordChange;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shouldRenderDialog) return; // Should not happen if dialog is conditionally rendered

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure both password fields are identical.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    startChangeTransition(async () => {
      const result = await authForcePasswordChange(user.id, newPassword);
      if (result.success) {
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully.",
        });
        onOpenChange(false); 
      } else {
        toast({
          title: "Error Changing Password",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };
  
  if (!shouldRenderDialog) {
    return null; // Don't render the dialog if not applicable
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e)=> e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Change Your Password</DialogTitle>
          <DialogDescription>
            For security reasons, you must change your temporary admin password before proceeding.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-1">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              disabled={isChanging}
              minLength={6}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={isChanging}
              minLength={6}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isChanging} className="w-full">
              {isChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
