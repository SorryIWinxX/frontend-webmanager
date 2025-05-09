"use server";

import type { Notice, User } from "@/types";
import { z } from "zod";

// Simulate a database or external service
let notices: Notice[] = [
  { id: "1", title: "Machine A Maintenance", description: "Scheduled maintenance for Machine A, requires oil change.", date: new Date().toISOString(), status: "Pending" },
  { id: "2", title: "Sensor Offline", description: "Sensor B2 on production line 3 is offline.", date: new Date(Date.now() - 86400000).toISOString(), status: "Pending" },
  { id: "3", title: "Software Update Required", description: "Control panel software needs update to v2.5.", date: new Date(Date.now() - 172800000).toISOString(), status: "Sent" },
];

let users: User[] = [
  { id: "1", username: "admin_user", role: "admin" },
  { id: "2", username: "op_user_1", role: "operator" },
];

const UserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "operator"]),
});

export async function syncFromSAP(): Promise<{ success: boolean; message: string; synchronizedData?: string[] }> {
  console.log("Attempting to synchronize data from SAP...");
  // Simulate API call and data processing
  await new Promise(resolve => setTimeout(resolve, 2000)); 
  
  const synchronizedData = ["Customer_Data_Table", "Product_Inventory_Table", "Maintenance_Schedules_Table"];
  console.log("Data synchronized successfully:", synchronizedData);
  return { success: true, message: "Data successfully synchronized from SAP.", synchronizedData };
}

export async function getNotices(): Promise<Notice[]> {
  // Simulate fetching notices
  await new Promise(resolve => setTimeout(resolve, 500));
  return notices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function sendNoticesToSAP(noticeIds: string[]): Promise<{ success: boolean; message: string }> {
  console.log("Sending notices to SAP:", noticeIds);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));

  let allSuccessful = true;
  notices = notices.map(notice => {
    if (noticeIds.includes(notice.id)) {
      // Simulate potential individual failures if needed, for now all success
      return { ...notice, status: "Sent" };
    }
    return notice;
  });

  if (allSuccessful) {
    return { success: true, message: `${noticeIds.length} notice(s) sent to SAP successfully.` };
  } else {
    // This part is not fully fleshed out for partial success, but serves as a placeholder
    return { success: false, message: "Some notices failed to send. Check logs." };
  }
}


export async function getUsers(): Promise<User[]> {
  // Simulate fetching users
  await new Promise(resolve => setTimeout(resolve, 500));
  return users;
}

export async function addUser(formData: FormData): Promise<{ success: boolean; message: string; errors?: z.ZodIssue[] }> {
  const rawFormData = {
    username: formData.get('username'),
    password: formData.get('password'),
    role: formData.get('role'),
  };

  const validationResult = UserSchema.safeParse(rawFormData);

  if (!validationResult.success) {
    return { success: false, message: "Validation failed", errors: validationResult.error.issues };
  }
  
  const { username, role, password } = validationResult.data;

  if (users.find(user => user.username === username)) {
    return { success: false, message: "Username already exists." };
  }

  const newUser: User = {
    id: String(users.length + 1),
    username,
    role: role as UserRole,
    // In a real app, hash the password here before storing
  };
  users.push(newUser);
  console.log("User added:", newUser);
  return { success: true, message: `User ${username} added successfully with role ${role}.` };
}

export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  const initialLength = users.length;
  users = users.filter(user => user.id !== userId);
  if (users.length < initialLength) {
    return { success: true, message: "User deleted successfully." };
  }
  return { success: false, message: "User not found." };
}
