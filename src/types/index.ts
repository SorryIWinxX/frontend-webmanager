
export type NoticeStatus = "Pending" | "Sent" | "Failed";

export interface Notice {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  status: NoticeStatus;
  imageUrl?: string;
  detailedInfo?: string; // For more detailed information if needed
}

export type UserRole = "admin" | "operator";

export interface User {
  id: string;
  username: string; // Cedula for operators
  role: UserRole;
  password?: string; // Optional, not used by operators
  forcePasswordChange: boolean; // Mainly for new admins
  workstation?: string; // For operators
  generatedPassword?: string; // Temporarily store generated password for display (admins)
}
