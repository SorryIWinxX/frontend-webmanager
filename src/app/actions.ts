
"use server";

import type { User, UserRole, MaintenanceNoticeAPI, SAPOrder, NoticeStatus } from "@/types";
import { CreateMaintenanceNoticeInput, UpdateMaintenanceNoticeInput } from "@/lib/schemas";
import { z } from "zod";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Store MaintenanceNoticeAPI objects internally
let noticesStore: MaintenanceNoticeAPI[] = [
  { 
    id: "1", 
    shortText: "Machine A Maintenance", 
    causeText: "Scheduled maintenance for Machine A, requires oil change and filter replacement. Also check alignment and belt tension.", 
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(), 
    status: "Pending", 
    priority: "Medium",
    reporterName: "Operator Joe",
    equipmentNumber: "EQ-001",
    functionalLocation: "FL-A1-BAY7",
    assembly: "ASM-MAINDRIVE-001",
    requiredStartDate: "2024-07-15",
    requiredStartTime: "08:00",
    requiredEndDate: "2024-07-15",
    requiredEndTime: "12:00",
    workCenterObjectId: "WC-MECH-01",
    malfunctionEndDate: "2024-07-10",
    malfunctionEndTime: "14:30",
    startPoint: "Section A",
    endPoint: "Section B",
    length: 100,
    linearUnit: "MTR",
    problemCodeGroup: "MECHFAIL",
    problemCode: "LUBRICATE",
    objectPartCodeGroup: "BEARINGS",
    objectPartCode: "BRG-00123",
    imageUrl: "https://placehold.co/600x400.png",
    data_ai_hint: "industrial equipment",
  },
  { 
    id: "2", 
    shortText: "Sensor B2 Offline", 
    causeText: "Sensor B2 on production line 3 is offline. Investigate cabling and power supply immediately. Possible water ingress.", 
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    status: "Pending", 
    priority: "High",
    reporterName: "Operator Jane",
    equipmentNumber: "EQ-SENS-002B",
    functionalLocation: "FL-PL3-CTRL",
    assembly: "SENSOR-RACK-03",
    requiredStartDate: "2024-07-14",
    requiredStartTime: "09:00",
    workCenterObjectId: "WC-ELEC-02",
    problemCodeGroup: "ELECFAIL",
    problemCode: "NOSIGNAL",
    objectPartCodeGroup: "SENSOR",
    objectPartCode: "SENS-OPT-004B",
    imageUrl: "https://placehold.co/600x400.png",
    data_ai_hint: "sensor error",
  },
  { 
    id: "3", 
    shortText: "Software Update Deployed", 
    causeText: "Control panel software v2.5 has been successfully deployed to all HMI units in plant 2. Monitoring for issues.", 
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    status: "Sent", 
    priority: "Low",
    reporterName: "System Admin",
    equipmentNumber: "HMI-ALL-P2",
    functionalLocation: "PLANT2-CTRLRMS",
    workCenterObjectId: "WC-IT-SOFT",
    problemCodeGroup: "INFO",
    problemCode: "UPDATE_OK",
    imageUrl: "https://placehold.co/600x400.png",
    data_ai_hint: "software update",
  },
  {
    id: "4",
    shortText: "Leak in Hydraulic Press HP-05",
    causeText: "Operator reported a minor hydraulic fluid leak near the main cylinder of HP-05. Requires inspection and seal replacement if necessary.",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(), // updated 2 days ago
    status: "Sent",
    priority: "Medium",
    reporterName: "Operator Mike",
    equipmentNumber: "EQ-HYDPRESS-05",
    functionalLocation: "FL-PRESSSHOP-A3",
    assembly: "HP05-CYLINDER-MAIN",
    requiredStartDate: "2024-07-12",
    requiredStartTime: "10:00",
    workCenterObjectId: "WC-MECH-HYD",
    problemCodeGroup: "LEAK",
    problemCode: "HYDFLUID",
    objectPartCodeGroup: "SEALS",
    objectPartCode: "SEAL-HYD-50MM",
    imageUrl: "https://placehold.co/600x400.png",
    data_ai_hint: "hydraulic leak",
  },
  {
    id: "5",
    shortText: "Conveyor Belt C-12 Slipping",
    causeText: "Conveyor belt C-12 in packaging area shows signs of slipping under load. Needs tension adjustment and inspection of drive motor.",
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(), // 4 days ago
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    status: "Pending",
    priority: "High",
    reporterName: "Operator Sarah",
    equipmentNumber: "EQ-CONV-C12",
    functionalLocation: "FL-PACKAGING-LN1",
    assembly: "C12-DRIVEUNIT",
    requiredStartDate: "2024-07-11",
    requiredStartTime: "08:00",
    requiredEndDate: "2024-07-11",
    requiredEndTime: "10:00",
    workCenterObjectId: "WC-MECH-GEN",
    malfunctionEndDate: "2024-07-10",
    malfunctionEndTime: "16:00",
    problemCodeGroup: "MECHFAIL",
    problemCode: "SLIPPING",
    objectPartCodeGroup: "BELT",
    objectPartCode: "CONVBELT-1200MM",
    imageUrl: "https://placehold.co/600x400.png",
    data_ai_hint: "conveyor belt",
  }
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
        functionalLocationLabel: "FL-A1-BAY7",
        functionalLocationDescription: "Production Area 1, Bay 7",
        mainWorkCenter: "MECH-TEAM",
        responsiblePersonName: "John Doe",
        assembly: "ASM-MAINDRIVE-001",
        maintenancePlant: "PLANT_X",
        plannerGroup: "PG-MECH",
        planningPlant: "PLANT_X",
        workCenter: "MECH-01",
        activityType: "REPAIR"
    },
    {
        orderNumber: "ORD-002",
        orderType: "Preventive Maintenance",
        notificationNumber: "4", // Matches noticeStore ID for leak
        enteredBy: "SAPUser2",
        createdOn: new Date(Date.now() - 70000000).toISOString(),
        description: "Inspect and seal Hydraulic Press HP-05",
        priority: "Medium",
        equipmentNumber: "EQ-HYDPRESS-05",
        equipmentDescription: "Hydraulic Press 50 Ton",
        functionalLocationLabel: "FL-PRESSSHOP-A3",
        functionalLocationDescription: "Press Shop Area, Bay 3",
        mainWorkCenter: "ELEC-TEAM", // Should be MECH for hydraulic
        responsiblePersonName: "Jane Smith",
        assembly: "HP05-CYLINDER-MAIN",
        maintenancePlant: "PLANT_Y",
        plannerGroup: "PG-HYD",
        planningPlant: "PLANT_Y",
        workCenter: "MECH-HYD-01",
        activityType: "INSPECT"
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
  
  const synchronizedTableNames = ["Customer_Data_Table", "Product_Inventory_Table", "Maintenance_Schedules_Table", "SAP_Orders_Table_Mock"];
  
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

// Returns full MaintenanceNoticeAPI objects for UI (NoticesTab) and API
export async function getNotices(): Promise<MaintenanceNoticeAPI[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
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
        shortText: data.shortText, 
        // Ensure all required fields from MaintenanceNoticeAPI are present, even if optional in input
        // Many fields are optional in schema but part of MaintenanceNoticeAPI type
        equipmentNumber: data.equipmentNumber || undefined,
        functionalLocation: data.functionalLocation || undefined,
        assembly: data.assembly || undefined,
        priority: data.priority || undefined,
        requiredStartDate: data.requiredStartDate || undefined,
        requiredStartTime: data.requiredStartTime || undefined,
        requiredEndDate: data.requiredEndDate || undefined,
        requiredEndTime: data.requiredEndTime || undefined,
        workCenterObjectId: data.workCenterObjectId || undefined,
        malfunctionEndDate: data.malfunctionEndDate || undefined,
        malfunctionEndTime: data.malfunctionEndTime || undefined,
        reporterName: data.reporterName || undefined,
        startPoint: data.startPoint || undefined,
        endPoint: data.endPoint || undefined,
        length: data.length || undefined,
        linearUnit: data.linearUnit || undefined,
        problemCodeGroup: data.problemCodeGroup || undefined,
        problemCode: data.problemCode || undefined,
        objectPartCodeGroup: data.objectPartCodeGroup || undefined,
        objectPartCode: data.objectPartCode || undefined,
        causeText: data.causeText || undefined,
        imageUrl: "https://placehold.co/600x400.png", // Default image
        data_ai_hint: "new notice"
    };
    noticesStore.unshift(newNotice); // Add to the beginning of the array
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
      // Here you would typically send the full notice object to SAP
      // For this mock, we just update the status
      console.log("Sending notice to SAP (mock):", notice);
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
