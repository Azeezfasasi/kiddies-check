import { NextResponse } from 'next/server';
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  reorderClients,
} from '@/app/server/controllers/clientController';

export async function GET() {
  const result = await getClients();
  return NextResponse.json(result);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await createClient(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create client' },
      { status: 400 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();

    if (body.reorder && body.clientIds) {
      const result = await reorderClients(body.clientIds);
      return NextResponse.json(result);
    }

    if (!body.clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const result = await updateClient(body.clientId, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update client' },
      { status: 400 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('id');

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteClient(clientId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete client' },
      { status: 400 }
    );
  }
}
