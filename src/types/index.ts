export type NoticeStatus = "Pendiente" | "Enviado";

// Interfaces for nested objects
export interface TipoAviso {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface Equipo {
  id: number;
  numeroEquipo: string;
  ubicacionTecnica: string;
  puestoTrabajo: string;
  perfilCatalogo: string;
  objetoTecnico: string;
}

export interface Sensor {
  id: number;
  nombre: string;
}

export interface ParteObjeto {
  id: number;
  nombre: string;
  sensor?: Sensor;
}

export interface Inspeccion {
  id: number;
  catalogo: string;
  codigo: string;
  descripcion: string;
  catalago2: string;
}

export interface Material {
  id: number;
  conjunto: string;
  description: string;
}

export interface LongText {
  id: number;
  linea: string;
  textLine: string;
}

export interface ItemInspeccion {
  id: number;
  codigoGrupo: string;
  catalogo: string;
  codigo: string;
  descripcion: string;
}

export interface Item {
  id: number;
  SUBCO?: string | null;
  longTexts?: LongText[];
  inspecciones?: ItemInspeccion[];
}

// Simplified interface for Maintenance Notices for external API integration
export interface MaintenanceNoticeAPI {
  // Fields from the external API request
  numeroExt?: string | null; // External number from backend
  tipoAviso: TipoAviso;
  equipo: Equipo;
  parteObjeto: ParteObjeto;
  textoBreve: string;
  fechaInicio: string; // ISO Date string (YYYY-MM-DDTHH:mm:ss.sssZ)
  fechaFin: string;   // ISO Date string
  horaInicio: string; // ISO Date string, as per user spec for "receive"
  horaFin: string;    // ISO Date string, as per user spec for "receive"
  createdById?: string;

  // App-internal fields
  id: string; // Internal app-generated ID
  status: NoticeStatus;
  imageUrl?: string;
  noticeType?: { id?: number | string; nombre?: string; descripcion?: string };
  reporterName?: string;
  data_ai_hint?: string; // AI hint for maintenance type

  // Additional fields from backend
  inspeccion?: Inspeccion;
  material?: Material;
  items?: Item[];
}

export interface User {
  id: string;
  username: string; 
  password?: string; 
}

// New Reporter interface for the reporter-user API
export interface Reporter {
  id: string;
  cedula: string;
  puestoTrabajo: number;
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
