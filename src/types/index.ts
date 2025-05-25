
export type NoticeStatus = "Pendiente" | "Enviado" | "Fallido";

// Simplified interface for Maintenance Notices for external API integration
export interface MaintenanceNoticeAPI {
  // Fields from the external API request
  tipoAvisoId: number;
  equipoId: number;
  ubicacionTecnicaId: number;
  textoBreve: string;
  fechaInicio: string; // ISO Date string (YYYY-MM-DDTHH:mm:ss.sssZ)
  fechaFin: string;   // ISO Date string
  horaInicio: string; // ISO Date string, as per user spec for "receive"
  horaFin: string;    // ISO Date string, as per user spec for "receive"
  puestoTrabajoId?: number;
  parteObjetoId?: number;
  createdById?: number;

  // App-internal fields
  id: string; // Internal app-generated ID
  status: NoticeStatus;
  createdAt: string; // ISO DateTime string
  updatedAt: string; // ISO DateTime string
  imageUrl?: string;
  data_ai_hint?: string;
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
