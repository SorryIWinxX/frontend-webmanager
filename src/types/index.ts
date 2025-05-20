
export type NoticeStatus = "Pending" | "Sent" | "Failed";

// Detailed interface for Maintenance Notices used by the API and stored internally
export interface MaintenanceNoticeAPI {
  id: string;
  equipmentNumber?: string;
  functionalLocation?: string;
  assembly?: string;
  shortText: string; 
  priority?: string;
  requiredStartDate?: string; // Format: YYYY-MM-DD
  requiredStartTime?: string; // Format: HH:MM
  requiredEndDate?: string; // Format: YYYY-MM-DD
  requiredEndTime?: string; // Format: HH:MM
  workCenterObjectId?: string; // Object ID of the Work Center
  malfunctionEndDate?: string; // Format: YYYY-MM-DD
  malfunctionEndTime?: string; // Format: HH:MM
  reporterName?: string; // Name of Person Reporting Notification
  startPoint?: string;
  endPoint?: string;
  length?: number;
  linearUnit?: string; // Unit of Measurement for Linear Data
  problemCodeGroup?: string; // Code Group - Problem
  problemCode?: string; // Problem or Damage Code
  objectPartCodeGroup?: string; // Code Group - Object Parts
  objectPartCode?: string; // Part of Object
  causeText?: string; 

  status: NoticeStatus;
  createdAt: string; // ISO DateTime string
  updatedAt: string; // ISO DateTime string

  imageUrl?: string; 
  data_ai_hint?: string; // For placeholder image generation
  // detailedInfo might be redundant if all fields are displayed, or could be a summary.
  // For now, we will rely on displaying individual fields.
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
  abcIndicator?: string; // ABC indicator for technical object
  priority?: string;
  equipmentNumber?: string;
  equipmentDescription?: string; // Description of technical object
  functionalLocationLabel?: string;
  functionalLocationDescription?: string;
  assembly?: string;
  planningPlant?: string; // Maintenance Planning Plant
  plannerGroup?: string; // Responsible planner group/department
  mainWorkCenter?: string; // Main work center for maintenance tasks
  responsiblePersonName?: string; // Name of Person Reponsible for System
  maintenancePlant?: string;
  workCenter?: string; // Specific work center for the task
  activityType?: string; // Maintenance activity type
  startPoint?: string;
  endPoint?: string; 
  length?: number;
  linearUnit?: string; // Unit of Measurement for Linear Data
}
