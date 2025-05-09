
"use server";

import type { Notice, User, UserRole } from "@/types";
import { z } from "zod";

// Simulate a database or external service
let notices: Notice[] = [
  { 
    id: "1", 
    title: "Machine A Maintenance", 
    description: "Scheduled maintenance for Machine A, requires oil change and filter replacement.", 
    date: new Date().toISOString(), 
    status: "Pending", 
    imageUrl: "https://picsum.photos/seed/notice1/300/200",
    detailedInfo: "Machine A (Serial: XZ-7890) requires its 500-hour maintenance. Tasks include: full oil change (use Mobil DTE 25), hydraulic filter replacement (Part No. HF-123), lubrication of all joints, and system diagnostics check. Estimated downtime: 4 hours. Technician: John Doe."
  },
  { 
    id: "2", 
    title: "Sensor B2 Offline", 
    description: "Sensor B2 on production line 3 is offline. Investigate immediately.", 
    date: new Date(Date.now() - 86400000).toISOString(), 
    status: "Pending", 
    imageUrl: "https://picsum.photos/seed/notice2/300/200",
    detailedInfo: "Sensor B2 (Type: Optical, Model: SENS-OPT-004B) on Line 3, Segment 4, stopped transmitting data at 08:45 AM. Check power supply, data cable, and sensor integrity. Possible replacement needed. Refer to sensor manual Section 5.2 for troubleshooting."
  },
  { 
    id: "3", 
    title: "Software Update Deployed", 
    description: "Control panel software v2.5 has been successfully deployed to all units.", 
    date: new Date(Date.now() - 172800000).toISOString(), 
    status: "Sent", 
    imageUrl: "https://picsum.photos/seed/notice3/300/200",
    detailedInfo: "The mandatory software update to version 2.5 for all CP-5000 control panels was completed on schedule. Key features: improved UI response, new diagnostic tools, and enhanced security protocols. No issues reported post-deployment."
  },
   { 
    id: "4", 
    title: "Coolant Leak Sector C", 
    description: "Reports of a coolant leak near Press Machine P-05 in Sector C.", 
    date: new Date(Date.now() - 2 * 86400000).toISOString(), 
    status: "Pending", 
    imageUrl: "https://picsum.photos/seed/notice4/300/200",
    detailedInfo: "Minor coolant (Type: Ethylene Glycol Mix) leak reported by Operator Smith near Press P-05. Area has been cordoned off. Maintenance required to identify source and repair. Check hoses and seals. ETA for fix: 2 hours."
  },
];

let users: User[] = [
  { id: "1", username: "admin", password: "password", role: "admin", forcePasswordChange: false },
  { id: "2", username: "operator1", password: "password", role: "operator", forcePasswordChange: true },
];

const generateRandomPassword = (length: number = 10): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

const UserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  role: z.enum(["admin", "operator"]),
});

export async function loginUser(formData: FormData): Promise<{ success: boolean; message: string; user?: User; error?: string }> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { success: false, message: "Username and password are required.", error: "Missing credentials" };
  }

  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    // In a real app, never send the password back, even a "hashed" one for this simple case.
    // For this simulation, we send the user object as is.
    // Create a new object to avoid sending the password back to the client
    const { password: _, ...userWithoutPassword } = user;
    return { success: true, message: "Login successful", user: userWithoutPassword };
  } else {
    return { success: false, message: "Invalid username or password.", error: "Invalid credentials" };
  }
}

export async function changePassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    users[userIndex].password = newPassword;
    users[userIndex].forcePasswordChange = false;
    return { success: true, message: "Password changed successfully." };
  }
  return { success: false, message: "User not found." };
}


export async function syncFromSAP(): Promise<{ success: boolean; message: string; synchronizedData?: string[] }> {
  console.log("Attempting to synchronize data from SAP...");
  await new Promise(resolve => setTimeout(resolve, 2000)); 
  
  const synchronizedData = ["Customer_Data_Table", "Product_Inventory_Table", "Maintenance_Schedules_Table"];
  console.log("Data synchronized successfully:", synchronizedData);
  return { success: true, message: "Data successfully synchronized from SAP.", synchronizedData };
}

export async function getNotices(): Promise<Notice[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return notices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function sendNoticesToSAP(noticeIds: string[]): Promise<{ success: boolean; message: string }> {
  console.log("Sending notices to SAP:", noticeIds);
  await new Promise(resolve => setTimeout(resolve, 1500));

  notices = notices.map(notice => {
    if (noticeIds.includes(notice.id)) {
      return { ...notice, status: "Sent" };
    }
    return notice;
  });

  return { success: true, message: `${noticeIds.length} notice(s) sent to SAP successfully.` };
}


export async function getUsers(): Promise<User[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  // Return users without passwords
  return users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
}

export async function addUser(formData: FormData): Promise<{ success: boolean; message: string; errors?: z.ZodIssue[]; generatedPassword?: string }> {
  const rawFormData = {
    username: formData.get('username'),
    role: formData.get('role'),
  };

  const validationResult = UserSchema.safeParse(rawFormData);

  if (!validationResult.success) {
    return { success: false, message: "Validation failed", errors: validationResult.error.issues };
  }
  
  const { username, role } = validationResult.data;

  if (users.find(user => user.username === username)) {
    return { success: false, message: "Username already exists." };
  }

  const generatedPassword = generateRandomPassword();
  const newUser: User = {
    id: String(users.length + 1),
    username,
    password: generatedPassword, // Store generated password
    role: role as UserRole,
    forcePasswordChange: true, // New users must change password
  };
  users.push(newUser);
  console.log("User added:", newUser); // Log with password for server console only
  return { success: true, message: `User ${username} added successfully with role ${role}.`, generatedPassword };
}

export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  const initialLength = users.length;
  users = users.filter(user => user.id !== userId);
  if (users.length < initialLength) {
    return { success: true, message: "User deleted successfully." };
  }
  return { success: false, message: "User not found." };
}
