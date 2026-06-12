/**
 * Diagnostic script to debug attendance search issues
 * Run with: node diagnose-attendance.js
 */

import { connectDB } from "./src/utils/db.js";
import Student from "./src/app/server/models/Student.js";
import User from "./src/app/server/models/User.js";

async function diagnoseAttendance() {
  try {
    console.log("🔍 Starting Attendance Search Diagnostic...\n");

    await connectDB();
    console.log("✅ Database connected\n");

    // Get all schools
    const schools = await User.distinct("schoolId");
    console.log(`📊 Found ${schools.length} schools with users\n`);

    for (const schoolId of schools) {
      console.log(`\n=== Checking School: ${schoolId} ===`);

      // Count active students
      const activeStudents = await Student.countDocuments({
        school: schoolId,
        isActive: true,
      });

      // Count inactive students
      const inactiveStudents = await Student.countDocuments({
        school: schoolId,
        isActive: false,
      });

      // Count all students
      const totalStudents = await Student.countDocuments({
        school: schoolId,
      });

      console.log(`Total students: ${totalStudents}`);
      console.log(`  ├─ Active (isActive: true): ${activeStudents} ✅`);
      console.log(`  └─ Inactive (isActive: false): ${inactiveStudents} ❌`);

      if (activeStudents === 0 && totalStudents > 0) {
        console.log(`\n⚠️  WARNING: All ${totalStudents} students are INACTIVE!`);
        
        // Show sample inactive students
        const samples = await Student.find({ school: schoolId, isActive: false })
          .select("firstName lastName enrollmentNo isActive")
          .limit(3);
        
        console.log("\nSample inactive students:");
        samples.forEach((s) => {
          console.log(`  - ${s.firstName} ${s.lastName} (${s.enrollmentNo}) [isActive: ${s.isActive}]`);
        });

        console.log("\n💡 FIX: Run this command to activate all students:");
        console.log(`   db.students.updateMany({ school: ObjectId("${schoolId}"), isActive: false }, { $set: { isActive: true } })`);
      }

      if (activeStudents > 0) {
        console.log(`\n✅ Good! Here are the first 5 active students:`);
        const students = await Student.find({
          school: schoolId,
          isActive: true,
        })
          .select("firstName lastName enrollmentNo class")
          .populate("class", "name")
          .limit(5);

        students.forEach((s) => {
          console.log(`  - ${s.firstName} ${s.lastName} (${s.enrollmentNo}) - Class: ${s.class?.name || "N/A"}`);
        });
      }
    }

    console.log("\n✅ Diagnosis complete!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

diagnoseAttendance();
