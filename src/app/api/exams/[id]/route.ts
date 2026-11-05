import { withAudit } from "@/app/server/lib/audit";
import { verifiedUserId } from "@/app/server/lib/requireAccess";
import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import Exam from "@/app/server/models/Exam";
import ExamQuestion from "@/app/server/models/ExamQuestion";
import ExamAttempt from "@/app/server/models/ExamAttempt";
import User from "@/app/server/models/User";
import Class from "@/app/server/models/Class";
import Subject from "@/app/server/models/Subject";
import { canAccessSchool } from "@/app/server/lib/schoolAccess";
import { questionImageFields, deleteUnusedExamImages } from "@/app/server/lib/examImages";
import { regradeExamAttempts } from "@/app/server/lib/examGrading";

function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return "At least one question is required";
  }
  for (const q of questions) {
    if (!q.text || !q.text.trim()) return "Every question needs text";
    if (!Array.isArray(q.options) || q.options.length < 2) return "Every question needs at least two options";
    if (q.options.filter((o) => o.isCorrect).length !== 1) return "Every question needs exactly one correct option";
    if (q.options.some((o) => !o.text || !o.text.trim())) return "Every option needs text";
  }
  return null;
}

// Once students have attempted an exam their answers point at question and option ids, so
// edits must keep the same questions and options (same count, order and ids) and only
// correct their content. Returns an error message, or null when the corrections apply.
async function applyQuestionCorrections(examId, incoming, replacedImageIds: string[]) {
  const existing = await ExamQuestion.find({ exam: examId }).sort({ order: 1 });

  if (incoming.length !== existing.length) {
    return "Students have already attempted this exam, so questions can't be added or removed";
  }

  for (const [index, current] of existing.entries()) {
    const q = incoming[index];
    if (String(q._id) !== current._id.toString()) {
      return "Students have already attempted this exam, so questions can't be reordered";
    }
    if (q.type !== current.type) {
      return `Question ${index + 1}: the type can't change after students have attempted the exam`;
    }
    if (
      q.options.length !== current.options.length ||
      q.options.some((o, oi) => String(o._id) !== current.options[oi]._id.toString())
    ) {
      return `Question ${index + 1}: options can't be added, removed or reordered after students have attempted the exam`;
    }
  }

  for (const [index, current] of existing.entries()) {
    const q = incoming[index];
    const { imageUrl, imagePublicId } = questionImageFields(q);
    if (current.imagePublicId && current.imagePublicId !== imagePublicId) {
      replacedImageIds.push(current.imagePublicId);
    }

    current.text = q.text;
    current.imageUrl = imageUrl;
    current.imagePublicId = imagePublicId;
    current.marks = Number(q.marks) || 1;
    current.options.forEach((option, oi) => {
      option.text = q.options[oi].text;
      option.isCorrect = Boolean(q.options[oi].isCorrect);
    });
    await current.save();
  }

  return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifiedUserId(req);
    const { id } = await params;

    if (!userId || !id) {
      return NextResponse.json({ success: false, message: "User and exam id required" }, { status: 400 });
    }

    await connectDB();

    const exam = await Exam.findById(id)
      .populate("class", "name level section")
      .populate("subject", "name")
      .populate("createdBy", "firstName lastName");

    if (!exam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    const user = await User.findById(userId);
    if (!user || !(await canAccessSchool(user, exam.school.toString(), "view"))) {
      return NextResponse.json({ success: false, message: "Access denied: You are not authorized to access this exam" }, { status: 403 });
    }

    const questions = await ExamQuestion.find({ exam: id }).sort({ order: 1 });
    const attemptCount = await ExamAttempt.countDocuments({ exam: id });

    return NextResponse.json({ success: true, exam, questions, attemptCount }, { status: 200 });
  } catch (error) {
    console.error("[Exam GET by ID Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

async function putHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifiedUserId(req);
    const body = await req.json();
    const { id } = await params;

    if (!userId || !id) {
      return NextResponse.json({ success: false, message: "User and exam id required" }, { status: 400 });
    }

    await connectDB();

    const exam = await Exam.findById(id);
    if (!exam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    const user = await User.findById(userId);
    if (!user || !(await canAccessSchool(user, exam.school.toString()))) {
      return NextResponse.json({ success: false, message: "Access denied: You are not authorized to access this exam" }, { status: 403 });
    }

    // With no attempts yet, any exam can be fully edited. After students have started,
    // only corrections that keep question/option ids are allowed (see applyQuestionCorrections).
    const correctionsOnly = (await ExamAttempt.countDocuments({ exam: id })) > 0;
    const previousTitle = exam.title;

    if (
      correctionsOnly &&
      ((body.classId && body.classId !== exam.class.toString()) ||
        (body.subjectId && body.subjectId !== exam.subject.toString()))
    ) {
      return NextResponse.json({ success: false, message: "Class and subject can't change after students have attempted this exam" }, { status: 409 });
    }

    if (body.classId && body.classId !== exam.class.toString()) {
      const schoolClass = await Class.findOne({ _id: body.classId, school: exam.school });
      if (!schoolClass) {
        return NextResponse.json({ success: false, message: "Class not found in this school" }, { status: 404 });
      }
      exam.class = body.classId;
    }

    if (body.subjectId && body.subjectId !== exam.subject.toString()) {
      const subject = await Subject.findOne({ _id: body.subjectId, school: exam.school });
      if (!subject) {
        return NextResponse.json({ success: false, message: "Subject not found in this school" }, { status: 404 });
      }
      exam.subject = body.subjectId;
    }

    let replacedImageIds: string[] = [];

    if (body.questions) {
      const questionError = validateQuestions(body.questions);
      if (questionError) {
        return NextResponse.json({ success: false, message: questionError }, { status: 400 });
      }

      if (correctionsOnly) {
        const correctionError = await applyQuestionCorrections(id, body.questions, replacedImageIds);
        if (correctionError) {
          return NextResponse.json({ success: false, message: correctionError }, { status: 409 });
        }
      } else {
        const oldQuestions = await ExamQuestion.find({ exam: id }).select("imagePublicId");
        replacedImageIds = oldQuestions.map((q) => q.imagePublicId);

        await ExamQuestion.deleteMany({ exam: id });
        await ExamQuestion.insertMany(
          body.questions.map((q, index) => ({
            exam: id,
            order: index,
            text: q.text,
            ...questionImageFields(q),
            type: q.type === "true-false" ? "true-false" : "single-choice",
            options: q.options.map((o) => ({ text: o.text, isCorrect: Boolean(o.isCorrect) })),
            marks: Number(q.marks) || 1,
          }))
        );
      }
      exam.totalMarks = body.questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
    }

    exam.title = body.title ?? exam.title;
    exam.term = body.term ?? exam.term;
    exam.academicYear = body.academicYear ?? exam.academicYear;
    exam.durationMinutes = body.durationMinutes ?? exam.durationMinutes;
    exam.instructions = body.instructions ?? exam.instructions;

    await exam.save();

    // Remove diagrams that were dropped or replaced in this edit
    await deleteUnusedExamImages(replacedImageIds);

    // Corrected answers or marks apply to students who already submitted
    let regradedCount = 0;
    if (correctionsOnly) {
      const questions = await ExamQuestion.find({ exam: id });
      regradedCount = await regradeExamAttempts(exam, questions, previousTitle);
    }

    return NextResponse.json({ success: true, exam, regradedCount }, { status: 200 });
  } catch (error) {
    console.error("[Exam PUT Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

async function deleteHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifiedUserId(req);
    const { id } = await params;

    if (!userId || !id) {
      return NextResponse.json({ success: false, message: "User and exam id required" }, { status: 400 });
    }

    await connectDB();

    const exam = await Exam.findById(id);
    if (!exam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    const user = await User.findById(userId);
    if (!user || !(await canAccessSchool(user, exam.school.toString()))) {
      return NextResponse.json({ success: false, message: "Access denied: You are not authorized to access this exam" }, { status: 403 });
    }

    const attemptCount = await ExamAttempt.countDocuments({ exam: id });
    if (attemptCount > 0) {
      return NextResponse.json({ success: false, message: "This exam already has student attempts and can't be deleted. Close it instead." }, { status: 409 });
    }

    const questionImages = await ExamQuestion.find({ exam: id }).select("imagePublicId");

    await ExamQuestion.deleteMany({ exam: id });
    await exam.deleteOne();

    await deleteUnusedExamImages(questionImages.map((q) => q.imagePublicId));

    return NextResponse.json({ success: true, message: "Exam deleted" }, { status: 200 });
  } catch (error) {
    console.error("[Exam DELETE Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export const PUT = withAudit(putHandler);
export const DELETE = withAudit(deleteHandler);
