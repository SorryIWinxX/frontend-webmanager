
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
    return NextResponse.json({ error: "Notice ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validationResult = UpdateMaintenanceNoticeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid input", details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const existingNotice = await getMaintenanceNoticeByIdForAPI(id);
    if (!existingNotice) {
        return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    const updatedNotice = await updateMaintenanceNoticeAction(id, validationResult.data);
    
    if (!updatedNotice) { 
        return NextResponse.json({ error: "Notice not found or update failed" }, { status: 404 });
    }
    
    return NextResponse.json(updatedNotice, { status: 200 });

  } catch (error) {
    console.error(`Error updating maintenance notice ${id}:`, error);
    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Notice ID is required" }, { status: 400 });
  }

  try {
    const notice = await getMaintenanceNoticeByIdForAPI(id);
    if (!notice) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }
    return NextResponse.json(notice, { status: 200 });
  } catch (error) {
    console.error(`Error fetching maintenance notice ${id}:`, error);
    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
