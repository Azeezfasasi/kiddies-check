import Attendance from "@/app/server/models/Attendance";
import Student from "@/app/server/models/Student";
import User from "@/app/server/models/User";
import { connectDB } from "@/utils/db";

export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const { schoolId, studentId, date, status, markedVia, note } = await req.json();

    if (!userId || !schoolId || !studentId || !status) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    if (!['admin', 'learning-specialist'].includes(user.role)) {
      const hasAccess =
        (user.schoolId && user.schoolId.toString() === schoolId) ||
        (user.managedSchools && user.managedSchools.some(sid => sid.toString() === schoolId));
      if (!hasAccess) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }

    await connectDB();

    const student = await Student.findOne({ _id: studentId, school: schoolId });
    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOneAndUpdate(
      { student: studentId, school: schoolId, date: attendanceDate },
      {
        status,
        markedBy: userId,
        markedVia: markedVia || "manual",
        note: note || "",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return Response.json(
      { message: "Attendance marked successfully", attendance },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Attendance POST Error]", error);
    if (error.code === 11000) {
      return Response.json({ error: "Attendance already recorded for this date" }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const studentId = req.nextUrl.searchParams.get("studentId");
    const classId = req.nextUrl.searchParams.get("classId");
    const date = req.nextUrl.searchParams.get("date");
    const startDate = req.nextUrl.searchParams.get("startDate");
    const endDate = req.nextUrl.searchParams.get("endDate");

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    if (!['admin', 'learning-specialist'].includes(user.role)) {
      const hasAccess =
        (user.schoolId && user.schoolId.toString() === schoolId) ||
        (user.managedSchools && user.managedSchools.some(sid => sid.toString() === schoolId));
      if (!hasAccess) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }

    await connectDB();

    const query = { school: schoolId };

    if (studentId) query.student = studentId;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      query.date = d;
    }
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      query.date = { $gte: s, $lte: e };
    }

    let attendanceQuery = Attendance.find(query)
      .populate("student", "firstName lastName enrollmentNo qrCode")
      .populate("markedBy", "firstName lastName role")
      .sort({ date: -1, createdAt: -1 });

    if (classId) {
      const studentsInClass = await Student.find({ school: schoolId, class: classId, isActive: true }).select("_id");
      const studentIds = studentsInClass.map(s => s._id.toString());
      const records = await attendanceQuery.lean();
      const filtered = records.filter(r => studentIds.includes(r.student?._id?.toString()));
      return Response.json({ data: filtered }, { status: 200 });
    }

    const attendances = await attendanceQuery.lean();
    return Response.json({ data: attendances }, { status: 200 });
  } catch (error) {
    console.error("[Attendance GET Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

