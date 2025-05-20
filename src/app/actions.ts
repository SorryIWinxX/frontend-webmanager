
"use server";

import type { Notice, User, UserRole, MaintenanceNoticeAPI, SAPOrder, NoticeStatus } from "@/types";
import { CreateMaintenanceNoticeInput, UpdateMaintenanceNoticeInput } from "@/lib/schemas";
import { z } from "zod";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Store MaintenanceNoticeAPI objects internally
let noticesStore: MaintenanceNoticeAPI[] = [
  { 
    id: "1", 
    shortText: "Machine A Maintenance", 
    causeText: "Scheduled maintenance for Machine A, requires oil change and filter replacement.", 
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(), 
    status: "Pending", 
    priority: "Medium",
    reporterName: "Operator Joe",
    equipmentNumber: "EQ-001",
    functionalLocation: "FL-A1",
    imageUrl: "https://placehold.co/600x400.png", // Keep for UI compatibility
    data_ai_hint: "industrial equipment",
    detailedInfo: "Machine A (Serial: XZ-7890) requires its 500-hour maintenance. Tasks include: full oil change (use Mobil DTE 25), hydraulic filter replacement (Part No. HF-123), lubrication of all joints, and system diagnostics check. Estimated downtime: 4 hours. Technician: John Doe."
  },
  { 
    id: "2", 
    shortText: "Sensor B2 Offline", 
    causeText: "Sensor B2 on production line 3 is offline. Investigate immediately.", 
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    status: "Pending", 
    priority: "High",
    reporterName: "Operator Jane",
    equipmentNumber: "EQ-SENS-002",
    functionalLocation: "FL-PL3-B2",
    imageUrl: "https://placehold.co/600x400.png",
    data_ai_hint: "sensor error",
    detailedInfo: "Sensor B2 (Type: Optical, Model: SENS-OPT-004B) on Line 3, Segment 4, stopped transmitting data at 08:45 AM. Check power supply, data cable, and sensor integrity. Possible replacement needed. Refer to sensor manual Section 5.2 for troubleshooting."
  },
  { 
    id: "3", 
    shortText: "Software Update Deployed", 
    causeText: "Control panel software v2.5 has been successfully deployed to all units.", 
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    status: "Sent", 
    priority: "Low",
    reporterName: "System Admin",
    imageUrl: "https://placehold.co/600x400.png",
    data_ai_hint: "software update",
    detailedInfo: "The mandatory software update to version 2.5 for all CP-5000 control panels was completed on schedule. Key features: improved UI response, new diagnostic tools, and enhanced security protocols. No issues reported post-deployment."
  },
];

let sapOrdersStore: SAPOrder[] = [
    {
        orderNumber: "ORD-001",
        orderType: "Corrective Maintenance",
        notificationNumber: "1", // Matches noticeStore ID
        enteredBy: "SAPUser1",
        createdOn: new Date(Date.now() - 80000000).toISOString(),
        description: "Repair Machine A after breakdown",
        priority: "High",
        equipmentNumber: "EQ-001",
        equipmentDescription: "Main Production Machine Alpha",
        functionalLocationLabel: "FL-A1",
        functionalLocationDescription: "Production Area 1, Bay 1",
        mainWorkCenter: "MECH-TEAM",
        responsiblePersonName: "John Doe",
    },
    {
        orderNumber: "ORD-002",
        orderType: "Preventive Maintenance",
        notificationNumber: "2", // Matches noticeStore ID
        enteredBy: "SAPUser2",
        createdOn: new Date(Date.now() - 70000000).toISOString(),
        description: "Inspect Sensor B2 connections",
        priority: "Medium",
        equipmentNumber: "EQ-SENS-002",
        equipmentDescription: "Optical Sensor Line 3",
        functionalLocationLabel: "FL-PL3-B2",
        functionalLocationDescription: "Production Line 3, Sensor Bank 2",
        mainWorkCenter: "ELEC-TEAM",
        responsiblePersonName: "Jane Smith",
    }
];


let users: User[] = [
  { id: "1", username: "admin", password: "123", role: "admin", forcePasswordChange: false },
  { id: "2", username: "operator1", role: "operator", forcePasswordChange: false, workstation: "Assembly Line 1" },
  { id: "3", username: "operator2", role: "operator", forcePasswordChange: false, workstation: "Packaging Station 3" },
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
  username: z.string().min(3, "Username must be at least 3 characters (Cedula for operators)"),
  role: z.enum(["admin", "operator"]),
  workstation: z.string().optional(),
});


export async function loginUser(formData: FormData): Promise<{ success: boolean; message: string; user?: User; error?: string }> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username) {
    return { success: false, message: "Username (Cedula) is required.", error: "Missing username" };
  }

  await new Promise(resolve => setTimeout(resolve, 500));
  const user = users.find(u => u.username === username);

  if (user) {
    if (user.role === "operator") {
      const { password: _, ...userWithoutPassword } = user;
      return { success: true, message: "Login successful", user: userWithoutPassword };
    } else if (user.role === "admin") {
      if (!password) {
        return { success: false, message: "Password is required for admin users.", error: "Missing password for admin" };
      }
      if (user.password === password) {
        const { password: _, ...userWithoutPassword } = user;
        return { success: true, message: "Login successful", user: userWithoutPassword };
      } else {
        return { success: false, message: "Invalid password for admin.", error: "Invalid admin credentials" };
      }
    }
  }
  
  return { success: false, message: "Invalid username or password.", error: "Invalid credentials" };
}


export async function changePassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    if (users[userIndex].role === 'operator') {
      return { success: false, message: "Operators do not use passwords." };
    }
    users[userIndex].password = newPassword;
    users[userIndex].forcePasswordChange = false;
    return { success: true, message: "Password changed successfully." };
  }
  return { success: false, message: "User not found." };
}


export async function syncFromSAP(): Promise<{ success: boolean; message: string; synchronizedData?: string[]; firebaseLogId?: string }> {
  console.log("Attempting to synchronize data from SAP...");
  await new Promise(resolve => setTimeout(resolve, 2000)); 
  
  const synchronizedTableNames = ["Customer_Data_Table", "Product_Inventory_Table", "Maintenance_Schedules_Table"];
  
  try {
    const docRef = await addDoc(collection(db, "sap_synchronized_tables"), {
      tables: synchronizedTableNames,
      synchronizedAt: serverTimestamp()
    });
    console.log("Data synchronized with SAP. Log stored in Firebase with ID: ", docRef.id);
    return { 
      success: true, 
      message: "Data successfully synchronized from SAP and logged to Firebase.", 
      synchronizedData: synchronizedTableNames,
      firebaseLogId: docRef.id 
    };
  } catch (error) {
    console.error("Error writing SAP sync log to Firebase: ", error);
    // In a real app, you might want to throw the error or handle it more gracefully
    return { 
      success: false, 
      message: "Data synchronized from SAP, but failed to log to Firebase.", 
      synchronizedData: synchronizedTableNames 
    };
  }
}

// Updated getNotices for UI: maps MaintenanceNoticeAPI to simpler Notice
export async function getNotices(): Promise<Notice[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return noticesStore
    .map(apiNotice => ({
      id: apiNotice.id,
      title: apiNotice.shortText,
      description: apiNotice.causeText || apiNotice.shortText, // Fallback for description
      date: apiNotice.createdAt, // Or apiNotice.requiredStartDate if more relevant for UI
      status: apiNotice.status,
      imageUrl: apiNotice.imageUrl,
      detailedInfo: apiNotice.detailedInfo || apiNotice.causeText, // Fallback for detailedInfo
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// New function for API to get full MaintenanceNoticeAPI objects
export async function getAllMaintenanceNoticesForAPI(): Promise<MaintenanceNoticeAPI[]> {
    await new Promise(resolve => setTimeout(resolve, 100)); // Shorter delay for API
    return [...noticesStore].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getMaintenanceNoticeByIdForAPI(id: string): Promise<MaintenanceNoticeAPI | undefined> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return noticesStore.find(notice => notice.id === id);
}


export async function createMaintenanceNoticeAction(data: CreateMaintenanceNoticeInput): Promise<MaintenanceNoticeAPI> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newId = String(Date.now()); // Simple ID generation
    const now = new Date().toISOString();
    const newNotice: MaintenanceNoticeAPI = {
        ...data,
        id: newId,
        status: "Pending", // Default status on creation
        createdAt: now,
        updatedAt: now,
        // Ensure all required fields from MaintenanceNoticeAPI are present, even if optional in input
        shortText: data.shortText, // Already required in input
    };
    noticesStore.push(newNotice);
    return newNotice;
}

export async function updateMaintenanceNoticeAction(id: string, data: UpdateMaintenanceNoticeInput): Promise<MaintenanceNoticeAPI | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const noticeIndex = noticesStore.findIndex(notice => notice.id === id);
    if (noticeIndex === -1) {
        return null;
    }
    const updatedNotice = {
        ...noticesStore[noticeIndex],
        ...data,
        updatedAt: new Date().toISOString(),
    };
    noticesStore[noticeIndex] = updatedNotice;
    return updatedNotice;
}


export async function sendNoticesToSAP(noticeIds: string[]): Promise<{ success: boolean; message: string }> {
  console.log("Sending notices to SAP:", noticeIds);
  await new Promise(resolve => setTimeout(resolve, 1500));

  noticesStore = noticesStore.map(notice => {
    if (noticeIds.includes(notice.id)) {
      return { ...notice, status: "Sent" as NoticeStatus, updatedAt: new Date().toISOString() };
    }
    return notice;
  });

  return { success: true, message: `${noticeIds.length} notice(s) sent to SAP successfully.` };
}


export async function getUsers(): Promise<User[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
}

export async function addUser(formData: FormData): Promise<{ success: boolean; message: string; errors?: z.ZodIssue[]; generatedPassword?: string }> {
  const rawFormData = {
    username: formData.get('username'),
    role: formData.get('role'),
    workstation: formData.get('workstation')
  };

  const validationResult = UserSchema.safeParse(rawFormData);

  if (!validationResult.success) {
    return { success: false, message: "Validation failed", errors: validationResult.error.issues };
  }
  
  const { username, role, workstation } = validationResult.data;

  if (users.find(user => user.username === username)) {
    return { success: false, message: "Username (Cedula) already exists." };
  }

  const newUser: User = {
    id: String(users.length + 1 + Date.now()), // More unique ID
    username,
    role: role as UserRole,
    forcePasswordChange: false,
  };

  let generatedPasswordForAdmin: string | undefined = undefined;

  if (role === "admin") {
    generatedPasswordForAdmin = generateRandomPassword();
    newUser.password = generatedPasswordForAdmin;
    newUser.forcePasswordChange = true;
  } else if (role === "operator") {
    if (!workstation) {
        return { success: false, message: "Workstation is required for operator role."}
    }
    newUser.workstation = workstation;
  }
  
  users.push(newUser);
  return { 
    success: true, 
    message: `User ${username} added successfully with role ${role}.${role === 'operator' && workstation ? ` Assigned to workstation: ${workstation}.` : ''}`, 
    generatedPassword: role === "admin" ? generatedPasswordForAdmin : undefined 
  };
}


export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  const initialLength = users.length;
  users = users.filter(user => user.id !== userId);
  if (users.length < initialLength) {
    return { success: true, message: "User deleted successfully." };
  }
  return { success: false, message: "User not found." };
}

// Action to get SAP orders
export async function getSAPOrdersAction(): Promise<SAPOrder[]> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    return [...sapOrdersStore].sort((a,b) => new Date(b.createdOn || 0).getTime() - new Date(a.createdOn || 0).getTime());
}
