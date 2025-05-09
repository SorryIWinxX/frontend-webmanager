
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
  username: string;
  role: UserRole;
  password?: string; // Stored "hashed" password
  forcePasswordChange: boolean;
  generatedPassword?: string; // Temporarily store generated password for display
}
