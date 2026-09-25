import type { NextRequest } from "next/server";
import { createProject, getAllProjects } from "../../server/controllers/projectController";

export async function GET(req: NextRequest) {
  // List all projects
  return getAllProjects(req);
}

export async function POST(req: NextRequest) {
  // Create a new project (with images)
  return createProject(req);
}