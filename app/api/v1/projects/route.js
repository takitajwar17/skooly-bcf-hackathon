import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getProjects, createProject } from "@/lib/actions/project";

/**
 * GET /api/v1/projects
 * List all projects for the authenticated user.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await getProjects();
    return NextResponse.json({ data: projects });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/v1/projects
 * Create a new project.
 * Body: { "title": "My Project", "description": "..." }
 */
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const project = await createProject(title, description);
    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
