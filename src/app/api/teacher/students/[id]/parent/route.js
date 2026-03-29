import Student from "@/app/server/models/Student";
import User from "@/app/server/models/User";
import { connectDB } from "@/utils/db";

export async function GET(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const { id } = await params;

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Verify user access
    const user = await User.findById(userId);
    
    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Allow admin and learning-specialist full access to any school
    if (!['admin', 'learning-specialist'].includes(user.role)) {
      const hasSchoolAccess = 
        (user?.schoolId && user.schoolId.toString() === schoolId) || 
        (user?.managedSchools && user.managedSchools.some(s => s.toString() === schoolId));
      
      if (!hasSchoolAccess) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }

    await connectDB();

    const student = await Student.findOne({ _id: id, school: schoolId })
      .populate({
        path: 'parent',
        select: 'firstName lastName email phone avatar'
      })
      .select('parent parentAssignedAt parentAssignedBy');

    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    return Response.json({ parent: student.parent, assignedAt: student.parentAssignedAt }, { status: 200 });
  } catch (error) {
    console.error("[Get Parent Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const { id } = await params;
    const { parentId } = await req.json();

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Verify user is admin, school-leader, or teacher
    const user = await User.findById(userId);
    
    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    const allowedRoles = ['admin', 'learning-specialist', 'school-leader', 'teacher'];
    if (!allowedRoles.includes(user.role)) {
      return Response.json({ error: "Only staff can assign parents" }, { status: 403 });
    }
    
    // Allow admin and learning-specialist full access to any school
    if (!['admin', 'learning-specialist'].includes(user.role)) {
      const hasSchoolAccess = 
        (user?.schoolId && user.schoolId.toString() === schoolId) || 
        (user?.managedSchools && user.managedSchools.some(s => s.toString() === schoolId));
      
      if (!hasSchoolAccess) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }

    await connectDB();

    // Verify student exists
    const student = await Student.findOne({ _id: id, school: schoolId });
    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    // Verify parent exists and is actually a parent or can be assigned as parent
    if (parentId) {
      const parentUser = await User.findById(parentId);
      if (!parentUser) {
        return Response.json({ error: "Parent user not found" }, { status: 404 });
      }

      // Allow parent role or other roles to be assigned as parent
      // This gives flexibility for users with different roles
      if (!['parent', 'admin', 'teacher', 'school-leader', 'learning-specialist'].includes(parentUser.role)) {
        return Response.json({ error: "Invalid user for parent assignment" }, { status: 400 });
      }

      // Update student with parent
      const updatedStudent = await Student.findByIdAndUpdate(
        id,
        {
          parent: parentId,
          parentAssignedAt: new Date(),
          parentAssignedBy: userId,
          updatedAt: new Date(),
        },
        { new: true }
      ).populate({
        path: 'parent',
        select: 'firstName lastName email phone avatar'
      });

      return Response.json(
        { message: "Parent assigned successfully", student: updatedStudent },
        { status: 200 }
      );
    } else {
      // Remove parent assignment
      const updatedStudent = await Student.findByIdAndUpdate(
        id,
        {
          parent: null,
          parentAssignedAt: null,
          parentAssignedBy: null,
          updatedAt: new Date(),
        },
        { new: true }
      );

      return Response.json(
        { message: "Parent assignment removed", student: updatedStudent },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("[Update Parent Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
