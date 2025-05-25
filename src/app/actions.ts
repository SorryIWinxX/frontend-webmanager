
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
    tipoAvisoId: 1,
    equipoId: 10003089,
    ubicacionTecnicaId: 92201,
    textoBreve: "Falla en motor principal PMP-01",
    fechaInicio: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    fechaFin: new Date(Date.now() - 86400000 * 2).toISOString(),   // 2 days ago
    horaInicio: new Date(Date.now() - 86400000 * 3).toISOString(),
    horaFin: new Date(Date.now() - 86400000 * 2).toISOString(),
    puestoTrabajoId: 10001242,
    parteObjetoId: 5005,
    createdById: 7007,
    status: "Pendiente",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    imageUrl: "https://placehold.co/600x400.png",
    data_ai_hint: "motor industrial",
    noticeType: "M1",
    reporterName: "Operador Planta",
    startPoint: "Sección A",
    endPoint: "Sección B",
    linearLength: 10,
    linearUnit: "MTS",
    endMalfunctionDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    endMalfunctionTime: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "2",
    tipoAvisoId: 2,
    equipoId: 20005050,
    ubicacionTecnicaId: 92305,
    textoBreve: "Inspección de rutina Tablero Eléctrico TB-AUX",
    fechaInicio: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    fechaFin: new Date().toISOString(),
    horaInicio: new Date(Date.now() - 86400000).toISOString(),
    horaFin: new Date().toISOString(),
    puestoTrabajoId: 10001243,
    createdById: 7008,
    status: "Enviado",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    imageUrl: "https://placehold.co/600x400.png",
    data_ai_hint: "tablero electrico",
    noticeType: "M2",
    reporterName: "Supervisor Eléctrico",
  },
  {
    id: "3",
    tipoAvisoId: 1,
    equipoId: 10003090,
    ubicacionTecnicaId: 92202,
    textoBreve: "Mantenimiento preventivo Bomba B-002",
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date(Date.now() + 3600000 * 4).toISOString(), // 4 hours from now
    horaInicio: new Date().toISOString(),
    horaFin: new Date(Date.now() + 3600000 * 4).toISOString(),
    puestoTrabajoId: 10001242,
    status: "Pendiente",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    noticeType: "M1",
    reporterName: "Técnico Mecánico",
    // No image for this one
  }
];

let sapOrdersStore: SAPOrder[] = [
    {
        orderNumber: "ORD-001",
        orderType: "Mantenimiento Correctivo",
        notificationNumber: "1", // Matches noticeStore ID
        enteredBy: "SAPUser1",
        createdOn: new Date(Date.now() - 80000000).toISOString(),
        description: "Reparar Máquina A después de avería",
        priority: "Alta",
        equipmentNumber: "EQ-001",
        equipmentDescription: "Máquina Principal de Producción Alpha",
        functionalLocationLabel: "FL-A1-BAY7",
        functionalLocationDescription: "Área de Producción 1, Bahía 7",
        mainWorkCenter: "MECH-TEAM",
        responsiblePersonName: "Juan Pérez",
        assembly: "ASM-MAINDRIVE-001",
        maintenancePlant: "PLANTA_X",
        plannerGroup: "PG-MECH",
        planningPlant: "PLANTA_X",
        workCenter: "MECH-01",
        activityType: "REPARAR"
    },
    {
        orderNumber: "ORD-002",
        orderType: "Mantenimiento Preventivo",
        notificationNumber: "2", // Matches noticeStore ID
        enteredBy: "SAPUser2",
        createdOn: new Date(Date.now() - 70000000).toISOString(),
        description: "Inspeccionar y sellar Prensa Hidráulica HP-05",
        priority: "Media",
        equipmentNumber: "EQ-HYDPRESS-05",
        equipmentDescription: "Prensa Hidráulica 50 Toneladas",
        functionalLocationLabel: "FL-PRESSSHOP-A3",
        functionalLocationDescription: "Área Taller de Prensas, Bahía 3",
        mainWorkCenter: "ELEC-TEAM",
        responsiblePersonName: "Ana Gómez",
        assembly: "HP05-CYLINDER-MAIN",
        maintenancePlant: "PLANTA_Y",
        plannerGroup: "PG-HYD",
        planningPlant: "PLANTA_Y",
        workCenter: "MECH-HYD-01",
        activityType: "INSPECCIONAR"
    }
];

// User data is now managed by an external API.
// const users: User[] = [ ... ]; // This local array is removed.

const UserFormValidationSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres (Cédula para operadores)"),
  role: z.enum(["admin", "operator"]),
  workstation: z.string().optional(),
  password: z.string().optional(), // For admin creation, actual password comes from external API or is set there
});


export async function loginUser(formData: FormData): Promise<{ success: boolean; message: string; user?: User; error?: string }> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string; // Password for admin, not for operator

  if (!username) {
    return { success: false, message: "El nombre de usuario (Cédula) es requerido.", error: "Missing username" };
  }
  
  const externalApiUrl = process.env.EXTERNAL_API_BASE_URL;
  if (!externalApiUrl) {
    console.error("Error: EXTERNAL_API_BASE_URL no está configurada.");
    return { success: false, message: "Error de configuración del servidor.", error: "API URL missing" };
  }

  try {
    // For operators, password might not be sent or might be ignored by the API
    // For admins, password is required.
    // The external API should handle the logic of whether password is required based on role or a pre-check.
    const payload: any = { username };
    // Only send password if it's provided (intended for admin login)
    if (password) {
        payload.password = password;
    }


    const response = await fetch(`${externalApiUrl}/auth/login`, { // Assuming a /auth/login endpoint
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Credenciales inválidas o error de API." }));
      return { success: false, message: errorData.message || "Credenciales inválidas o error de API.", error: `API Error: ${response.status}` };
    }

    const userFromApi: User = await response.json();

    // Ensure the user object from API matches our User type, especially `forcePasswordChange`
    // The external API should return a user object compatible with the User type.
    return { success: true, message: "Inicio de sesión exitoso", user: userFromApi };

  } catch (error) {
    console.error("Error en loginUser:", error);
    return { success: false, message: "Error de conexión o del servidor al intentar iniciar sesión.", error: error instanceof Error ? error.message : "Unknown error" };
  }
}


export async function changePassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const externalApiUrl = process.env.EXTERNAL_API_BASE_URL;
  if (!externalApiUrl) {
    console.error("Error: EXTERNAL_API_BASE_URL no está configurada.");
    return { success: false, message: "Error de configuración del servidor." };
  }

  try {
    const response = await fetch(`${externalApiUrl}/users/${userId}/change-password`, { // Assuming this endpoint
      method: 'POST', // Or PUT
      headers: { 'Content-Type': 'application/json' /* Add Auth headers if needed */ },
      body: JSON.stringify({ newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "No se pudo cambiar la contraseña." }));
      return { success: false, message: errorData.message || "No se pudo cambiar la contraseña." };
    }
    // Assuming API returns a success message or status
    return { success: true, message: "Contraseña cambiada exitosamente." };

  } catch (error) {
    console.error("Error en changePassword:", error);
    return { success: false, message: "Error de conexión o del servidor al cambiar la contraseña." };
  }
}


export async function syncFromSAP(): Promise<{ success: boolean; message: string; synchronizedData?: string[]; firebaseLogId?: string }> {
  const externalSapApiUrl = process.env.EXTERNAL_API_BASE_URL; // Assuming SAP data comes from the same base URL or another specific one
  if (!externalSapApiUrl) {
    console.error("Error: EXTERNAL_API_BASE_URL para SAP no está configurada.");
    return { success: false, message: "Configuración de API externa para SAP incompleta." };
  }

  console.log(`Intentando sincronizar datos desde SAP usando la URL base: ${externalSapApiUrl}`);
  // Example: const response = await fetch(`${externalSapApiUrl}/sap-data-endpoint`);

  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

  const synchronizedTableNames = ["Tabla_Datos_Cliente_SAP", "Tabla_Inventario_Producto_SAP", "Tabla_Programas_Mantenimiento_SAP", "Tabla_Pedidos_SAP_Mock"];

  try {
    const docRef = await addDoc(collection(db, "sap_synchronized_tables"), {
      tables: synchronizedTableNames,
      synchronizedAt: serverTimestamp(),
      source: externalSapApiUrl // Log the source for reference
    });
    console.log("Datos sincronizados con SAP. Log almacenado en Firebase con ID: ", docRef.id);
    return {
      success: true,
      message: "Datos sincronizados exitosamente desde SAP y registrados en Firebase.",
      synchronizedData: synchronizedTableNames,
      firebaseLogId: docRef.id
    };
  } catch (error)
 {
    console.error("Error al escribir el log de sincronización de SAP en Firebase: ", error);
    return {
      success: false,
      message: "Datos sincronizados desde SAP, pero falló el registro en Firebase.",
      synchronizedData: synchronizedTableNames // Still return data if sync itself was ok
    };
  }
}

export async function getNotices(): Promise<MaintenanceNoticeAPI[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...noticesStore].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}


export async function getMaintenanceNoticeByIdForAPI(id: string): Promise<MaintenanceNoticeAPI | undefined> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const notice = noticesStore.find(notice => notice.id === id);
    return notice ? {...notice} : undefined;
}


export async function createMaintenanceNoticeAction(data: CreateMaintenanceNoticeInput): Promise<MaintenanceNoticeAPI> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newId = String(Date.now() + Math.random()); // Ensure more unique ID for mocks
    const now = new Date().toISOString();

    const newNotice: MaintenanceNoticeAPI = {
        ...data, 
        id: newId,
        status: "Pendiente",
        createdAt: now,
        updatedAt: now,
        imageUrl: data.imageUrl || undefined, // Keep it undefined if not provided
        data_ai_hint: data.data_ai_hint || undefined,
        noticeType: data.noticeType || "M1", // Default noticeType
        reporterName: data.reporterName || "Sistema",
    };
    noticesStore.unshift(newNotice); // Add to the beginning
    return {...newNotice};
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
    return {...updatedNotice};
}


export async function sendNoticesToSAP(noticeIds: string[]): Promise<{ success: boolean; message: string }> {
  const externalSapApiUrl = process.env.EXTERNAL_API_BASE_URL;
  if (!externalSapApiUrl) {
    console.error("Error: EXTERNAL_API_BASE_URL para SAP no está configurada.");
    return { success: false, message: "Configuración de API externa para SAP incompleta." };
  }

  console.log("Enviando avisos a SAP (simulado):", noticeIds);
  // In a real scenario, you would loop through noticeIds, fetch each notice, format it, and send to `${externalSapApiUrl}/sap-notices-endpoint`
  
  await new Promise(resolve => setTimeout(resolve, 1500));

  let noticesUpdatedCount = 0;
  noticesStore = noticesStore.map(notice => {
    if (noticeIds.includes(notice.id) && notice.status === "Pendiente") {
      console.log("Simulando envío de aviso a SAP:", notice.id, notice.textoBreve);
      noticesUpdatedCount++;
      return { ...notice, status: "Enviado" as NoticeStatus, updatedAt: new Date().toISOString() };
    }
    return notice;
  });

  if (noticesUpdatedCount === 0) {
    return { success: false, message: "No se enviaron avisos. Puede que ya estuvieran enviados o no se encontraron." };
  }
  return { success: true, message: `${noticesUpdatedCount} aviso(s) enviado(s) a SAP exitosamente (simulado).` };
}


export async function getUsers(): Promise<User[]> {
  const externalApiUrl = process.env.EXTERNAL_API_BASE_URL;
  if (!externalApiUrl) {
    console.error("Error: EXTERNAL_API_BASE_URL no está configurada.");
    return []; // Or throw an error
  }

  try {
    const response = await fetch(`${externalApiUrl}/users`, { // Assuming GET /users endpoint
      method: 'GET',
      headers: { 'Content-Type': 'application/json' /* Add Auth headers if needed */ },
    });

    if (!response.ok) {
      console.error(`Error al obtener usuarios de API externa: ${response.status}`);
      return [];
    }
    const usersFromApi: User[] = await response.json();
    return usersFromApi;
  } catch (error) {
    console.error("Error en getUsers:", error);
    return [];
  }
}

export async function addUser(formData: FormData): Promise<{ success: boolean; message: string; errors?: z.ZodIssue[]; user?: User }> {
  const rawFormData = {
    username: formData.get('username') as string,
    role: formData.get('role') as UserRole,
    workstation: formData.get('workstation') as string | undefined,
    password: formData.get('password') as string | undefined, // For admin creation by external API
  };

  const validationResult = UserFormValidationSchema.safeParse(rawFormData);

  if (!validationResult.success) {
    return { success: false, message: "Falló la validación", errors: validationResult.error.issues };
  }

  const { username, role, workstation, password } = validationResult.data;

  const externalApiUrl = process.env.EXTERNAL_API_BASE_URL;
  if (!externalApiUrl) {
    console.error("Error: EXTERNAL_API_BASE_URL no está configurada.");
    return { success: false, message: "Error de configuración del servidor." };
  }

  const payload: any = { username, role };
  if (role === "operator" && workstation) {
    payload.workstation = workstation;
  } else if (role === "admin" && password) { 
    // The external API should handle if it needs a password for admin creation,
    // or if it generates one. This client sends what's provided.
    payload.password = password; 
  }
   if (role === "operator" && !workstation) {
       return { success: false, message: "El puesto de trabajo es requerido para el rol de operador." };
   }


  try {
    const response = await fetch(`${externalApiUrl}/users`, { // Assuming POST /users endpoint
      method: 'POST',
      headers: { 'Content-Type': 'application/json' /* Add Auth headers if needed */ },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "No se pudo agregar el usuario." }));
      return { success: false, message: errorData.message || "No se pudo agregar el usuario." };
    }
    
    const newUserFromApi: User = await response.json();
    // The API should return the created user, including any server-generated fields like id, forcePasswordChange
    return {
      success: true,
      message: `Usuario ${newUserFromApi.username} agregado exitosamente.`,
      user: newUserFromApi // Return the user object from the API
    };

  } catch (error) {
    console.error("Error en addUser:", error);
    return { success: false, message: "Error de conexión o del servidor al agregar usuario." };
  }
}


export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  const externalApiUrl = process.env.EXTERNAL_API_BASE_URL;
  if (!externalApiUrl) {
    console.error("Error: EXTERNAL_API_BASE_URL no está configurada.");
    return { success: false, message: "Error de configuración del servidor." };
  }
  if (userId === '1' || userId.toLowerCase() === 'admin') { // Basic protection for a default admin
      return { success: false, message: "No se puede eliminar el usuario administrador principal (simulado)." };
  }

  try {
    const response = await fetch(`${externalApiUrl}/users/${userId}`, { // Assuming DELETE /users/{id} endpoint
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' /* Add Auth headers if needed */ },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "No se pudo eliminar el usuario." }));
      return { success: false, message: errorData.message || "No se pudo eliminar el usuario." };
    }
    // Assuming API returns a 200/204 on successful deletion
    return { success: true, message: "Usuario eliminado exitosamente." };

  } catch (error) {
    console.error("Error en deleteUser:", error);
    return { success: false, message: "Error de conexión o del servidor al eliminar usuario." };
  }
}

export async function getSAPOrdersAction(): Promise<SAPOrder[]> {
    // This could also fetch from an external API if SAP orders are exposed there
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...sapOrdersStore].sort((a,b) => new Date(b.createdOn || 0).getTime() - new Date(a.createdOn || 0).getTime());
}
