/**
 * Data tools the AI assistant can call. Each tool:
 *  - declares when it is available (via the user's AiScope),
 *  - filters every query to the schools / children the user may see,
 *  - returns compact, read-only summaries (no passwords, tokens or codes).
 */
import mongoose from "mongoose";
import type { Loose } from "@/types/loose";
import type { AiScope } from "@/app/server/ai/scope";
import { resolveSchools, schoolFilter } from "@/app/server/ai/scope";
import School from "@/app/server/models/School";
import Student from "@/app/server/models/Student";
import Class from "@/app/server/models/Class";
import Subject from "@/app/server/models/Subject";
import User from "@/app/server/models/User";
import SchoolMember from "@/app/server/models/SchoolMember";
import Attendance from "@/app/server/models/Attendance";
import Assessment from "@/app/server/models/Assessment";
import ReportCard from "@/app/server/models/ReportCard";
import Exam from "@/app/server/models/Exam";
import ExamAttempt from "@/app/server/models/ExamAttempt";
import StudentBill from "@/app/server/models/StudentBill";
import AcademicCalendar from "@/app/server/models/AcademicCalendar";
import ProspectiveStudent from "@/app/server/models/ProspectiveStudent";
import PromotionRecord from "@/app/server/models/PromotionRecord";
import ActivityLog from "@/app/server/models/ActivityLog";
import LoginLog from "@/app/server/models/LoginLog";
import Contact from "@/app/server/models/Contact";
import Quote from "@/app/server/models/Quote";
import Blog from "@/app/server/models/Blog";
import Gallery from "@/app/server/models/Gallery";
import FeeStructure from "@/app/server/models/FeeStructure";
import { Subscriber, Campaign } from "@/app/server/models/Newsletter";

export interface AiTool {
  name: string;
  description: string;
  parameters: Loose;
  available: (scope: AiScope) => boolean;
  run: (scope: AiScope, args: Loose) => Promise<unknown>;
}

// ---------- helpers ----------

const oid = (id: string) => new mongoose.Types.ObjectId(id);
const isId = (id: unknown): id is string => typeof id === "string" && mongoose.isValidObjectId(id);
const fullName = (p: Loose | null | undefined) => (p ? `${p.firstName || ""} ${p.lastName || ""}`.trim() : undefined);
const round = (n: unknown, dp = 1) => (typeof n === "number" && Number.isFinite(n) ? Math.round(n * 10 ** dp) / 10 ** dp : null);
const clampLimit = (n: unknown, max = 25, fallback = 10) => Math.min(Math.max(Number(n) || fallback, 1), max);
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const since = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const isParent = (scope: AiScope) => scope.role === "parent";
const hasSchoolData = (scope: AiScope) =>
  !isParent(scope) && ["academics", "school-manager", "billing", "schools", "report-cards", "cbt", "prospective", "promotion"].some((f) => scope.canRead(f as never));

const noAccess = (what = "that") => ({ error: `You do not have access to ${what}.` });

/** Loads a student the user may see (parents: own children; staff: in-scope schools). */
async function loadAccessibleStudent(scope: AiScope, studentId: unknown) {
  if (!isId(studentId)) return null;
  if (isParent(scope)) {
    if (!scope.childIds.includes(studentId)) return null;
  } else if (!scope.canRead("academics")) {
    return null;
  }
  const student = await Student.findById(studentId)
    .populate("class", "name level section")
    .populate("school", "name")
    .populate("parent", "firstName lastName email phone")
    .lean<Loose>();
  if (!student) return null;
  if (!isParent(scope) && !scope.allSchools && !scope.schoolIds.includes(String(student.school?._id))) return null;
  return student;
}

async function currentTerm() {
  const term = await AcademicCalendar.findOne({ isCurrent: true }).select("session term startDate endDate").lean<Loose>();
  return term ? { session: term.session, term: term.term, startDate: term.startDate, endDate: term.endDate } : null;
}

// ---------- tools ----------

export const AI_TOOLS: AiTool[] = [
  {
    name: "get_overview",
    description:
      "Headline numbers for the user's schools (or one school): students, classes, subjects, teachers, parents, schools and the current academic term. Use for general summaries and for 'how many students / teachers / parents' questions.",
    parameters: {
      type: "object",
      properties: { schoolId: { type: "string", description: "Limit to one school (id). Omit for all schools the user can see." } },
    },
    available: (s) => s.isAdmin || hasSchoolData(s),
    async run(scope, { schoolId }) {
      const schools = resolveSchools(scope, schoolId);
      if (schools && schools.length === 0) return noAccess("that school");
      const f = schoolFilter(schools);
      const [schoolCount, students, classes, subjects, teachers, parents, term] = await Promise.all([
        schools === null ? School.countDocuments({ isActive: true }) : Promise.resolve(schools.length),
        Student.countDocuments({ ...f, isActive: true }),
        Class.countDocuments({ ...f, isActive: true }),
        Subject.countDocuments({ ...f, isActive: true }),
        SchoolMember.countDocuments({ ...f, role: "teacher", status: "active" }),
        // A parent may be a school member, linked to a pupil, or both: count each account once.
        Promise.all([
          SchoolMember.find({ ...f, role: "parent", status: "active" }).distinct("user"),
          Student.find({ ...f, isActive: true, parent: { $ne: null } }).distinct("parent"),
        ]).then(([members, linked]) => ({ total: new Set([...members, ...linked].map(String)).size, linkedToPupils: linked.length })),
        currentTerm(),
      ]);
      return {
        schools: schoolCount, activeStudents: students, classes, subjects, activeTeachers: teachers,
        parents: parents.total, parentsLinkedToPupils: parents.linkedToPupils, currentTerm: term,
      };
    },
  },

  {
    name: "list_schools",
    description: "List schools the user can see, with location, approval status and number of active students. Optional name search.",
    parameters: {
      type: "object",
      properties: { search: { type: "string" }, limit: { type: "number", description: "Max results (default 20, max 50)" } },
    },
    available: (s) => !isParent(s) && (s.allSchools || s.canRead("schools") || s.schoolIds.length > 0),
    async run(scope, { search, limit }) {
      const filter: Loose = scope.allSchools ? {} : { _id: { $in: scope.schoolIds.map(oid) } };
      if (search) filter.name = { $regex: escapeRegex(String(search)), $options: "i" };
      const schools = await School.find(filter).select("name location approvalStatus isActive schoolType").sort({ name: 1 }).limit(clampLimit(limit, 50, 20)).lean<Loose[]>();
      const counts = await Student.aggregate([
        { $match: { school: { $in: schools.map((s) => s._id) }, isActive: true } },
        { $group: { _id: "$school", n: { $sum: 1 } } },
      ]);
      const byId = new Map(counts.map((c) => [String(c._id), c.n]));
      return schools.map((s) => ({
        id: String(s._id), name: s.name, location: s.location, approvalStatus: s.approvalStatus, isActive: s.isActive, activeStudents: byId.get(String(s._id)) || 0,
      }));
    },
  },

  {
    name: "search_students",
    description:
      "Find students by name or admission number, optionally within a school or class. Parents only ever see their own children. Returns ids to use with other tools.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Part of a first name, last name or admission number" },
        schoolId: { type: "string" },
        classId: { type: "string" },
        limit: { type: "number", description: "Max results (default 10, max 25)" },
      },
    },
    available: (s) => isParent(s) || s.canRead("academics"),
    async run(scope, { query, schoolId, classId, limit }) {
      const filter: Loose = { isActive: true };
      if (isParent(scope)) {
        filter._id = { $in: scope.childIds.map(oid) };
      } else {
        const schools = resolveSchools(scope, schoolId);
        if (schools && schools.length === 0) return noAccess("that school");
        Object.assign(filter, schoolFilter(schools));
      }
      if (isId(classId)) filter.class = oid(classId);
      if (query) {
        const re = { $regex: escapeRegex(String(query).trim()), $options: "i" };
        const parts = String(query).trim().split(/\s+/);
        filter.$or = [{ firstName: re }, { lastName: re }, { enrollmentNo: re }];
        if (parts.length > 1) {
          filter.$or.push({ firstName: { $regex: escapeRegex(parts[0]), $options: "i" }, lastName: { $regex: escapeRegex(parts[parts.length - 1]), $options: "i" } });
        }
      }
      const students = await Student.find(filter)
        .select("firstName lastName enrollmentNo gender class school")
        .populate("class", "name")
        .populate("school", "name")
        .sort({ firstName: 1 })
        .limit(clampLimit(limit))
        .lean<Loose[]>();
      return students.map((s) => ({
        id: String(s._id), name: fullName(s), admissionNo: s.enrollmentNo, gender: s.gender, class: s.class?.name, school: s.school?.name,
      }));
    },
  },

  {
    name: "get_student_profile",
    description:
      "Everything about one student: class, school, guardian, academic performance by subject and recent assessments, attendance (last 90 days), report cards, CBT exam results and school fees. Use a student id from search_students.",
    parameters: { type: "object", properties: { studentId: { type: "string" } }, required: ["studentId"] },
    available: (s) => isParent(s) || s.canRead("academics"),
    async run(scope, { studentId }) {
      const student = await loadAccessibleStudent(scope, studentId);
      if (!student) return noAccess("that student");
      const sid = student._id;

      const [bySubject, recent, attendance, reportCards, attempts] = await Promise.all([
        Assessment.aggregate([
          { $match: { student: sid } },
          { $group: { _id: "$subject", average: { $avg: "$percentage" }, assessments: { $sum: 1 } } },
          { $lookup: { from: "subjects", localField: "_id", foreignField: "_id", as: "subject" } },
          { $project: { subject: { $arrayElemAt: ["$subject.name", 0] }, average: 1, assessments: 1 } },
          { $sort: { average: -1 } },
        ]),
        Assessment.find({ student: sid }).sort({ date: -1, createdAt: -1 }).limit(5).populate("subject", "name").select("subject score maxScore percentage gradeLevel assessmentType date").lean<Loose[]>(),
        Attendance.aggregate([{ $match: { student: sid, date: { $gte: since(90) } } }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
        ReportCard.find({ student: sid }).sort({ createdAt: -1 }).limit(5).select("term academicYear status cardType createdAt").lean<Loose[]>(),
        ExamAttempt.find({ student: sid, status: "graded" }).sort({ submittedAt: -1 }).limit(5).populate("exam", "title term academicYear").select("exam score maxScore submittedAt").lean<Loose[]>(),
      ]);

      const att = Object.fromEntries(attendance.map((a) => [a._id, a.n]));
      const totalDays = (att.present || 0) + (att.absent || 0) + (att.late || 0);
      const overall = bySubject.length ? bySubject.reduce((s, x) => s + (x.average || 0), 0) / bySubject.length : null;

      const profile: Loose = {
        id: String(sid),
        name: fullName(student),
        admissionNo: student.enrollmentNo,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        class: student.class?.name,
        school: student.school?.name,
        performance: {
          overallAverage: round(overall),
          bySubject: bySubject.map((x) => ({ subject: x.subject || "Unknown", average: round(x.average), assessments: x.assessments })),
          recentAssessments: recent.map((a) => ({ subject: a.subject?.name, score: `${a.score}/${a.maxScore}`, percentage: round(a.percentage), grade: a.gradeLevel, type: a.assessmentType, date: a.date })),
        },
        attendanceLast90Days: { present: att.present || 0, absent: att.absent || 0, late: att.late || 0, attendanceRate: totalDays ? round(((att.present || 0) + (att.late || 0)) / totalDays * 100) : null },
        reportCards: reportCards.map((r) => ({ term: r.term, academicYear: r.academicYear, status: r.status, type: r.cardType })),
        cbtResults: attempts.map((a) => ({ exam: a.exam?.title, term: a.exam?.term, score: `${a.score}/${a.maxScore}`, submittedAt: a.submittedAt })),
      };

      if (!isParent(scope)) {
        profile.guardian = student.guardian?.name ? { name: student.guardian.name, phone: student.guardian.phone, relationship: student.guardian.relationship } : undefined;
        profile.parentAccount = student.parent ? { name: fullName(student.parent), email: student.parent.email, phone: student.parent.phone } : undefined;
      }
      if (isParent(scope) || scope.canRead("billing")) {
        const bills = await StudentBill.find({ student: sid }).sort({ academicSession: -1, term: -1 }).limit(6).select("academicSession term netAmount amountPaid balance status waived dueDate").lean<Loose[]>();
        profile.fees = bills.map((b) => ({ session: b.academicSession, term: b.term, totalDue: b.netAmount, paid: b.amountPaid, balance: b.waived ? 0 : Math.max(b.balance, 0), status: b.status, dueDate: b.dueDate }));
      }
      return profile;
    },
  },

  {
    name: "list_classes",
    description: "List classes with their class teacher and number of active students.",
    parameters: { type: "object", properties: { schoolId: { type: "string" } } },
    available: (s) => s.canRead("academics"),
    async run(scope, { schoolId }) {
      const schools = resolveSchools(scope, schoolId);
      if (schools && schools.length === 0) return noAccess("that school");
      const classes = await Class.find({ ...schoolFilter(schools), isActive: true })
        .select("name level section school classTeacher")
        .populate("classTeacher", "firstName lastName")
        .populate("school", "name")
        .sort({ name: 1 })
        .limit(100)
        .lean<Loose[]>();
      const counts = await Student.aggregate([{ $match: { class: { $in: classes.map((c) => c._id) }, isActive: true } }, { $group: { _id: "$class", n: { $sum: 1 } } }]);
      const byId = new Map(counts.map((c) => [String(c._id), c.n]));
      return classes.map((c) => ({ id: String(c._id), name: c.name, level: c.level, school: c.school?.name, classTeacher: fullName(c.classTeacher), students: byId.get(String(c._id)) || 0 }));
    },
  },

  {
    name: "get_class_summary",
    description: "Detailed view of one class: its students with their average score, the class average, attendance rate (last 30 days), strongest and weakest students.",
    parameters: { type: "object", properties: { classId: { type: "string" } }, required: ["classId"] },
    available: (s) => s.canRead("academics"),
    async run(scope, { classId }) {
      if (!isId(classId)) return noAccess("that class");
      const cls = await Class.findById(classId).populate("classTeacher", "firstName lastName").populate("school", "name").lean<Loose>();
      if (!cls || (!scope.allSchools && !scope.schoolIds.includes(String(cls.school?._id)))) return noAccess("that class");
      const students = await Student.find({ class: cls._id, isActive: true }).select("firstName lastName enrollmentNo").sort({ firstName: 1 }).limit(80).lean<Loose[]>();
      const ids = students.map((s) => s._id);
      const [scores, attendance] = await Promise.all([
        Assessment.aggregate([{ $match: { student: { $in: ids } } }, { $group: { _id: "$student", average: { $avg: "$percentage" }, n: { $sum: 1 } } }]),
        Attendance.aggregate([{ $match: { student: { $in: ids }, date: { $gte: since(30) } } }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
      ]);
      const avg = new Map(scores.map((s) => [String(s._id), s.average]));
      const rows = students.map((s) => ({ id: String(s._id), name: fullName(s), admissionNo: s.enrollmentNo, average: round(avg.get(String(s._id))) }));
      const scored = rows.filter((r) => r.average !== null).sort((a, b) => (b.average as number) - (a.average as number));
      const att = Object.fromEntries(attendance.map((a) => [a._id, a.n]));
      const total = (att.present || 0) + (att.absent || 0) + (att.late || 0);
      return {
        class: cls.name, school: cls.school?.name, classTeacher: fullName(cls.classTeacher), studentCount: students.length,
        classAverage: scored.length ? round(scored.reduce((s, r) => s + (r.average as number), 0) / scored.length) : null,
        attendanceRateLast30Days: total ? round(((att.present || 0) + (att.late || 0)) / total * 100) : null,
        topStudents: scored.slice(0, 3), needsSupport: scored.slice(-3).reverse(), students: rows,
      };
    },
  },

  {
    name: "get_attendance_summary",
    description:
      "Pupil attendance totals and rate over a recent period, for a school, a class or a student. For school-level questions it also breaks attendance down per class (with class teacher) and per class teacher, lowest first. Staff attendance itself is not recorded on the platform.",
    parameters: {
      type: "object",
      properties: {
        schoolId: { type: "string" }, classId: { type: "string" }, studentId: { type: "string" },
        days: { type: "number", description: "Look-back period in days (default 30, max 365)" },
      },
    },
    available: (s) => isParent(s) || s.canRead("academics"),
    async run(scope, { schoolId, classId, studentId, days }) {
      const period = Math.min(Math.max(Number(days) || 30, 1), 365);
      const match: Loose = { date: { $gte: since(period) } };
      if (isParent(scope)) {
        const ids = studentId ? [studentId] : scope.childIds;
        if (ids.some((id) => !scope.childIds.includes(id))) return noAccess("that student");
        match.student = { $in: ids.map(oid) };
      } else {
        const schools = resolveSchools(scope, schoolId);
        if (schools && schools.length === 0) return noAccess("that school");
        Object.assign(match, schoolFilter(schools));
        if (isId(studentId)) {
          if (!(await loadAccessibleStudent(scope, studentId))) return noAccess("that student");
          match.student = oid(studentId);
        } else if (isId(classId)) {
          const ids = await Student.find({ class: oid(classId) }).distinct("_id");
          match.student = { $in: ids };
        }
      }
      const totals = await Attendance.aggregate([{ $match: match }, { $group: { _id: "$status", n: { $sum: 1 } } }]);
      const t = Object.fromEntries(totals.map((x) => [x._id, x.n]));
      const total = (t.present || 0) + (t.absent || 0) + (t.late || 0);
      // Nothing recent and no period asked for: widen to a year rather than answer "no data".
      if (!total && !days) {
        const wider = await this.run(scope, { schoolId, classId, studentId, days: 365 });
        return { ...wider, note: ["No attendance was recorded in the last 30 days; figures cover the last 12 months.", wider.note].filter(Boolean).join(" ") };
      }
      const result: Loose = { periodDays: period, present: t.present || 0, absent: t.absent || 0, late: t.late || 0, attendanceRate: total ? round(((t.present || 0) + (t.late || 0)) / total * 100) : null };
      if (!isParent(scope) && !studentId && !classId) {
        const byClass = await Attendance.aggregate([
          { $match: match },
          { $lookup: { from: "students", localField: "student", foreignField: "_id", as: "st" } },
          { $group: { _id: { $arrayElemAt: ["$st.class", 0] }, present: { $sum: { $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] } }, total: { $sum: 1 } } },
          { $lookup: { from: "classes", localField: "_id", foreignField: "_id", as: "c" } },
          { $project: { class: { $arrayElemAt: ["$c.name", 0] }, teacher: { $arrayElemAt: ["$c.classTeacher", 0] }, present: 1, total: 1 } },
          { $addFields: { rate: { $multiply: [{ $divide: ["$present", "$total"] }, 100] } } },
          { $sort: { rate: 1 } },
        ]);
        const teacherIds = [...new Set(byClass.map((c) => c.teacher && String(c.teacher)).filter(Boolean))];
        const teachers = await User.find({ _id: { $in: teacherIds } }).select("firstName lastName").lean<Loose[]>();
        const teacherName = new Map(teachers.map((t) => [String(t._id), fullName(t)]));
        const nameOf = (c: Loose) => (c.teacher && teacherName.get(String(c.teacher))) || undefined;
        result.byClassLowestFirst = byClass.slice(0, 20).map((c) => ({
          class: c.class || "Unassigned", classTeacher: nameOf(c) || "not assigned", attendanceRate: round(c.rate), records: c.total,
        }));
        const perTeacher = new Map<string, { present: number; total: number; classes: string[] }>();
        for (const c of byClass) {
          const name = nameOf(c);
          if (!name) continue;
          const t = perTeacher.get(name) || { present: 0, total: 0, classes: [] };
          t.present += c.present;
          t.total += c.total;
          t.classes.push(c.class || "Unassigned");
          perTeacher.set(name, t);
        }
        result.byClassTeacherLowestFirst = [...perTeacher.entries()]
          .map(([teacher, t]) => ({ teacher, classes: t.classes, pupilAttendanceRate: round((t.present / t.total) * 100), records: t.total }))
          .sort((a, b) => a.pupilAttendanceRate - b.pupilAttendanceRate)
          .slice(0, 20);
        result.note = "Only pupil attendance is recorded; there is no staff attendance register.";
      }
      return result;
    },
  },

  {
    name: "get_performance_summary",
    description: "Academic performance: average percentage by subject, grade distribution and number of assessments, for a school, class, subject or student. For a class, also lists the students with the lowest averages.",
    parameters: {
      type: "object",
      properties: { schoolId: { type: "string" }, classId: { type: "string" }, subjectId: { type: "string" }, studentId: { type: "string" }, year: { type: "number" } },
    },
    available: (s) => isParent(s) || s.canRead("academics"),
    async run(scope, { schoolId, classId, subjectId, studentId, year }) {
      const match: Loose = {};
      if (isParent(scope)) {
        const ids = studentId ? [studentId] : scope.childIds;
        if (ids.some((id) => !scope.childIds.includes(id))) return noAccess("that student");
        match.student = { $in: ids.map(oid) };
      } else {
        const schools = resolveSchools(scope, schoolId);
        if (schools && schools.length === 0) return noAccess("that school");
        Object.assign(match, schoolFilter(schools));
        if (isId(studentId)) {
          if (!(await loadAccessibleStudent(scope, studentId))) return noAccess("that student");
          match.student = oid(studentId);
        }
        if (isId(classId)) match.class = oid(classId);
      }
      if (isId(subjectId)) match.subject = oid(subjectId);
      if (year) match.year = Number(year);

      const [bySubject, grades, totals] = await Promise.all([
        Assessment.aggregate([
          { $match: match },
          { $group: { _id: "$subject", average: { $avg: "$percentage" }, n: { $sum: 1 } } },
          { $lookup: { from: "subjects", localField: "_id", foreignField: "_id", as: "s" } },
          { $project: { subject: { $arrayElemAt: ["$s.name", 0] }, average: 1, n: 1 } },
          { $sort: { average: 1 } },
          { $limit: 30 },
        ]),
        Assessment.aggregate([{ $match: match }, { $group: { _id: "$gradeLevel", n: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
        Assessment.aggregate([{ $match: match }, { $group: { _id: null, average: { $avg: "$percentage" }, n: { $sum: 1 } } }]),
      ]);
      const result: Loose = {
        assessments: totals[0]?.n || 0,
        overallAverage: round(totals[0]?.average),
        bySubjectLowestFirst: bySubject.map((x) => ({ subject: x.subject || "Unknown", average: round(x.average), assessments: x.n })),
        gradeDistribution: Object.fromEntries(grades.map((g) => [g._id || "ungraded", g.n])),
      };
      if (!isParent(scope) && isId(classId) && !studentId) {
        const lowest = await Assessment.aggregate([
          { $match: match },
          { $group: { _id: "$student", average: { $avg: "$percentage" } } },
          { $sort: { average: 1 } },
          { $limit: 5 },
          { $lookup: { from: "students", localField: "_id", foreignField: "_id", as: "st" } },
          { $project: { average: 1, st: { $arrayElemAt: ["$st", 0] } } },
        ]);
        result.lowestAverages = lowest.map((l) => ({ id: String(l._id), name: fullName(l.st), average: round(l.average) }));
      }
      return result;
    },
  },

  {
    name: "list_staff",
    description: "Staff members of a school (teachers, school leaders, learning specialists, staff) with role and email.",
    parameters: { type: "object", properties: { schoolId: { type: "string" }, role: { type: "string", enum: ["teacher", "school-leader", "learning-specialist", "staff"] } } },
    available: (s) => s.canRead("school-manager"),
    async run(scope, { schoolId, role }) {
      const schools = resolveSchools(scope, schoolId);
      if (schools && schools.length === 0) return noAccess("that school");
      const members = await SchoolMember.find({
        ...schoolFilter(schools),
        status: "active",
        role: role ? role : { $in: ["teacher", "school-leader", "learning-specialist", "staff"] },
      })
        .populate("user", "firstName lastName email")
        .populate("school", "name")
        .limit(60)
        .lean<Loose[]>();
      return members.filter((m) => m.user).map((m) => ({ name: fullName(m.user), email: m.user.email, role: m.role, school: m.school?.name }));
    },
  },

  {
    name: "get_billing_summary",
    description:
      "School fees for a term: expected, collected and outstanding amounts (Naira), bills by status, a per-class breakdown and the largest outstanding balances. Defaults to the current term. For parents: their own children's bills.",
    parameters: {
      type: "object",
      properties: {
        schoolId: { type: "string" }, classId: { type: "string" },
        academicSession: { type: "string", description: "e.g. 2026/2027" },
        term: { type: "string", enum: ["first", "second", "third"] },
      },
    },
    available: (s) => isParent(s) || s.canRead("billing"),
    async run(scope, { schoolId, classId, academicSession, term }) {
      if (isParent(scope)) {
        const bills = await StudentBill.find({ student: { $in: scope.childIds.map(oid) } })
          .populate("student", "firstName lastName").sort({ academicSession: -1, term: -1 }).limit(20)
          .select("student academicSession term netAmount amountPaid balance status waived dueDate").lean<Loose[]>();
        return bills.map((b) => ({ child: fullName(b.student), session: b.academicSession, term: b.term, totalDue: b.netAmount, paid: b.amountPaid, balance: b.waived ? 0 : Math.max(b.balance, 0), status: b.status, dueDate: b.dueDate }));
      }
      const schools = resolveSchools(scope, schoolId);
      if (schools && schools.length === 0) return noAccess("that school");
      const current = !academicSession || !term ? await currentTerm() : null;
      const session = academicSession || current?.session;
      const t = term || current?.term;
      if (!session || !t) return { error: "No academic term specified and no current term is set." };
      const match: Loose = { ...schoolFilter(schools), academicSession: session, term: t };
      if (isId(classId)) match.class = oid(classId);

      const [totals, byStatus, byClass, debtors, feeClasses] = await Promise.all([
        StudentBill.aggregate([{ $match: match }, { $group: {
          _id: null, bills: { $sum: 1 },
          expected: { $sum: { $cond: ["$waived", 0, "$netAmount"] } },
          collected: { $sum: "$amountPaid" },
          outstanding: { $sum: { $cond: [{ $and: [{ $not: ["$waived"] }, { $gt: ["$balance", 0] }] }, "$balance", 0] } },
        } }]),
        StudentBill.aggregate([{ $match: match }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
        StudentBill.aggregate([
          { $match: match },
          { $group: { _id: "$class", expected: { $sum: { $cond: ["$waived", 0, "$netAmount"] } }, collected: { $sum: "$amountPaid" }, students: { $sum: 1 } } },
          { $lookup: { from: "classes", localField: "_id", foreignField: "_id", as: "c" } },
          { $project: { class: { $arrayElemAt: ["$c.name", 0] }, expected: 1, collected: 1, students: 1 } },
          { $sort: { class: 1 } },
          { $limit: 40 },
        ]),
        StudentBill.find({ ...match, waived: { $ne: true }, balance: { $gt: 0 } }).sort({ balance: -1 }).limit(10)
          .populate("student", "firstName lastName enrollmentNo").populate("class", "name").select("student class balance status dueDate").lean<Loose[]>(),
        FeeStructure.countDocuments({ ...schoolFilter(schools), academicSession: session, term: t }),
      ]);
      const sum = totals[0] || { bills: 0, expected: 0, collected: 0, outstanding: 0 };
      return {
        academicSession: session, term: t, currency: "NGN", classesWithFeesSet: feeClasses,
        bills: sum.bills, expected: sum.expected, collected: sum.collected, outstanding: sum.outstanding,
        collectionRate: sum.expected ? round(Math.min(sum.collected, sum.expected) / sum.expected * 100) : null,
        billsByStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.n])),
        byClass: byClass.map((c) => ({ class: c.class || "Unknown", students: c.students, expected: c.expected, collected: c.collected, rate: c.expected ? round(Math.min(c.collected, c.expected) / c.expected * 100) : null })),
        largestOutstanding: debtors.map((d) => ({ student: fullName(d.student), admissionNo: d.student?.enrollmentNo, class: d.class?.name, balance: d.balance, status: d.status, dueDate: d.dueDate })),
      };
    },
  },

  {
    name: "list_report_cards",
    description: "Report cards (term, year, type, status) for a school, class or student.",
    parameters: {
      type: "object",
      properties: { schoolId: { type: "string" }, classId: { type: "string" }, studentId: { type: "string" }, status: { type: "string" }, limit: { type: "number" } },
    },
    available: (s) => isParent(s) || s.canRead("report-cards"),
    async run(scope, { schoolId, classId, studentId, status, limit }) {
      const filter: Loose = {};
      if (isParent(scope)) {
        filter.student = { $in: scope.childIds.map(oid) };
      } else {
        const schools = resolveSchools(scope, schoolId);
        if (schools && schools.length === 0) return noAccess("that school");
        Object.assign(filter, schoolFilter(schools));
        if (isId(classId)) filter.class = oid(classId);
      }
      if (isId(studentId)) {
        if (isParent(scope) && !scope.childIds.includes(studentId)) return noAccess("that student");
        filter.student = oid(studentId);
      }
      if (status) filter.status = status;
      const cards = await ReportCard.find(filter).sort({ createdAt: -1 }).limit(clampLimit(limit, 30, 15))
        .populate("student", "firstName lastName").populate("class", "name").select("student class term academicYear status cardType createdAt").lean<Loose[]>();
      return cards.map((c) => ({ student: fullName(c.student), class: c.class?.name, term: c.term, academicYear: c.academicYear, type: c.cardType, status: c.status, created: c.createdAt }));
    },
  },

  {
    name: "list_exams",
    description: "CBT exams with class, subject, status and dates, plus how many students sat each and the average score.",
    parameters: { type: "object", properties: { schoolId: { type: "string" }, status: { type: "string", enum: ["draft", "published", "closed"] }, limit: { type: "number" } } },
    available: (s) => s.canRead("cbt"),
    async run(scope, { schoolId, status, limit }) {
      const schools = resolveSchools(scope, schoolId);
      if (schools && schools.length === 0) return noAccess("that school");
      const filter: Loose = { ...schoolFilter(schools) };
      if (status) filter.status = status;
      const exams = await Exam.find(filter).sort({ createdAt: -1 }).limit(clampLimit(limit, 30, 15))
        .populate("class", "name").populate("subject", "name").select("title class subject term academicYear status availableFrom availableUntil totalMarks").lean<Loose[]>();
      const stats = await ExamAttempt.aggregate([
        { $match: { exam: { $in: exams.map((e) => e._id) }, status: { $in: ["submitted", "graded"] } } },
        { $group: { _id: "$exam", attempts: { $sum: 1 }, avgScore: { $avg: "$score" } } },
      ]);
      const byId = new Map(stats.map((s) => [String(s._id), s]));
      return exams.map((e) => ({
        title: e.title, class: e.class?.name, subject: e.subject?.name, term: e.term, academicYear: e.academicYear, status: e.status,
        availableFrom: e.availableFrom, availableUntil: e.availableUntil, totalMarks: e.totalMarks,
        attempts: byId.get(String(e._id))?.attempts || 0, averageScore: round(byId.get(String(e._id))?.avgScore),
      }));
    },
  },

  {
    name: "get_academic_calendar",
    description: "Academic sessions and terms with dates, the current term and upcoming holidays.",
    parameters: { type: "object", properties: {} },
    available: () => true,
    async run() {
      const terms = await AcademicCalendar.find({ isActive: true }).sort({ startDate: -1 }).limit(9).select("session term startDate endDate isCurrent holidays").lean<Loose[]>();
      const now = new Date();
      return terms.map((t) => ({
        session: t.session, term: t.term, startDate: t.startDate, endDate: t.endDate, isCurrent: t.isCurrent,
        upcomingHolidays: (t.holidays || []).filter((h) => new Date(h.date) >= now).slice(0, 5).map((h) => ({ name: h.name, date: h.date })),
      }));
    },
  },

  {
    name: "list_prospective_students",
    description: "Prospective (applicant) pupils awaiting or past admission decisions.",
    parameters: { type: "object", properties: { schoolId: { type: "string" }, status: { type: "string", enum: ["pending", "approved", "rejected"] }, limit: { type: "number" } } },
    available: (s) => s.canRead("prospective"),
    async run(scope, { schoolId, status, limit }) {
      const schools = resolveSchools(scope, schoolId);
      if (schools && schools.length === 0) return noAccess("that school");
      const filter: Loose = { ...schoolFilter(schools) };
      if (status) filter.status = status;
      const rows = await ProspectiveStudent.find(filter).sort({ createdAt: -1 }).limit(clampLimit(limit, 30, 15))
        .populate("school", "name").select("firstName lastName gradeLevel className status parentName school createdAt").lean<Loose[]>();
      return rows.map((r) => ({ name: fullName(r), class: r.className || r.gradeLevel, status: r.status, parent: r.parentName, school: r.school?.name, applied: r.createdAt }));
    },
  },

  {
    name: "get_promotion_history",
    description: "Grade promotion records: how many students were promoted, retained or graduated, per academic session.",
    parameters: { type: "object", properties: { schoolId: { type: "string" }, academicSession: { type: "string" } } },
    available: (s) => s.canRead("promotion"),
    async run(scope, { schoolId, academicSession }) {
      const schools = resolveSchools(scope, schoolId);
      if (schools && schools.length === 0) return noAccess("that school");
      const match: Loose = { ...schoolFilter(schools) };
      if (academicSession) match.academicSession = academicSession;
      const rows = await PromotionRecord.aggregate([
        { $match: match },
        { $group: { _id: { session: "$academicSession", status: "$status" }, n: { $sum: 1 } } },
        { $sort: { "_id.session": -1 } },
      ]);
      return rows.map((r) => ({ academicSession: r._id.session, status: r._id.status, students: r.n }));
    },
  },

  {
    name: "list_pending_registrations",
    description: "User registrations waiting for approval (name, email, role, school, date).",
    parameters: { type: "object", properties: { limit: { type: "number" } } },
    available: (s) => s.canRead("registrations"),
    async run(scope, { limit }) {
      const [users, total] = await Promise.all([
        User.find({ approvalStatus: "pending" }).sort({ createdAt: -1 }).limit(clampLimit(limit, 30, 15))
          .select("firstName lastName email role schoolName createdAt").lean<Loose[]>(),
        User.countDocuments({ approvalStatus: "pending" }),
      ]);
      return {
        totalPending: total,
        shown: users.length,
        users: users.map((u) => ({ name: fullName(u), email: u.email, role: u.role, school: u.schoolName, registered: u.createdAt })),
      };
    },
  },

  {
    name: "get_recent_activity",
    description: "Recent system activity: logins or data changes (who did what, when), newest first.",
    parameters: {
      type: "object",
      properties: { type: { type: "string", enum: ["activity", "login"], description: "Default: activity" }, schoolId: { type: "string" }, limit: { type: "number" } },
    },
    available: (s) => s.canRead("logs"),
    async run(scope, { type, schoolId, limit }) {
      const schools = resolveSchools(scope, schoolId);
      if (schools && schools.length === 0) return noAccess("that school");
      const n = clampLimit(limit, 40, 15);
      if (type === "login") {
        const logs = await LoginLog.find(schoolFilter(schools)).sort({ loginTime: -1 }).limit(n).select("firstName lastName userRole schoolName loginTime status deviceType").lean<Loose[]>();
        return logs.map((l) => ({ user: fullName(l), role: l.userRole, school: l.schoolName, time: l.loginTime, status: l.status, device: l.deviceType }));
      }
      const logs = await ActivityLog.find(schoolFilter(schools)).sort({ timestamp: -1 }).limit(n).select("firstName lastName userRole schoolName action entityType entityName description status timestamp").lean<Loose[]>();
      return logs.map((l) => ({ user: fullName(l), role: l.userRole, school: l.schoolName, action: l.action, on: l.entityType, item: l.entityName, description: l.description, status: l.status, time: l.timestamp }));
    },
  },

  {
    name: "get_content_overview",
    description: "Website content: blog posts by status with the most recent posts, and gallery albums.",
    parameters: { type: "object", properties: {} },
    available: (s) => s.canRead("blog") || s.canRead("gallery") || s.canRead("site-content"),
    async run(scope) {
      const result: Loose = {};
      if (scope.canRead("blog") || scope.canRead("site-content")) {
        const [byStatus, recent] = await Promise.all([
          Blog.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
          Blog.find().sort({ publishDate: -1, createdAt: -1 }).limit(5).select("postTitle category status publishDate author comments likes").lean<Loose[]>(),
        ]);
        result.blog = {
          postsByStatus: Object.fromEntries(byStatus.map((b) => [b._id, b.n])),
          recentPosts: recent.map((p) => ({ title: p.postTitle, category: p.category, status: p.status, published: p.publishDate, author: p.author, comments: p.comments?.length || 0, likes: p.likes || 0 })),
        };
      }
      if (scope.canRead("gallery") || scope.canRead("site-content")) {
        const [count, recent] = await Promise.all([
          Gallery.countDocuments(),
          Gallery.find().sort({ createdAt: -1 }).limit(5).select("title category status featured views images").lean<Loose[]>(),
        ]);
        result.gallery = { albums: count, recent: recent.map((g) => ({ title: g.title, category: g.category, status: g.status, featured: g.featured, views: g.views, images: g.images?.length || 0 })) };
      }
      return result;
    },
  },

  {
    name: "list_contact_messages",
    description: "Messages sent through the website contact form (and, for admins, quote requests), with status and a short excerpt.",
    parameters: {
      type: "object",
      properties: { kind: { type: "string", enum: ["contact", "quote"], description: "Default: contact" }, status: { type: "string" }, limit: { type: "number" } },
    },
    available: (s) => s.canRead("contact-responses"),
    async run(scope, { kind, status, limit }) {
      const filter: Loose = status ? { status } : {};
      const n = clampLimit(limit, 30, 10);
      if (kind === "quote") {
        if (!(scope.isAdmin || scope.role === "learning-specialist")) return noAccess("quote requests");
        const quotes = await Quote.find(filter).sort({ createdAt: -1 }).limit(n).select("name company service status message createdAt").lean<Loose[]>();
        return quotes.map((q) => ({ name: q.name, company: q.company, service: q.service, status: q.status, excerpt: String(q.message || "").slice(0, 200), received: q.createdAt }));
      }
      const messages = await Contact.find(filter).sort({ createdAt: -1 }).limit(n).select("name subject status message replies createdAt").lean<Loose[]>();
      return messages.map((m) => ({ name: m.name, subject: m.subject, status: m.status, excerpt: String(m.message || "").slice(0, 200), replies: m.replies?.length || 0, received: m.createdAt }));
    },
  },

  {
    name: "get_newsletter_stats",
    description: "Newsletter subscribers by status and campaigns by status, with the most recent campaigns.",
    parameters: { type: "object", properties: {} },
    available: (s) => s.canRead("newsletter"),
    async run() {
      const [subs, camps, recent] = await Promise.all([
        Subscriber.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
        Campaign.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
        Campaign.find().sort({ createdAt: -1 }).limit(5).select("title subject status campaignType createdAt").lean<Loose[]>(),
      ]);
      return {
        subscribersByStatus: Object.fromEntries(subs.map((s) => [s._id, s.n])),
        campaignsByStatus: Object.fromEntries(camps.map((c) => [c._id, c.n])),
        recentCampaigns: recent.map((c) => ({ title: c.title, subject: c.subject, status: c.status, type: c.campaignType, created: c.createdAt })),
      };
    },
  },

  {
    name: "list_users",
    description: "Platform user accounts with role, approval status, active flag and last login. Filter by role or name/email.",
    parameters: { type: "object", properties: { role: { type: "string" }, search: { type: "string" }, limit: { type: "number" } } },
    available: (s) => s.canRead("users"),
    async run(scope, { role, search, limit }) {
      const filter: Loose = {};
      if (role) filter.role = role;
      if (search) {
        const re = { $regex: escapeRegex(String(search)), $options: "i" };
        filter.$or = [{ firstName: re }, { lastName: re }, { email: re }];
      }
      const [users, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).limit(clampLimit(limit, 50, 20)).select("firstName lastName email role approvalStatus isActive lastLogin createdAt").lean<Loose[]>(),
        User.countDocuments(filter),
      ]);
      return { total, users: users.map((u) => ({ name: fullName(u), email: u.email, role: u.role, approval: u.approvalStatus, active: u.isActive, lastLogin: u.lastLogin, created: u.createdAt })) };
    },
  },
];
