
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
    date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    status: "Pending", 
    imageUrl: "https://picsum.photos/seed/notice2/300/200",
    detailedInfo: "Sensor B2 (Type: Optical, Model: SENS-OPT-004B) on Line 3, Segment 4, stopped transmitting data at 08:45 AM. Check power supply, data cable, and sensor integrity. Possible replacement needed. Refer to sensor manual Section 5.2 for troubleshooting."
  },
  { 
    id: "3", 
    title: "Software Update Deployed", 
    description: "Control panel software v2.5 has been successfully deployed to all units.", 
    date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    status: "Sent", 
    imageUrl: "https://picsum.photos/seed/notice3/300/200",
    detailedInfo: "The mandatory software update to version 2.5 for all CP-5000 control panels was completed on schedule. Key features: improved UI response, new diagnostic tools, and enhanced security protocols. No issues reported post-deployment."
  },
   { 
    id: "4", 
    title: "Coolant Leak Sector C", 
    description: "Reports of a coolant leak near Press Machine P-05 in Sector C.", 
    date: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago (same as above for variety)
    status: "Pending", 
    imageUrl: "https://picsum.photos/seed/notice4/300/200",
    detailedInfo: "Minor coolant (Type: Ethylene Glycol Mix) leak reported by Operator Smith near Press P-05. Area has been cordoned off. Maintenance required to identify source and repair. Check hoses and seals. ETA for fix: 2 hours."
  },
  {
    id: "5",
    title: "Compressor Unit C-101 Overhaul",
    description: "Major overhaul for Compressor C-101. All seals, bearings, and oil to be replaced.",
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    status: "Pending",
    imageUrl: "https://picsum.photos/seed/notice5/300/200",
    detailedInfo: "Compressor C-101 (Serial: COMP-C101-005) scheduled for 2000-hour service. Includes: full teardown, inspection of rotors, replacement of all gaskets and o-rings (Kit P/N: C101-OH-KIT), bearing set (P/N: BRG-SET-C101), and oil flush (Mobil Rarus SHC 1026). Estimated downtime: 8 hours. Technician: Mike L."
  },
  {
    id: "6",
    title: "Safety Inspection Line 2 Complete",
    description: "Quarterly safety inspection for Production Line 2 has been completed and all systems are nominal.",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    status: "Sent",
    imageUrl: "https://picsum.photos/seed/notice6/300/200",
    detailedInfo: `Line 2 safety audit conducted on ${new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}. All emergency stops, light curtains, and safety guards checked and found to be in good working order. Report filed under SafetyDocs/Q3/Line2_Inspection.pdf. Next inspection due: ${new Date(new Date().setMonth(new Date().getMonth() + 3) - 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}.`
  },
  {
    id: "7",
    title: "Urgent: Hydraulic Hose Burst - Press P-02",
    description: "Hydraulic hose burst on Press P-02. Immediate attention required. Line stopped.",
    date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    status: "Pending",
    imageUrl: "https://picsum.photos/seed/notice7/300/200",
    detailedInfo: "Press P-02 (Sector A) experienced a hydraulic fluid line rupture (Part No. HSL-34F-2M) at 10:15 AM. Machine powered down and area secured. Replacement hose needed from stores. Check for system contamination. Estimated repair time: 3 hours. Assigned: Emergency Response Team."
  },
  {
    id: "8",
    title: "Calibration of CNC Mill X-Axis",
    description: "Scheduled calibration for CNC Mill XM-750 X-axis. To be performed by external vendor.",
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    status: "Pending",
    imageUrl: "https://picsum.photos/seed/notice8/300/200",
    detailedInfo: `Vendor 'PrecisionCal Services' scheduled for X-axis calibration of CNC Mill XM-750 on ${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}. Access required to machine control panel and calibration tools. Duration: Approx. 2 hours. Point of Contact: Sarah Chen (Ext. 123).`
  },
  {
    id: "9",
    title: "Forklift FL-03 Battery Replacement",
    description: "Forklift FL-03 requires a new battery pack. Old battery showing reduced capacity.",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    status: "Sent",
    imageUrl: "https://picsum.photos/seed/notice9/300/200",
    detailedInfo: `Battery pack for Forklift FL-03 (Serial: FLT-003-BATT) replaced on ${new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString()}. New battery (P/N: BATT-FL-24V) installed and tested. Old battery sent for recycling. Charge cycle initiated. Vehicle back in service.`
  },
  {
    id: "10",
    title: "Network Switch Upgrade - Plant Floor",
    description: "Upgrade of network switches NS-PF-01 and NS-PF-02 scheduled for after-hours.",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
    status: "Pending",
    imageUrl: "https://picsum.photos/seed/notice10/300/200",
    detailedInfo: `Network switches NS-PF-01 and NS-PF-02 in the main plant floor area will be upgraded to Cisco Catalyst 9300 series. Work scheduled for Saturday ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()} from 6 PM to 10 PM to minimize disruption. Brief network outages expected in affected zones. IT Team Lead: David Lee.`
  },
  {
    id: "11",
    title: "Air Compressor Routine Check",
    description: "Routine daily check for Air Compressor AC-007. Check pressure levels and drain condensation.",
    date: new Date().toISOString(), // Today
    status: "Pending",
    imageUrl: "https://picsum.photos/seed/notice11/300/200",
    detailedInfo: "Daily check for Air Compressor AC-007. Verify output pressure is between 100-110 PSI. Drain condensation tank. Check oil level. Log readings in maintenance sheet M-AC-007. Task for morning shift operator."
  },
  {
    id: "12",
    title: "Welding Robot WR-05 Maintenance",
    description: "Monthly maintenance for Welding Robot WR-05. Clean optics, check consumables.",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    status: "Pending",
    detailedInfo: "Monthly PM for Welding Robot WR-05 (ABB IRB 2600). Clean protective glass for vision system. Check and replace welding tips and nozzles as needed (consumables kit P/N WR-CK-05). Inspect wire feeder. Lubricate joints as per manual section 4.3. Technician: Emily White."
  },
  {
    id: "13",
    title: "Fire Extinguisher Inspection - Sector B",
    description: "Annual inspection of all fire extinguishers in Sector B.",
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
    status: "Sent",
    imageUrl: "https://picsum.photos/seed/notice13/300/200",
    detailedInfo: `Annual fire extinguisher inspection for Sector B completed by 'SafetyFirst Inc.' on ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}. All units passed. Tags updated. Next inspection due: ${new Date(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).setFullYear(new Date().getFullYear() + 1)).toLocaleDateString()}. Report ID: SEB-FIRE-2024-Q2.`
  }
];

let users: User[] = [
  { id: "1", username: "admin", password: "123", role: "admin", forcePasswordChange: false },
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

