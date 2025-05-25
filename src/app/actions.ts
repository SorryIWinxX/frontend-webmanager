
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

let users: User[] = [
  { id: "1", username: "admin", role: "admin", password: "123", forcePasswordChange: false },
  { id: "2", username: "op123", role: "operator", workstation: "Línea de Ensamblaje 1", forcePasswordChange: false, password: "" }, // Operators don't use password field for login
  { id: "3", username: "newadmin", role: "admin", password: "changeme", forcePasswordChange: true },
];


const UserFormValidationSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres (Cédula para operadores)"),
  role: z.enum(["admin", "operator"]),
  workstation: z.string().optional(),
  password: z.string().optional(),
});


export async function loginUser(formData: FormData): Promise<{ success: boolean; message: string; user?: User; error?: string }> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username) {
    return { success: false, message: "El nombre de usuario (Cédula) es requerido.", error: "Missing username" };
  }

  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (!user) {
    return { success: false, message: "Usuario no encontrado.", error: "User not found" };
  }

  if (user.role === "admin") {
    if (!password) {
      return { success: false, message: "La contraseña es requerida para administradores.", error: "Missing password for admin" };
    }
    if (user.password !== password) {
      return { success: false, message: "Contraseña incorrecta para administrador.", error: "Invalid admin password" };
    }
  }
  // For operators, only username (cédula) is checked.

  // Return a copy of the user object without the password for security, even in mocks
  const { password: _, ...userToReturn } = user;
  return { success: true, message: "Inicio de sesión exitoso", user: userToReturn };
}


export async function changePassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado." };
  }
  if (users[userIndex].role !== 'admin') {
      return { success: false, message: "Solo los administradores pueden cambiar la contraseña de esta manera." };
  }

  users[userIndex].password = newPassword;
  users[userIndex].forcePasswordChange = false;
  
  return { success: true, message: "Contraseña cambiada exitosamente." };
}


export async function syncFromSAP(): Promise<{ success: boolean; message: string; synchronizedData?: string[]; firebaseLogId?: string }> {
  const externalSapApiUrl = process.env.EXTERNAL_API_BASE_URL; 
  // if (!externalSapApiUrl) {
  //   console.error("Error: EXTERNAL_API_BASE_URL para SAP no está configurada.");
  //   return { success: false, message: "Configuración de API externa para SAP incompleta." };
  // }
  // console.log(`Intentando sincronizar datos desde SAP usando la URL base: ${externalSapApiUrl}`);
  console.log("Simulando sincronización desde SAP (usando datos mock/internos).");


  await new Promise(resolve => setTimeout(resolve, 2000)); 

  const synchronizedTableNames = ["Tabla_Datos_Cliente_SAP", "Tabla_Inventario_Producto_SAP", "Tabla_Programas_Mantenimiento_SAP", "Tabla_Pedidos_SAP_Mock"];

  try {
    const docRef = await addDoc(collection(db, "sap_synchronized_tables"), {
      tables: synchronizedTableNames,
      synchronizedAt: serverTimestamp(),
      source: externalSapApiUrl || "Mocked SAP Data"
    });
    console.log("Datos sincronizados con SAP. Log almacenado en Firebase con ID: ", docRef.id);
    return {
      success: true,
      message: "Datos sincronizados exitosamente desde SAP y registrados en Firebase.",
      synchronizedData: synchronizedTableNames,
      firebaseLogId: docRef.id
    };
  } catch (error) {
    console.error("Error al escribir el log de sincronización de SAP en Firebase: ", error);
    return {
      success: false,
      message: "Datos sincronizados desde SAP, pero falló el registro en Firebase.",
      synchronizedData: synchronizedTableNames 
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
    const newId = String(Date.now() + Math.random()); 
    const now = new Date().toISOString();

    const newNotice: MaintenanceNoticeAPI = {
        ...data, 
        id: newId,
        status: "Pendiente",
        createdAt: now,
        updatedAt: now,
        imageUrl: data.imageUrl || undefined,
        data_ai_hint: data.data_ai_hint || undefined,
        noticeType: data.noticeType || "M1", 
        reporterName: data.reporterName || "Sistema",
    };
    noticesStore.unshift(newNotice); 
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
  // const externalSapApiUrl = process.env.EXTERNAL_API_BASE_URL;
  // if (!externalSapApiUrl) {
  //   console.error("Error: EXTERNAL_API_BASE_URL para SAP no está configurada.");
  //   return { success: false, message: "Configuración de API externa para SAP incompleta." };
  // }

  console.log("Enviando avisos a SAP (simulado con mock data):", noticeIds);
  
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
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async
  // Return copies of user objects without passwords for security
  return users.map(u => {
    const { password, ...userWithoutPassword } = u;
    return userWithoutPassword;
  });
}

export async function addUser(formData: FormData): Promise<{ success: boolean; message: string; errors?: z.ZodIssue[]; user?: User }> {
  const rawFormData = {
    username: formData.get('username') as string,
    role: formData.get('role') as UserRole,
    workstation: formData.get('workstation') as string | undefined,
    password: formData.get('password') as string | undefined,
  };

  const validationResult = UserFormValidationSchema.safeParse(rawFormData);

  if (!validationResult.success) {
    return { success: false, message: "Falló la validación", errors: validationResult.error.issues };
  }

  const { username, role, workstation, password } = validationResult.data;

  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, message: `El usuario "${username}" ya existe.` };
  }
  
  if (role === "operator" && !workstation) {
       return { success: false, message: "El puesto de trabajo es requerido para el rol de operador." };
  }


  const newUser: User = {
    id: String(Date.now() + Math.random()), // Simple unique ID for mock
    username,
    role,
    forcePasswordChange: role === "admin" ? !!password : false, // Admins created with password must change it
    password: role === "admin" ? (password || "password123") : "", // Store password for admin, empty for operator
  };
  if (role === "operator" && workstation) {
    newUser.workstation = workstation;
  }
  
  users.push(newUser);
  
  const { password: _, ...userToReturn } = newUser; // Don't return password
  
  let message = `Usuario ${username} agregado exitosamente.`;
  if (role === "admin" && newUser.forcePasswordChange) {
      message += ` El administrador deberá cambiar su contraseña ("${newUser.password}") al iniciar sesión.`;
  }


  return {
    success: true,
    message: message,
    user: userToReturn
  };
}


export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { success: false, message: "Usuario no encontrado." };
  }
  // Basic protection for the primary admin in mock
  if (users[userIndex].username.toLowerCase() === 'admin' && users[userIndex].id === '1') { 
      return { success: false, message: "No se puede eliminar el usuario administrador principal (simulado)." };
  }

  users.splice(userIndex, 1);
  return { success: true, message: "Usuario eliminado exitosamente." };
}

export async function getSAPOrdersAction(): Promise<SAPOrder[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...sapOrdersStore].sort((a,b) => new Date(b.createdOn || 0).getTime() - new Date(a.createdOn || 0).getTime());
}
