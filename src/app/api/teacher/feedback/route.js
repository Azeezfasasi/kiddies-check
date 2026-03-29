import Feedback from "@/app/server/models/Feedback";
import User from "@/app/server/models/User";
import Student from "@/app/server/models/Student";
import { connectDB } from "@/utils/db";

export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const studentId = req.nextUrl.searchParams.get("studentId");

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Verify user access
    const user = await User.findById(userId);
    
    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    // Build query
    let query = { school: schoolId };

    if (studentId) {
      query.student = studentId;
    }

    // Permissions:
    // - Admin/Learning-specialist: can see all feedback
    // - School-leader/Teacher: can see feedback for their school
    // - Parent: can only see feedback for their children
    if (user.role === 'parent') {
      // Find all students where this user is the parent
      const studentIds = await Student.find({ parent: userId, school: schoolId }).select('_id');
      query.student = { $in: studentIds.map(s => s._id) };
    } else if (!['admin', 'learning-specialist'].includes(user.role)) {
      const hasSchoolAccess = 
        (user?.schoolId && user.schoolId.toString() === schoolId) || 
        (user?.managedSchools && user.managedSchools.some(s => s.toString() === schoolId));
      
      if (!hasSchoolAccess) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const feedback = await Feedback.find(query)
      .populate('student', 'firstName lastName enrollmentNo')
      .populate('author', 'firstName lastName avatar role')
      .sort({ createdAt: -1 })
      .limit(100);

    return Response.json({ feedback }, { status: 200 });
  } catch (error) {
    console.error("[Get Feedback Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const { schoolId, studentId, title, comment, category, rating } = await req.json();

    if (!userId || !schoolId || !studentId || !title || !comment) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify user exists and get their role
    const user = await User.findById(userId);
    
    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    const allowedRoles = ['admin', 'learning-specialist', 'school-leader', 'teacher', 'parent'];
    if (!allowedRoles.includes(user.role)) {
      return Response.json({ error: "User cannot create feedback" }, { status: 403 });
    }

    await connectDB();

    // Verify student exists
    const student = await Student.findOne({ _id: studentId, school: schoolId });
    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    // Permission checks
    if (user.role === 'parent') {
      // Parent can only add feedback to their own children
      if (!student.parent || student.parent.toString() !== userId) {
        return Response.json({ error: "Unauthorized to add feedback for this student" }, { status: 403 });
      }
    } else if (!['admin', 'learning-specialist'].includes(user.role)) {
      // Teachers and school-leaders need to be in the same school
      const hasSchoolAccess = 
        (user?.schoolId && user.schoolId.toString() === schoolId) || 
        (user?.managedSchools && user.managedSchools.some(s => s.toString() === schoolId));
      
      if (!hasSchoolAccess) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const newFeedback = await Feedback.create({
      student: studentId,
      school: schoolId,
      author: userId,
      authorRole: user.role,
      title,
      comment,
      category: category || 'general',
      rating: rating || undefined,
      replies: [],
    });

    await newFeedback.populate('author', 'firstName lastName avatar role');

    return Response.json(
      { message: "Feedback created successfully", feedback: newFeedback },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Create Feedback Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
