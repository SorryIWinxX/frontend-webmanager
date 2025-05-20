
import { NextResponse, type NextRequest } from 'next/server';
import { getSAPOrdersAction } from '@/app/actions';

export async function GET(request: NextRequest) {
  try {
    const sapOrders = await getSAPOrdersAction();
    return NextResponse.json(sapOrders, { status: 200 });
  } catch (error) {
    console.error("Error fetching SAP orders:", error);
    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
