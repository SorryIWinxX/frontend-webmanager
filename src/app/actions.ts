
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
    noticeType: "M1",
    shortText: "Mantenimiento Maquina A", 
    causeText: "Mantenimiento programado para Máquina A, requiere cambio de aceite y reemplazo de filtro. También verificar alineación y tensión de la correa.", 
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(), 
    status: "Pendiente", 
    priority: "Media",
    reporterName: "Operador Juan",
    equipmentNumber: "EQ-001",
    functionalLocation: "FL-A1-BAY7",
    assembly: "ASM-MAINDRIVE-001",
    requiredStartDate: "2024-07-15",
    requiredStartTime: "08:00",
    requiredEndDate: "2024-07-15",
    requiredEndTime: "12:00",
    workCenterObjectId: "WC-MECH-01",
    malfunctionEndDate: "2024-07-10",
    malfunctionEndTime: "14:30",
    startPoint: "Sección A",
    endPoint: "Sección B",
    length: 100,
    linearUnit: "MTR",
    problemCodeGroup: "MECHFAIL",
    problemCode: "LUBRICATE",
    objectPartCodeGroup: "BEARINGS",
    objectPartCode: "BRG-00123",
    imageUrl: "https://placehold.co/600x400.png",
    data_ai_hint: "industrial equipment",
  },
  { 
    id: "2", 
    noticeType: "M2",
    shortText: "Sensor B2 fuera de línea", 
    causeText: "Sensor B2 en la línea de producción 3 está fuera de línea. Investigar cableado y suministro de energía inmediatamente. Posible ingreso de agua.", 
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    status: "Pendiente", 
    priority: "Alta",
    reporterName: "Operadora Ana",
    equipmentNumber: "EQ-SENS-002B",
    functionalLocation: "FL-PL3-CTRL",
    assembly: "SENSOR-RACK-03",
    requiredStartDate: "2024-07-14",
    requiredStartTime: "09:00",
    workCenterObjectId: "WC-ELEC-02",
    problemCodeGroup: "ELECFAIL",
    problemCode: "NOSIGNAL",
    objectPartCodeGroup: "SENSOR",
    objectPartCode: "SENS-OPT-004B",
    imageUrl: "https://placehold.co/600x400.png",
    data_ai_hint: "sensor error",
  },
  { 
    id: "3", 
    noticeType: "M3",
    shortText: "Actualización de Software Desplegada", 
    causeText: "Software del panel de control v2.5 desplegado exitosamente en todas las unidades HMI de la planta 2. Monitoreando problemas.", 
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    status: "Enviado", 
    priority: "Baja",
    reporterName: "Admin de Sistemas",
    equipmentNumber: "HMI-ALL-P2",
    functionalLocation: "PLANT2-CTRLRMS",
    workCenterObjectId: "WC-IT-SOFT",
    problemCodeGroup: "INFO",
    problemCode: "UPDATE_OK",
    imageUrl: "https://placehold.co/600x400.png",
    data_ai_hint: "software update",
  },
  {
    id: "4",
    noticeType: "M1",
    shortText: "Fuga en Prensa Hidráulica HP-05",
    causeText: "Operador reportó fuga menor de fluido hidráulico cerca del cilindro principal de HP-05. Requiere inspección y reemplazo de sellos si es necesario.",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(), // updated 2 days ago
    status: "Enviado",
    priority: "Media",
    reporterName: "Operador Miguel",
    equipmentNumber: "EQ-HYDPRESS-05",
    functionalLocation: "FL-PRESSSHOP-A3",
    assembly: "HP05-CYLINDER-MAIN",
    requiredStartDate: "2024-07-12",
    requiredStartTime: "10:00",
    workCenterObjectId: "WC-MECH-HYD",
    problemCodeGroup: "LEAK",
    problemCode: "HYDFLUID",
    objectPartCodeGroup: "SEALS",
    objectPartCode: "SEAL-HYD-50MM",
    imageUrl: "https://placehold.co/600x400.png",
    data_ai_hint: "hydraulic leak",
  },
  {
    id: "5",
    noticeType: "M2",
    shortText: "Banda Transportadora C-12 Deslizando",
    causeText: "Banda transportadora C-12 en área de empaque muestra signos de deslizamiento bajo carga. Necesita ajuste de tensión e inspección del motor de accionamiento.",
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(), // 4 days ago
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    status: "Pendiente",
    priority: "Alta",
    reporterName: "Operadora Sara",
    equipmentNumber: "EQ-CONV-C12",
    functionalLocation: "FL-PACKAGING-LN1",
    assembly: "C12-DRIVEUNIT",
    requiredStartDate: "2024-07-11",
    requiredStartTime: "08:00",
    requiredEndDate: "2024-07-11",
    requiredEndTime: "10:00",
    workCenterObjectId: "WC-MECH-GEN",
    malfunctionEndDate: "2024-07-10",
    malfunctionEndTime: "16:00",
    problemCodeGroup: "MECHFAIL",
    problemCode: "SLIPPING",
    objectPartCodeGroup: "BELT",
    objectPartCode: "CONVBELT-1200MM",
    imageUrl: "https://placehold.co/600x400.png",
    data_ai_hint: "conveyor belt",
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
        notificationNumber: "4", // Matches noticeStore ID for leak
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
  { id: "1", username: "admin", password: "123", role: "admin", forcePasswordChange: false },
  { id: "2", username: "operator1", role: "operator", forcePasswordChange: false, workstation: "Assembly Line 1" },
  { id: "3", username: "operator2", role: "operator", forcePasswordChange: false, workstation: "Packaging Station 3" },
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
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres (Cédula para operadores)"),
  role: z.enum(["admin", "operator"]),
  workstation: z.string().optional(),
});


export async function loginUser(formData: FormData): Promise<{ success: boolean; message: string; user?: User; error?: string }> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username) {
    return { success: false, message: "El nombre de usuario (Cédula) es requerido.", error: "Missing username" };
  }

  await new Promise(resolve => setTimeout(resolve, 500));
  const user = users.find(u => u.username === username);

  if (user) {
    if (user.role === "operator") {
      const { password: _, ...userWithoutPassword } = user;
      return { success: true, message: "Inicio de sesión exitoso", user: userWithoutPassword };
    } else if (user.role === "admin") {
      if (!password) {
        return { success: false, message: "La contraseña es requerida para usuarios administradores.", error: "Missing password for admin" };
      }
      if (user.password === password) {
        const { password: _, ...userWithoutPassword } = user;
        return { success: true, message: "Inicio de sesión exitoso", user: userWithoutPassword };
      } else {
        return { success: false, message: "Contraseña inválida para administrador.", error: "Invalid admin credentials" };
      }
    }
  }
  
  return { success: false, message: "Nombre de usuario o contraseña inválidos.", error: "Invalid credentials" };
}


export async function changePassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    if (users[userIndex].role === 'operator') {
      return { success: false, message: "Los operadores no usan contraseñas." };
    }
    users[userIndex].password = newPassword;
    users[userIndex].forcePasswordChange = false;
    return { success: true, message: "Contraseña cambiada exitosamente." };
  }
  return { success: false, message: "Usuario no encontrado." };
}


export async function syncFromSAP(): Promise<{ success: boolean; message: string; synchronizedData?: string[]; firebaseLogId?: string }> {
  console.log("Intentando sincronizar datos desde SAP...");
  await new Promise(resolve => setTimeout(resolve, 2000)); 
  
  const synchronizedTableNames = ["Tabla_Datos_Cliente", "Tabla_Inventario_Producto", "Tabla_Programas_Mantenimiento", "Tabla_Pedidos_SAP_Mock"];
  
  try {
    const docRef = await addDoc(collection(db, "sap_synchronized_tables"), {
      tables: synchronizedTableNames,
      synchronizedAt: serverTimestamp()
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
    return noticesStore.find(notice => notice.id === id);
}


export async function createMaintenanceNoticeAction(data: CreateMaintenanceNoticeInput): Promise<MaintenanceNoticeAPI> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newId = String(Date.now()); 
    const now = new Date().toISOString();
    const newNotice: MaintenanceNoticeAPI = {
        ...data,
        id: newId,
        status: "Pendiente", 
        createdAt: now,
        updatedAt: now,
        shortText: data.shortText, 
        noticeType: data.shortText.includes("Urgente") ? "M2" : "M1", // Basic logic for notice type
        equipmentNumber: data.equipmentNumber || undefined,
        functionalLocation: data.functionalLocation || undefined,
        assembly: data.assembly || undefined,
        priority: data.priority || undefined,
        requiredStartDate: data.requiredStartDate || undefined,
        requiredStartTime: data.requiredStartTime || undefined,
        requiredEndDate: data.requiredEndDate || undefined,
        requiredEndTime: data.requiredEndTime || undefined,
        workCenterObjectId: data.workCenterObjectId || undefined,
        malfunctionEndDate: data.malfunctionEndDate || undefined,
        malfunctionEndTime: data.malfunctionEndTime || undefined,
        reporterName: data.reporterName || undefined,
        startPoint: data.startPoint || undefined,
        endPoint: data.endPoint || undefined,
        length: data.length || undefined,
        linearUnit: data.linearUnit || undefined,
        problemCodeGroup: data.problemCodeGroup || undefined,
        problemCode: data.problemCode || undefined,
        objectPartCodeGroup: data.objectPartCodeGroup || undefined,
        objectPartCode: data.objectPartCode || undefined,
        causeText: data.causeText || undefined,
        imageUrl: data.shortText.toLowerCase().includes("sensor") ? "https://placehold.co/600x400.png?text=Sensor+Issue" : "https://placehold.co/600x400.png",
        data_ai_hint: "new notice"
    };
    noticesStore.unshift(newNotice); 
    return newNotice;
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
    return updatedNotice;
}


export async function sendNoticesToSAP(noticeIds: string[]): Promise<{ success: boolean; message: string }> {
  console.log("Enviando avisos a SAP:", noticeIds);
  await new Promise(resolve => setTimeout(resolve, 1500));

  noticesStore = noticesStore.map(notice => {
    if (noticeIds.includes(notice.id)) {
      console.log("Enviando aviso a SAP (mock):", notice);
      return { ...notice, status: "Enviado" as NoticeStatus, updatedAt: new Date().toISOString() };
    }
    return notice;
  });

  return { success: true, message: `${noticeIds.length} aviso(s) enviado(s) a SAP exitosamente.` };
}


export async function getUsers(): Promise<User[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
}

export async function addUser(formData: FormData): Promise<{ success: boolean; message: string; errors?: z.ZodIssue[]; generatedPassword?: string }> {
  const rawFormData = {
    username: formData.get('username'),
    role: formData.get('role'),
    workstation: formData.get('workstation')
  };

  const validationResult = UserSchema.safeParse(rawFormData);

  if (!validationResult.success) {
    return { success: false, message: "Falló la validación", errors: validationResult.error.issues };
  }
  
  const { username, role, workstation } = validationResult.data;

  if (users.find(user => user.username === username)) {
    return { success: false, message: "El nombre de usuario (Cédula) ya existe." };
  }

  const newUser: User = {
    id: String(users.length + 1 + Date.now()), 
    username,
    role: role as UserRole,
    forcePasswordChange: false,
  };

  let generatedPasswordForAdmin: string | undefined = undefined;

  if (role === "admin") {
    generatedPasswordForAdmin = generateRandomPassword();
    newUser.password = generatedPasswordForAdmin;
    newUser.forcePasswordChange = true;
  } else if (role === "operator") {
    if (!workstation) {
        return { success: false, message: "El puesto de trabajo es requerido para el rol de operador."}
    }
    newUser.workstation = workstation;
  }
  
  users.push(newUser);
  return { 
    success: true, 
    message: `Usuario ${username} agregado exitosamente con rol ${role}.${role === 'operator' && workstation ? ` Asignado al puesto de trabajo: ${workstation}.` : ''}`, 
    generatedPassword: role === "admin" ? generatedPasswordForAdmin : undefined 
  };
}


export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  const initialLength = users.length;
  users = users.filter(user => user.id !== userId);
  if (users.length < initialLength) {
    return { success: true, message: "Usuario eliminado exitosamente." };
  }
  return { success: false, message: "Usuario no encontrado." };
}

export async function getSAPOrdersAction(): Promise<SAPOrder[]> {
    await new Promise(resolve => setTimeout(resolve, 500)); 
    return [...sapOrdersStore].sort((a,b) => new Date(b.createdOn || 0).getTime() - new Date(a.createdOn || 0).getTime());
}

