import {
  getServices,
  createService,
  updateService,
  deleteService,
  reorderServices,
} from "../../server/controllers/servicesController";

// GET all services
export async function GET() {
  try {
    const services = await getServices();
    return Response.json({ success: true, services });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST new service
export async function POST(req) {
  try {
    const serviceData = await req.json();

    if (!serviceData.title || !serviceData.shortDesc) {
      return Response.json(
        { success: false, error: "Title and short description are required" },
        { status: 400 }
      );
    }

    const newService = await createService(serviceData);
    return Response.json({ success: true, service: newService }, { status: 201 });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT for updating or reordering
export async function PUT(req) {
  try {
    const body = await req.json();

    // If it's a reorder request with array of IDs
    if (body.reorder && Array.isArray(body.serviceIds)) {
      const reorderedServices = await reorderServices(body.serviceIds);
      return Response.json({ success: true, services: reorderedServices });
    }

    // Otherwise it's an update of a single service
    if (!body.serviceId) {
      return Response.json(
        { success: false, error: "serviceId is required" },
        { status: 400 }
      );
    }

    const updatedService = await updateService(body.serviceId, body);
    return Response.json({ success: true, service: updatedService });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE a service
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get('id');

    if (!serviceId) {
      return Response.json(
        { success: false, error: "Service ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteService(serviceId);
    return Response.json({ success: true, ...result });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
