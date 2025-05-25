
import { NextResponse, type NextRequest } from 'next/server';
import { UpdateMaintenanceNoticeSchema } from '@/lib/schemas';
import {
    updateMaintenanceNoticeAction,
    getMaintenanceNoticeByIdForAPI
} from '@/app/actions';

interface RouteParams {
  params: { id: string };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "ID de aviso es requerido" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validationResult = UpdateMaintenanceNoticeSchema.safeParse(body);

    if (!validationResult.success) {
      console.error("Validation errors:", validationResult.error.flatten());
      return NextResponse.json({ error: "Entrada inválida", details: validationResult.error.flatten() }, { status: 400 });
    }

    const existingNotice = await getMaintenanceNoticeByIdForAPI(id);
    if (!existingNotice) {
        return NextResponse.json({ error: "Aviso no encontrado" }, { status: 404 });
    }

    const updatedNotice = await updateMaintenanceNoticeAction(id, validationResult.data);

    if (!updatedNotice) { // Should not happen if existingNotice check passes, but as a safeguard
        return NextResponse.json({ error: "Aviso no encontrado o actualización fallida" }, { status: 404 });
    }

    return NextResponse.json(updatedNotice, { status: 200 });

  } catch (error) {
    console.error(`Error al actualizar aviso de mantenimiento ${id}:`, error);
    let errorMessage = "Error interno del servidor";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Payload JSON inválido" }, { status: 400 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "ID de aviso es requerido" }, { status: 400 });
  }

  try {
    const notice = await getMaintenanceNoticeByIdForAPI(id);
    if (!notice) {
      return NextResponse.json({ error: "Aviso no encontrado" }, { status: 404 });
    }
    return NextResponse.json(notice, { status: 200 });
  } catch (error) {
    console.error(`Error al obtener aviso de mantenimiento ${id}:`, error);
    let errorMessage = "Error interno del servidor";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
