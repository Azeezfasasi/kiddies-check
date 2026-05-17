import ProspectiveStudent from "@/app/server/models/ProspectiveStudent";
import Student from "@/app/server/models/Student";
import User from "@/app/server/models/User";
import Class from "@/app/server/models/Class";
import School from "@/app/server/models/School";
import { connectDB } from "@/utils/db";
import { Types } from "mongoose";

// GET - Fetch prospective students
export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const status = req.nextUrl.searchParams.get("status"); // pending, approved, rejected
    const searchQuery = req.nextUrl.searchParams.get("search");

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(schoolId)) {
      return Response.json({ error: "Invalid ID format" }, { status: 400 });
    }

    await connectDB();

    // Verify user has permission
    const user = await User.findById(userId);
    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    // Only admin, school-leader, and learning-specialist can view prospective students
    const hasAccess = ['admin', 'school-leader', 'learning-specialist'].includes(user.role) &&
      (user.role === 'admin' || user.schoolId?.equals(schoolId));

    if (!hasAccess) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    // Build filter
    const filter = { school: schoolId };
    
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i");
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { parentName: searchRegex },
      ];
    }

    const prospectiveStudents = await ProspectiveStudent.find(filter)
      .populate("classId", "name level section")
      .populate("registeredBy", "firstName lastName email role")
      .populate("approvedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    const stats = await ProspectiveStudent.aggregate([
      { $match: { school: new Types.ObjectId(schoolId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statsMap = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    stats.forEach((stat) => {
      statsMap[stat._id] = stat.count;
    });

    return Response.json({
      prospectiveStudents,
      stats: statsMap,
    }, { status: 200 });
  } catch (error) {
    console.error("[Prospective Students GET Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create prospective student (used during parent registration)
export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      gradeLevel,
      classId,
      schoolId,
      schoolType,
      picture,
      parentId,
      parentName,
      parentEmail,
      parentPhone,
    } = body;

    if (!firstName || !lastName || !schoolId || !parentId) {
      return Response.json(
        { error: "First name, last name, school ID, and parent ID are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const prospectiveStudent = new ProspectiveStudent({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      gradeLevel,
      classId,
      school: schoolId,
      schoolType,
      picture,
      registeredBy: parentId,
      parentId,
      parentName,
      parentEmail,
      parentPhone,
      status: "pending",
    });

    await prospectiveStudent.save();

    return Response.json({
      message: "Student registered for approval",
      prospectiveStudent,
    }, { status: 201 });
  } catch (error) {
    console.error("[Prospective Student POST Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Approve or reject prospective student
export async function PUT(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    
    const {
      prospectiveStudentId,
      action, // 'approve' or 'reject'
      notes,
      rejectionReason,
    } = body;

    if (!prospectiveStudentId || !action || !['approve', 'reject'].includes(action)) {
      return Response.json(
        { error: "Prospective student ID and valid action (approve/reject) are required" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(prospectiveStudentId)) {
      return Response.json({ error: "Invalid ID format" }, { status: 400 });
    }

    await connectDB();

    // Verify user has permission
    const user = await User.findById(userId);
    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    const prospectiveStudent = await ProspectiveStudent.findById(prospectiveStudentId);
    if (!prospectiveStudent) {
      return Response.json({ error: "Prospective student not found" }, { status: 404 });
    }

    // Verify user has access to this school
    const hasAccess = ['admin', 'school-leader', 'learning-specialist'].includes(user.role) &&
      (user.role === 'admin' || user.schoolId?.equals(prospectiveStudent.school));

    if (!hasAccess) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    if (action === "approve") {
      // Generate enrollment number
      const existingCount = await Student.countDocuments({
        school: prospectiveStudent.school,
      });

      const enrollmentNo = `KIDSTU-${String(existingCount + 1).padStart(6, "0")}`;

      // Look up the class by className and schoolId
      let classId = prospectiveStudent.classId;
      
      console.log(`[Approval] Prospective student: ${prospectiveStudent.firstName} ${prospectiveStudent.lastName}`);
      console.log(`[Approval] classId: ${classId}, className: ${prospectiveStudent.className}`);
      
      if (!classId && prospectiveStudent.className) {
        console.log(`[Approval] Looking up class by name: "${prospectiveStudent.className}" in school: ${prospectiveStudent.school}`);
        
        let classRecord = await Class.findOne({
          name: prospectiveStudent.className,
          school: prospectiveStudent.school,
        });
        
        if (classRecord) {
          classId = classRecord._id;
          console.log(`[Approval] ✅ Found class: ${classRecord.name} (${classRecord._id})`);
        } else {
          // Try case-insensitive search
          console.log(`[Approval] ❌ Exact match not found. Trying case-insensitive search...`);
          classRecord = await Class.findOne({
            name: new RegExp(`^${prospectiveStudent.className}$`, 'i'),
            school: prospectiveStudent.school,
          });
          
          if (classRecord) {
            classId = classRecord._id;
            console.log(`[Approval] ✅ Found class (case-insensitive): ${classRecord.name}`);
          } else {
            // Class doesn't exist, auto-create it
            console.log(`[Approval] Class not found. Auto-creating class: "${prospectiveStudent.className}"`);
            
            // Determine level based on class name
            const className = prospectiveStudent.className.toUpperCase();
            let level = 'primary';
            if (className.includes('JSS') || className.includes('SS') || className.includes('JS')) {
              level = 'secondary';
            }
            
            try {
              const newClass = new Class({
                name: prospectiveStudent.className,
                school: prospectiveStudent.school,
                level: level,
                isActive: true,
              });
              
              await newClass.save();
              classId = newClass._id;
              
              console.log(`[Approval] ✅ Auto-created new class: ${prospectiveStudent.className} (${level}) with ID: ${classId}`);
            } catch (classError) {
              console.error(`[Approval] ❌ Failed to auto-create class:`, classError.message);
              return Response.json(
                { error: `Failed to create class "${prospectiveStudent.className}": ${classError.message}` },
                { status: 400 }
              );
            }
          }
        }
      }
      
      if (!classId) {
        return Response.json(
          { error: "Class ID is required to approve a student. Please assign a class first." },
          { status: 400 }
        );
      }

      // Create actual student
      const student = new Student({
        firstName: prospectiveStudent.firstName,
        lastName: prospectiveStudent.lastName,
        dateOfBirth: prospectiveStudent.dateOfBirth,
        gender: prospectiveStudent.gender,
        gradeLevel: prospectiveStudent.gradeLevel,
        class: classId,
        school: prospectiveStudent.school,
        schoolType: prospectiveStudent.schoolType,
        picture: prospectiveStudent.picture,
        phone: prospectiveStudent.phone,
        email: prospectiveStudent.email,
        enrollmentNo,
        parent: prospectiveStudent.parentId,
        parentAssignedAt: new Date(),
        parentAssignedBy: userId,
        isActive: true,
      });

      await student.save();

      // Update prospective student
      prospectiveStudent.status = "approved";
      prospectiveStudent.approvalNotes = notes;
      prospectiveStudent.approvedBy = userId;
      prospectiveStudent.approvedAt = new Date();
      prospectiveStudent.approvedStudentId = student._id;
      await prospectiveStudent.save();

      return Response.json({
        message: "Student approved and added to school",
        student,
        prospectiveStudent,
      }, { status: 200 });
    } else if (action === "reject") {
      prospectiveStudent.status = "rejected";
      prospectiveStudent.rejectionReason = rejectionReason;
      prospectiveStudent.approvedBy = userId;
      prospectiveStudent.rejectedAt = new Date();
      await prospectiveStudent.save();

      return Response.json({
        message: "Student rejected",
        prospectiveStudent,
      }, { status: 200 });
    }
  } catch (error) {
    console.error("[Prospective Student PUT Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
