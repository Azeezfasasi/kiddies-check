import Subject from "@/app/server/models/Subject";
import User from "@/app/server/models/User";
import { connectDB } from "@/utils/db";

export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const { schoolId, name, code, description, classes, teacher, creditHours, curriculum, assessmentType } =
      await req.json();

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Verify user has access to this school
    const user = await User.findById(userId);
    if (!user || !user.schoolId.equals(schoolId) && !user.managedSchools?.includes(schoolId)) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    // Check if subject already exists
    const existing = await Subject.findOne({ school: schoolId, name });
    if (existing) {
      return Response.json({ error: "Subject with this name already exists" }, { status: 400 });
    }

    const newSubject = await Subject.create({
      school: schoolId,
      name,
      code: code || "",
      description,
      classes: classes || [],
      teacher: teacher || userId,
      creditHours: creditHours || 0,
      curriculum: curriculum || "",
      assessmentType: assessmentType || "formative",
      createdBy: userId,
    });

    await newSubject.populate("teacher", "firstName lastName email");

    return Response.json(
      { message: "Subject created successfully", subject: newSubject },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Subjects Create Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const classId = req.nextUrl.searchParams.get("classId");

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Verify user has access to this school
    const user = await User.findById(userId);
    if (!user || !user.schoolId.equals(schoolId) && !user.managedSchools?.includes(schoolId)) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    const query = { school: schoolId, isActive: true };

    const subjects = await Subject.find(query)
      .populate("teacher", "firstName lastName email")
      .sort({ name: 1 });

    // Filter by class if provided
    let filtered = subjects;
    if (classId) {
      filtered = subjects.filter((s) => s.classes.some((c) => c.toString() === classId));
    }

    return Response.json({ subjects: filtered }, { status: 200 });
  } catch (error) {
    console.error("[Subjects Get Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
