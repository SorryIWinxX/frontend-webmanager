
export type NoticeStatus = "Pending" | "Sent" | "Failed";

// Detailed interface for Maintenance Notices used by the API and stored internally
export interface MaintenanceNoticeAPI {
  id: string;
  equipmentNumber?: string;
  functionalLocation?: string;
  assembly?: string;
  shortText: string; // Will be used as 'title' in the simpler UI Notice
  priority?: string;
  requiredStartDate?: string; // Format: YYYY-MM-DD
  requiredStartTime?: string; // Format: HH:MM
  requiredEndDate?: string; // Format: YYYY-MM-DD
  requiredEndTime?: string; // Format: HH:MM
  workCenterObjectId?: string;
  malfunctionEndDate?: string; // Format: YYYY-MM-DD
  malfunctionEndTime?: string; // Format: HH:MM
  reporterName?: string;
  startPoint?: string;
  endPoint?: string;
  length?: number;
  linearUnit?: string;
  problemCodeGroup?: string;
  problemCode?: string;
  objectPartCodeGroup?: string;
  objectPartCode?: string;
  causeText?: string; // Will be used as 'description' in the simpler UI Notice

  status: NoticeStatus;
  createdAt: string; // ISO DateTime string
  updatedAt: string; // ISO DateTime string

  // Fields from original simple Notice type for potential UI use / data completeness
  imageUrl?: string; // This might be added by the desktop app later
  detailedInfo?: string; // This could be a concatenation or specific details for UI
}


// Simplified Notice type for the existing UI (Desktop App)
export interface Notice {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string (derived from MaintenanceNoticeAPI's createdAt or requiredStartDate)
  status: NoticeStatus;
  imageUrl?: string;
  detailedInfo?: string;
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

// New type for SAP Orders to be exposed via API
export interface SAPOrder {
  orderNumber: string;
  orderType?: string;
  notificationNumber?: string; // Corresponds to MaintenanceNoticeAPI id
  enteredBy?: string;
  createdOn?: string; // ISO DateTime string
  lastChangedBy?: string;
  description?: string; // Short text of the order
  abcIndicator?: string;
  priority?: string;
  equipmentNumber?: string;
  equipmentDescription?: string;
  functionalLocationLabel?: string;
  functionalLocationDescription?: string;
  assembly?: string;
  planningPlant?: string;
  plannerGroup?: string;
  mainWorkCenter?: string;
  responsiblePersonName?: string;
  maintenancePlant?: string;
  workCenter?: string; // Specific work center for the task
  activityType?: string;
  startPoint?: string;
  endPoint?: string;
  length?: number;
  linearUnit?: string;
}
