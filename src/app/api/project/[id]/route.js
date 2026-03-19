import {
  editProject,
  deleteProject,
  getProjectById,
  changeProjectStatus,
  disableProject,
  enableProject,
} from "../../../server/controllers/projectController";

export async function GET(req, context) {
  const params = await context.params;
  return getProjectById(req, params.id);
}

export async function PUT(req, context) {
  const params = await context.params;
  // If status is present in body, change status; else, edit project
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    // Status change
    return changeProjectStatus(req, params.id);
  } else {
    // Edit project (formData)
    return editProject(req, params.id);
  }
}

export async function DELETE(req, context) {
  const params = await context.params;
  return deleteProject(req, params.id);
}

// Custom endpoint for disabling a project (PUT /api/project/[id]?disable=1)
export async function PATCH(req, context) {
  const params = await context.params;
  const url = new URL(req.url);
  const disableParam = url.searchParams.get("disable");
  if (disableParam === "1") {
    return disableProject(req, params.id);
  } else if (disableParam === "0") {
    return enableProject(req, params.id);
  }
  return new Response("Not found", { status: 404 });
}