"use server";

import type { User, Reporter } from "@/types";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";



export async function loginUser(formData: FormData): Promise<{ success: boolean; message: string; user?: User; error?: string }> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username) {
    return { success: false, message: "El nombre de usuario es requerido.", error: "Missing username" };
  }

  if (!password) {
    return { success: false, message: "La contraseña es requerida.", error: "Missing password" };
  }

  const backendUrl = process.env.BACKEND_API_BASE_URL;
  if (!backendUrl) {
    return { success: false, message: "Error de configuración del servidor.", error: "Backend URL not configured" };
  }

  try {
    const response = await fetch(`${backendUrl}/master-user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        message: errorData.message || "Credenciales incorrectas", 
        error: `HTTP ${response.status}` 
      };
    }

    const data = await response.json();
    
    // Mapear la respuesta del backend al formato esperado por el frontend
    const user: User = {
      id: data.id.toString(),
      username: data.username,
    };

    return { success: true, message: data.message || "Inicio de sesión exitoso", user };
  } catch (error) {
    console.error('Error en login:', error);
    return { success: false, message: "Error de conexión con el servidor.", error: "Network error" };
  }
}





export async function syncFromSAP(): Promise<{ success: boolean; message: string; synchronizedData?: string[]; firebaseLogId?: string }> {
  const externalSapApiUrl = process.env.BACKEND_API_BASE_URL; 
  // if (!externalSapApiUrl) {
  //   console.error("Error: BACKEND_API_BASE_URL para SAP no está configurada.");
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

export async function syncTablesFromSAP(): Promise<any> {
  const backendUrl = process.env.BACKEND_API_BASE_URL;
  if (!backendUrl) {
    return { success: false, message: "Error de configuración del servidor.", error: "Backend URL not configured" };
  }
  try {
    const response = await fetch(`${backendUrl}/sap/sincronizar-tablas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error syncing tables from SAP:', error);
    return { success: false, message: "Error de conexión con el servidor.", error: "Network error" };
  }
}












// Reporter API functions
export async function getReporters(): Promise<Reporter[]> {
  const backendUrl = process.env.BACKEND_API_BASE_URL;
  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  try {
    const response = await fetch(`${backendUrl}/reporter-user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch reporters`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching reporters:', error);
    throw error;
  }
}

export async function addReporter(formData: FormData): Promise<{ success: boolean; message: string; reporter?: Reporter; errors?: Array<{ path: string[]; message: string }> }> {
  const cedula = formData.get("cedula") as string;
  const puestoTrabajo = formData.get("puestoTrabajo") as string;

  if (!cedula) {
    return { 
      success: false, 
      message: "La cédula es requerida.",
      errors: [{ path: ["cedula"], message: "La cédula es requerida." }]
    };
  }

  if (!puestoTrabajo) {
    return { 
      success: false, 
      message: "El puesto de trabajo es requerido.",
      errors: [{ path: ["puestoTrabajo"], message: "El puesto de trabajo es requerido." }]
    };
  }

  const backendUrl = process.env.BACKEND_API_BASE_URL;
  if (!backendUrl) {
    return { success: false, message: "Error de configuración del servidor." };
  }

  try {
    const response = await fetch(`${backendUrl}/reporter-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cedula,
        puestoTrabajo: parseInt(puestoTrabajo, 10)
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        message: errorData.message || "Error al crear el reportero" 
      };
    }

    const data = await response.json();
    
    const reporter: Reporter = {
      id: data.id.toString(),
      cedula: data.cedula,
      puestoTrabajo: data.puestoTrabajo,
    };

    return { success: true, message: "Reportero creado exitosamente", reporter };
  } catch (error) {
    console.error('Error creating reporter:', error);
    return { success: false, message: "Error de conexión con el servidor." };
  }
}

export async function deleteReporter(reporterId: string): Promise<{ success: boolean; message: string }> {
  const backendUrl = process.env.BACKEND_API_BASE_URL;
  if (!backendUrl) {
    return { success: false, message: "Error de configuración del servidor." };
  }

  try {
    const response = await fetch(`${backendUrl}/reporter-user/${reporterId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        message: errorData.message || "Error al eliminar el reportero" 
      };
    }

    return { success: true, message: "Reportero eliminado exitosamente" };
  } catch (error) {
    console.error('Error deleting reporter:', error);
    return { success: false, message: "Error de conexión con el servidor." };
  }
}

// Maintenance Notices API functions
export async function getMaintenanceNotices(): Promise<{ success: boolean; message: string; notices?: any[]; error?: string }> {
  const backendUrl = process.env.BACKEND_API_BASE_URL;
  if (!backendUrl) {
    return { success: false, message: "Error de configuración del servidor.", error: "Backend URL not configured" };
  }

  try {
    const response = await fetch(`${backendUrl}/avisos-mantenimiento`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        message: errorData.message || "Error al obtener avisos de mantenimiento", 
        error: `HTTP ${response.status}` 
      };
    }

    const data = await response.json();
    return { success: true, message: "Avisos obtenidos exitosamente", notices: data };
  } catch (error) {
    console.error('Error fetching maintenance notices:', error);
    return { success: false, message: "Error de conexión con el servidor.", error: "Network error" };
  }
}

export async function sendMaintenanceNoticesToSAP(avisoIds: number[]): Promise<{ success: boolean; message: string; error?: string }> {
  const backendUrl = process.env.BACKEND_API_BASE_URL;
  if (!backendUrl) {
    return { success: false, message: "Error de configuración del servidor.", error: "Backend URL not configured" };
  }

  // Validate avisoIds parameter
  if (!avisoIds || !Array.isArray(avisoIds)) {
    return { success: false, message: "Error interno: avisoIds debe ser un array válido.", error: "Invalid avisoIds parameter" };
  }

  if (avisoIds.length === 0) {
    return { success: false, message: "No se proporcionaron avisos para enviar.", error: "Empty avisoIds array" };
  }

  // Validate that all items in the array are numbers
  const invalidIds = avisoIds.filter(id => typeof id !== 'number' || isNaN(id));
  if (invalidIds.length > 0) {
    return { success: false, message: `IDs de aviso inválidos: ${invalidIds.join(', ')}`, error: "Invalid ID values" };
  }

  try {
    console.log('Sending avisoIds to SAP:', avisoIds);
    const response = await fetch(`${backendUrl}/sap/enviar-avisos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        avisosIds: avisoIds
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        message: errorData.message || "Error al enviar avisos a SAP", 
        error: `HTTP ${response.status}` 
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      message: data.message || `${avisoIds.length} avisos enviados a SAP exitosamente` 
    };
  } catch (error) {
    console.error('Error sending maintenance notices to SAP:', error);
    return { success: false, message: "Error de conexión con el servidor.", error: "Network error" };
  }
}
