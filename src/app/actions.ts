
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
  // Return a deep copy and sort by creation date (newest first)
  return [...noticesStore].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}


export async function getMaintenanceNoticeByIdForAPI(id: string): Promise<MaintenanceNoticeAPI | undefined> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const notice = noticesStore.find(notice => notice.id === id);
    return notice ? {...notice} : undefined; // Return a copy
}


export async function createMaintenanceNoticeAction(data: CreateMaintenanceNoticeInput): Promise<MaintenanceNoticeAPI> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newId = String(Date.now());
    const now = new Date().toISOString();

    const newNotice: MaintenanceNoticeAPI = {
        ...data, // Spread validated data from schema
        id: newId,
        status: "Pendiente",
        createdAt: now,
        updatedAt: now,
        // imageUrl and data_ai_hint can be part of `data` if included in schema and form
        // or set defaults here
        imageUrl: data.imageUrl || "https://placehold.co/600x400.png?text=AvisoNuevo",
        data_ai_hint: data.data_ai_hint || "aviso mantenimiento",
    };
    noticesStore.unshift(newNotice);
    return {...newNotice}; // Return a copy
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
    return {...updatedNotice}; // Return a copy
}


export async function sendNoticesToSAP(noticeIds: string[]): Promise<{ success: boolean; message: string }> {
  console.log("Enviando avisos a SAP:", noticeIds);
  await new Promise(resolve => setTimeout(resolve, 1500));

  let noticesUpdatedCount = 0;
  noticesStore = noticesStore.map(notice => {
    if (noticeIds.includes(notice.id) && notice.status === "Pendiente") {
      console.log("Enviando aviso a SAP (mock):", notice.id, notice.textoBreve);
      noticesUpdatedCount++;
      return { ...notice, status: "Enviado" as NoticeStatus, updatedAt: new Date().toISOString() };
    }
    return notice;
  });

  if (noticesUpdatedCount === 0) {
    return { success: false, message: "No se enviaron avisos. Puede que ya estuvieran enviados o no se encontraron." };
  }
  return { success: true, message: `${noticesUpdatedCount} aviso(s) enviado(s) a SAP exitosamente.` };
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
