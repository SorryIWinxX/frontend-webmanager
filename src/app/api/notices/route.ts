
import { NextResponse, type NextRequest } from 'next/server';
import { CreateMaintenanceNoticeSchema } from '@/lib/schemas';
import {
    createMaintenanceNoticeAction,
    getNotices
} from '@/app/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = CreateMaintenanceNoticeSchema.safeParse(body);

    if (!validationResult.success) {
      console.error("Validation errors:", validationResult.error.flatten());
      return NextResponse.json({ error: "Entrada inválida", details: validationResult.error.flatten() }, { status: 400 });
    }

    const newNotice = await createMaintenanceNoticeAction(validationResult.data);
    return NextResponse.json(newNotice, { status: 201 });

  } catch (error) {
    console.error("Error al crear aviso de mantenimiento:", error);
    let errorMessage = "Error interno del servidor";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
     if (error instanceof SyntaxError) { // Specifically for JSON parsing errors
      return NextResponse.json({ error: "Payload JSON inválido" }, { status: 400 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const notices = await getNotices();
    return NextResponse.json(notices, { status: 200 });
  } catch (error) {
    console.error("Error al obtener avisos de mantenimiento:", error);
    let errorMessage = "Error interno del servidor";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
