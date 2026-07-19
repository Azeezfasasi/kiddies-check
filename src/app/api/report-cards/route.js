import { NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import ReportCard from "@/app/server/models/ReportCard";
import Student from "@/app/server/models/Student";
import Class from "@/app/server/models/Class";
import User from "@/app/server/models/User";

const allowedRoles = ["admin", "learning-specialist", "school-leader", "teacher"];

async function canAccessSchool(user, schoolId) {
  if (!user) return false;
  if (allowedRoles.includes(user.role)) {
    if (user.role === "admin" || user.role === "learning-specialist") return true;
    if (user.schoolId && user.schoolId.toString() === schoolId) return true;
    if (user.managedSchools && user.managedSchools.some((id) => id.toString() === schoolId)) return true;
    return false;
  }
  return false;
}

export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();

    if (!userId || !body.schoolId || !body.studentId || !body.classId || !body.term || !body.academicYear || !body.cardType) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user || !(await canAccessSchool(user, body.schoolId))) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    const student = await Student.findOne({ _id: body.studentId, school: body.schoolId });
    if (!student) {
      return NextResponse.json({ success: false, message: "Student not found in this school" }, { status: 404 });
    }

    const schoolClass = await Class.findOne({ _id: body.classId, school: body.schoolId });
    if (!schoolClass) {
      return NextResponse.json({ success: false, message: "Class not found in this school" }, { status: 404 });
    }

    const existing = await ReportCard.findOne({
      school: body.schoolId,
      student: body.studentId,
      cardType: body.cardType,
      term: body.term,
      academicYear: body.academicYear,
    });

    if (existing) {
      return NextResponse.json({ success: false, message: "A report card already exists for this student, term and academic year" }, { status: 409 });
    }

    const reportCard = await ReportCard.create({
      school: body.schoolId,
      student: body.studentId,
      class: body.classId,
      createdBy: userId,
      cardType: body.cardType,
      term: body.term,
      academicYear: body.academicYear,
      status: body.status || "draft",
      nurseryData: body.cardType === "nursery" ? body.nurseryData || null : null,
      primaryData: body.cardType === "primary" ? body.primaryData || null : null,
      notes: body.notes || "",
    });

    return NextResponse.json({ success: true, reportCard }, { status: 201 });
  } catch (error) {
    console.error("[ReportCards POST Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const studentName = req.nextUrl.searchParams.get("studentName") || "";
    const className = req.nextUrl.searchParams.get("className") || "";
    const cardType = req.nextUrl.searchParams.get("cardType") || "";

    if (!userId || !schoolId) {
      return NextResponse.json({ success: false, message: "User and school information required" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user || !(await canAccessSchool(user, schoolId))) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    const query = { school: schoolId };
    if (cardType) query.cardType = cardType;

    const reportCards = await ReportCard.find(query)
      .populate({ path: "student", select: "firstName lastName enrollmentNo" })
      .populate({ path: "class", select: "name level section" })
      .populate({ path: "createdBy", select: "firstName lastName role" })
      .sort({ createdAt: -1 });

    const filtered = reportCards.filter((card) => {
      const studentText = `${card.student?.firstName || ""} ${card.student?.lastName || ""}`.toLowerCase();
      const classText = `${card.class?.name || ""}`.toLowerCase();
      return (!studentName || studentText.includes(studentName.toLowerCase())) && (!className || classText.includes(className.toLowerCase()));
    });

    return NextResponse.json({ success: true, reportCards: filtered }, { status: 200 });
  } catch (error) {
    console.error("[ReportCards GET Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
