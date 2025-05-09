
export type NoticeStatus = "Pending" | "Sent" | "Failed";

export interface Notice {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  status: NoticeStatus;
}

export type UserRole = "admin" | "operator";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  // Password should not be stored or transmitted in plaintext, this is for form handling
  password?: string; 
}
