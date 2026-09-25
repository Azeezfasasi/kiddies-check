import type { NextRequest } from "next/server";
import { createProject, getAllProjects } from "../../server/controllers/projectController";
import { requireAccess } from "@/app/server/lib/requireAccess";

export async function GET(req: NextRequest) {
  // List all projects
  return getAllProjects(req);
}

export async function POST(req: NextRequest) {
  const denied = await requireAccess(req, "site-content");
  if (denied) return denied;
  // Create a new project (with images)
  return createProject(req);
}