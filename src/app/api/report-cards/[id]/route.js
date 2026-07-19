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

export async function GET(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const { id } = await params;

    if (!userId || !id) {
      return NextResponse.json({ success: false, message: "User and report card id required" }, { status: 400 });
    }

    await connectDB();

    const reportCard = await ReportCard.findById(id)
      .populate({ path: "student", select: "firstName lastName enrollmentNo" })
      .populate({ path: "class", select: "name level section" })
      .populate({ path: "createdBy", select: "firstName lastName role" });

    if (!reportCard) {
      return NextResponse.json({ success: false, message: "Report card not found" }, { status: 404 });
    }

    const user = await User.findById(userId);
    if (!user || !(await canAccessSchool(user, reportCard.school.toString()))) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ success: true, reportCard }, { status: 200 });
  } catch (error) {
    console.error("[ReportCard GET by ID Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    const { id } = await params;

    if (!userId || !id) {
      return NextResponse.json({ success: false, message: "User and report card id required" }, { status: 400 });
    }

    await connectDB();

    const existing = await ReportCard.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: "Report card not found" }, { status: 404 });
    }

    const user = await User.findById(userId);
    if (!user || !(await canAccessSchool(user, existing.school.toString()))) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    const payload = {
      term: body.term || existing.term,
      academicYear: body.academicYear || existing.academicYear,
      status: body.status || existing.status,
      notes: body.notes ?? existing.notes,
    };

    if (existing.cardType === "nursery") {
      payload.nurseryData = body.nurseryData || existing.nurseryData;
    } else {
      payload.primaryData = body.primaryData || existing.primaryData;
    }

    const updated = await ReportCard.findByIdAndUpdate(id, payload, { new: true })
      .populate({ path: "student", select: "firstName lastName enrollmentNo" })
      .populate({ path: "class", select: "name level section" });

    return NextResponse.json({ success: true, reportCard: updated }, { status: 200 });
  } catch (error) {
    console.error("[ReportCard PUT Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const { id } = await params;

    if (!userId || !id) {
      return NextResponse.json({ success: false, message: "User and report card id required" }, { status: 400 });
    }

    await connectDB();

    const reportCard = await ReportCard.findById(id);
    if (!reportCard) {
      return NextResponse.json({ success: false, message: "Report card not found" }, { status: 404 });
    }

    const user = await User.findById(userId);
    if (!user || !(await canAccessSchool(user, reportCard.school.toString()))) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    await reportCard.deleteOne();

    return NextResponse.json({ success: true, message: "Report card deleted" }, { status: 200 });
  } catch (error) {
    console.error("[ReportCard DELETE Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
