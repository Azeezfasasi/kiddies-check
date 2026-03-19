import { createProject, getAllProjects } from "../../server/controllers/projectController";

export async function GET(req) {
  // List all projects
  return getAllProjects(req);
}

export async function POST(req) {
  // Create a new project (with images)
  return createProject(req);
}