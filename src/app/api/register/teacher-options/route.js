/**
 * GET /api/register/teacher-options
 * Fetches available classes and subjects for teacher registration
 * This endpoint is public (no authentication required) to support the registration flow
 */

import Class from "@/app/server/models/Class";
import Subject from "@/app/server/models/Subject";
import { connectDB } from "@/utils/db";

export async function GET(req) {
  try {
    await connectDB();

    // Fetch all active classes and subjects from the database
    // These will be available for newly registering teachers
    const classes = await Class.find({ isActive: true })
      .select("name level section")
      .distinct("name")
      .sort({ name: 1 });

    const subjects = await Subject.find({ isActive: true })
      .select("name")
      .distinct("name")
      .sort({ name: 1 });

    // If no classes or subjects found in DB, use default options
    const defaultClasses = [
      "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
      "JSS 1", "JSS 2", "JSS 3",
      "SS 1", "SS 2", "SS 3"
    ];

    const defaultSubjects = [
      "Mathematics", "English Language", "Science", "Social Studies", "Civic Education",
      "Physical Education", "Fine Arts", "Computer Studies", "Yoruba", "French",
      "History", "Geography", "Chemistry", "Physics", "Biology", "Literature in English"
    ];

    const finalClasses = classes.length > 0 ? classes : defaultClasses;
    const finalSubjects = subjects.length > 0 ? subjects : defaultSubjects;

    return Response.json(
      {
        success: true,
        data: {
          classes: finalClasses,
          subjects: finalSubjects,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Teacher Options Get Error]", error);

    // Return default options even on error
    const defaultClasses = [
      "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
      "JSS 1", "JSS 2", "JSS 3",
      "SS 1", "SS 2", "SS 3"
    ];

    const defaultSubjects = [
      "Mathematics", "English Language", "Science", "Social Studies", "Civic Education",
      "Physical Education", "Fine Arts", "Computer Studies", "Yoruba", "French",
      "History", "Geography", "Chemistry", "Physics", "Biology", "Literature in English"
    ];

    return Response.json(
      {
        success: true,
        data: {
          classes: defaultClasses,
          subjects: defaultSubjects,
        },
      },
      { status: 200 }
    );
  }
}
