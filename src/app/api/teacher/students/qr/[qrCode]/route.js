import Student from "@/app/server/models/Student";
import User from "@/app/server/models/User";
import { connectDB } from "@/utils/db";

export async function GET(req, { params }) {
  try {
    const { qrCode } = await params;
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");

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

    // Normalize: trim whitespace and ensure uppercase match (some scanners lowercase)
    const normalizedQr = qrCode?.trim()?.toUpperCase();
    console.log("[QR Lookup] Received:", JSON.stringify(qrCode), "Normalized:", JSON.stringify(normalizedQr), "School:", schoolId);

    // Try 1: Exact match
    let student = await Student.findOne({
      qrCode: normalizedQr,
      school: schoolId,
      isActive: true,
    })
      .populate("class", "name level section")
      .populate("parent", "firstName lastName email phone");

    // Try 2: Parse QR format KC-STU-{schoolId}-{studentId}-{random} and lookup by student ID
    if (!student && normalizedQr) {
      const parts = normalizedQr.split("-");
      // Expected: ["KC", "STU", schoolId, studentId, random]
      if (parts.length >= 4) {
        const extractedStudentId = parts[3]; // 24-char hex ObjectId
        console.log("[QR Lookup] Fallback: trying studentId:", extractedStudentId);
        student = await Student.findOne({
          _id: extractedStudentId,
          school: schoolId,
          isActive: true,
        })
          .populate("class", "name level section")
          .populate("parent", "firstName lastName email phone");
        if (student) {
          console.log("[QR Lookup] Fallback found student:", student.firstName, student.lastName);
          // Optionally update the qrCode if it was missing
          if (!student.qrCode) {
            await Student.findByIdAndUpdate(student._id, { qrCode: normalizedQr });
            console.log("[QR Lookup] Updated missing qrCode for student");
          }
        }
      }
    }

    // Try 3: Case-insensitive regex match on qrCode
    if (!student && normalizedQr) {
      student = await Student.findOne({
        qrCode: { $regex: new RegExp(`^${normalizedQr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        school: schoolId,
        isActive: true,
      })
        .populate("class", "name level section")
        .populate("parent", "firstName lastName email phone");
      if (student) {
        console.log("[QR Lookup] Regex fallback found student:", student.firstName, student.lastName);
      }
    }

    if (!student) {
      console.log("[QR Lookup] All lookups failed for:", normalizedQr);
      return Response.json({ error: "Student not found with this QR code" }, { status: 404 });
    }

    return Response.json(
      {
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          enrollmentNo: student.enrollmentNo,
          qrCode: student.qrCode,
          gender: student.gender,
          class: student.class,
          parent: student.parent,
          photo: student.photo,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[QR Lookup Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

