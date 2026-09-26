/**
 * Admin-only, read-only query over any collection, so the admin assistant can
 * answer questions the specific tools don't cover.
 *
 * Safety:
 *  - collections come from a fixed allow-list (no dynamic model names);
 *  - only plain comparison/logic operators are accepted ($where, $expr,
 *    $function, $accumulator, $lookup etc. are rejected);
 *  - secrets (passwords, tokens, OTPs, access codes) are removed from every
 *    result, at any depth;
 *  - results are capped at 50 documents.
 */
import type { Model } from "mongoose";
import type { Loose } from "@/types/loose";
import type { AiTool } from "@/app/server/ai/tools";
import User from "@/app/server/models/User";
import School from "@/app/server/models/School";
import Student from "@/app/server/models/Student";
import Class from "@/app/server/models/Class";
import Subject from "@/app/server/models/Subject";
import SchoolMember from "@/app/server/models/SchoolMember";
import Attendance from "@/app/server/models/Attendance";
import Assessment from "@/app/server/models/Assessment";
import ReportCard from "@/app/server/models/ReportCard";
import Exam from "@/app/server/models/Exam";
import ExamAttempt from "@/app/server/models/ExamAttempt";
import StudentBill from "@/app/server/models/StudentBill";
import FeeStructure from "@/app/server/models/FeeStructure";
import AcademicCalendar from "@/app/server/models/AcademicCalendar";
import ProspectiveStudent from "@/app/server/models/ProspectiveStudent";
import PromotionRecord from "@/app/server/models/PromotionRecord";
import ActivityLog from "@/app/server/models/ActivityLog";
import LoginLog from "@/app/server/models/LoginLog";
import IssueReport from "@/app/server/models/IssueReport";
import Feedback from "@/app/server/models/Feedback";
import Contact from "@/app/server/models/Contact";
import Quote from "@/app/server/models/Quote";
import Blog from "@/app/server/models/Blog";
import Gallery from "@/app/server/models/Gallery";
import Project from "@/app/server/models/Project";
import { Subscriber, Campaign } from "@/app/server/models/Newsletter";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous model map
const COLLECTIONS: Record<string, Model<any>> = {
  users: User, schools: School, students: Student, classes: Class, subjects: Subject, schoolMembers: SchoolMember,
  attendance: Attendance, assessments: Assessment, reportCards: ReportCard, exams: Exam, examAttempts: ExamAttempt,
  studentBills: StudentBill, feeStructures: FeeStructure, academicCalendar: AcademicCalendar,
  prospectiveStudents: ProspectiveStudent, promotionRecords: PromotionRecord, activityLogs: ActivityLog,
  loginLogs: LoginLog, issueReports: IssueReport, feedback: Feedback, contacts: Contact, quotes: Quote,
  blogs: Blog, galleries: Gallery, projects: Project, newsletterSubscribers: Subscriber, newsletterCampaigns: Campaign,
};

const ALLOWED_OPERATORS = new Set([
  "$eq", "$ne", "$gt", "$gte", "$lt", "$lte", "$in", "$nin", "$exists", "$regex", "$options", "$and", "$or", "$nor", "$not", "$size", "$elemMatch",
]);
const SECRET_KEY = /password|token|otp|secret|accesscode|apikey/i;

function validateFilter(value: unknown, depth = 0): string | null {
  if (depth > 6) return "Filter is nested too deeply.";
  if (Array.isArray(value)) {
    for (const v of value) {
      const err = validateFilter(v, depth + 1);
      if (err) return err;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const [key, v] of Object.entries(value)) {
      if (key.startsWith("$") && !ALLOWED_OPERATORS.has(key)) return `Operator ${key} is not allowed.`;
      if (SECRET_KEY.test(key)) return `Field ${key} cannot be queried.`;
      const err = validateFilter(v, depth + 1);
      if (err) return err;
    }
  }
  return null;
}

function stripSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripSecrets);
  if (value && typeof value === "object") {
    if (value.constructor?.name === "ObjectId") return String(value);
    if (value instanceof Date) return value;
    const out: Loose = {};
    for (const [k, v] of Object.entries(value)) {
      if (SECRET_KEY.test(k) || k === "__v") continue;
      out[k] = stripSecrets(v);
    }
    return out;
  }
  return value;
}

export const ADMIN_QUERY_TOOL: AiTool = {
  name: "query_records",
  description:
    "ADMIN ONLY. Read-only query over any collection when no specific tool fits. " +
    `Collections: ${Object.keys(COLLECTIONS).join(", ")}. ` +
    "Filter uses MongoDB syntax with basic operators only ($eq,$ne,$gt,$gte,$lt,$lte,$in,$nin,$exists,$regex,$and,$or). " +
    "Set countOnly for totals. Prefer the specific tools for summaries.",
  parameters: {
    type: "object",
    properties: {
      collection: { type: "string", enum: Object.keys(COLLECTIONS) },
      filter: { type: "object", description: "MongoDB filter, e.g. {\"status\":\"pending\"}" },
      fields: { type: "array", items: { type: "string" }, description: "Fields to return (default: all non-secret fields)" },
      sort: { type: "object", description: "e.g. {\"createdAt\":-1}" },
      limit: { type: "number", description: "Max documents (default 10, max 50)" },
      countOnly: { type: "boolean" },
    },
    required: ["collection"],
  },
  available: (s) => s.isAdmin,
  async run(scope, { collection, filter = {}, fields, sort, limit, countOnly }) {
    if (!scope.isAdmin) return { error: "This tool is only available to admins." };
    const model = COLLECTIONS[collection];
    if (!model) return { error: `Unknown collection "${collection}".` };
    const invalid = validateFilter(filter) || validateFilter(sort || {});
    if (invalid) return { error: invalid };

    if (countOnly) return { collection, count: await model.countDocuments(filter) };

    const projection = Array.isArray(fields) && fields.length
      ? fields.filter((f) => typeof f === "string" && !SECRET_KEY.test(f)).join(" ")
      : undefined;
    const n = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const [docs, total] = await Promise.all([
      model.find(filter).select(projection).sort(sort || { _id: -1 }).limit(n).lean(),
      model.countDocuments(filter),
    ]);
    return { collection, total, returned: docs.length, documents: stripSecrets(docs) };
  },
};
