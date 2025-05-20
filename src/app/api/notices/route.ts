
import { NextResponse, type NextRequest } from 'next/server';
import { CreateMaintenanceNoticeSchema } from '@/lib/schemas';
import { 
    createMaintenanceNoticeAction, 
    getAllMaintenanceNoticesForAPI 
} from '@/app/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = CreateMaintenanceNoticeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid input", details: validationResult.error.flatten() }, { status: 400 });
    }

    const newNotice = await createMaintenanceNoticeAction(validationResult.data);
    return NextResponse.json(newNotice, { status: 201 });

  } catch (error) {
    console.error("Error creating maintenance notice:", error);
    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
     if (error instanceof SyntaxError) { // Specifically catch JSON parsing errors
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const notices = await getAllMaintenanceNoticesForAPI();
    return NextResponse.json(notices, { status: 200 });
  } catch (error) {
    console.error("Error fetching maintenance notices:", error);
    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
