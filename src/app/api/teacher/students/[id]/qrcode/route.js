import Student from "@/app/server/models/Student";
import User from "@/app/server/models/User";
import { connectDB } from "@/utils/db";
import QRCode from "qrcode";
import crypto from "crypto";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const regenerate = req.nextUrl.searchParams.get("regenerate") === "true";

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

    const student = await Student.findOne({ _id: id, school: schoolId });
    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    let qrCodeString = student.qrCode;

    if (!qrCodeString || regenerate) {
      qrCodeString = `KC-STU-${schoolId}-${student._id.toString()}-${crypto.randomBytes(4).toString("hex")}`.toUpperCase();
      student.qrCode = qrCodeString;
      await student.save();
    }

    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeString, {
      width: 400,
      margin: 2,
      color: {
        dark: "#1e3a8a",
        light: "#ffffff",
      },
    });

    return Response.json(
      {
        qrCodeString,
        qrCodeDataUrl,
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          enrollmentNo: student.enrollmentNo,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[QR Code Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

