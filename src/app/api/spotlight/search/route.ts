import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import { authenticateRequest } from "@/app/server/lib/requireAccess";
import { resolveScope } from "@/app/server/lib/spotlight/scope";
import School from "@/app/server/models/School";
import SchoolMember from "@/app/server/models/SchoolMember";
import Class from "@/app/server/models/Class";
import Student from "@/app/server/models/Student";
import User from "@/app/server/models/User";

type ResultType = "school" | "leader" | "teacher" | "arm" | "pupil";

interface SearchResult {
  type: ResultType;
  id: string;
  name: string;
  subtitle: string | null;
  href: { level: "school" | "arm"; id: string };
}

const PER_TYPE = 8;
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const fullName = (p?: { firstName?: string; lastName?: string } | null) => `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim();
/** Matches "Grace", "Omoyeni" and "Grace Omo" alike. */
const nameMatch = (pattern: string) => ({
  $expr: { $regexMatch: { input: { $concat: [{ $ifNull: ["$firstName", ""] }, " ", { $ifNull: ["$lastName", ""] }] }, regex: pattern, options: "i" } },
});

/**
 * GET /api/spotlight/search?q=
 * Finds schools, school leaders, teachers, arms and pupils by name (and
 * school location, email or enrolment number), limited to the schools the
 * user may see in Spotlight. Each result says which view to open.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if ("response" in auth) return auth.response;

    const scope = await resolveScope(auth.user);
    if (!scope) {
      return Response.json({ success: false, error: "Spotlight is available to school leaders, directors and administrators." }, { status: 403 });
    }

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return Response.json({ success: true, data: { query: q, results: [] } });

    const pattern = escapeRegex(q).slice(0, 100);
    const regex = new RegExp(pattern, "i");
    const schoolIds = scope.schoolIds;

    // Staff are found through their memberships so results never leave the user's scope
    const memberships = await SchoolMember.find({
      school: { $in: schoolIds },
      role: { $in: ["school-leader", "teacher"] },
      status: "active",
      user: { $ne: null },
    })
      .select("school user role")
      .lean<{ school: Types.ObjectId; user: Types.ObjectId; role: string }[]>();
    const principals = await School.find({ _id: { $in: schoolIds }, principal: { $ne: null } })
      .select("principal")
      .lean<{ _id: Types.ObjectId; principal: Types.ObjectId }[]>();
    const staffIds = [...new Set([...memberships.map((m) => String(m.user)), ...principals.map((p) => String(p.principal))])];

    const [schools, staff, arms, pupils] = await Promise.all([
      School.find({ _id: { $in: schoolIds }, $or: [{ name: regex }, { location: regex }, { email: regex }] })
        .select("name location")
        .sort({ name: 1 })
        .limit(PER_TYPE)
        .lean(),
      User.find({ _id: { $in: staffIds }, $or: [nameMatch(pattern), { email: regex }] })
        .select("firstName lastName email")
        .limit(PER_TYPE * 2)
        .lean(),
      Class.find({
        school: { $in: schoolIds },
        isActive: true,
        $expr: { $regexMatch: { input: { $concat: ["$name", " ", { $ifNull: ["$section", ""] }] }, regex: pattern, options: "i" } },
      })
        .select("name section school classTeacher")
        .populate("school", "name")
        .sort({ name: 1 })
        .limit(PER_TYPE)
        .lean(),
      Student.find({ school: { $in: schoolIds }, isActive: true, $or: [nameMatch(pattern), { enrollmentNo: regex }] })
        .select("firstName lastName enrollmentNo class school")
        .populate("class", "name section")
        .populate("school", "name")
        .sort({ lastName: 1 })
        .limit(PER_TYPE)
        .lean(),
    ]);

    // School names for staff subtitles, and the arm each matched teacher is class teacher of
    const schoolNames = new Map(
      (await School.find({ _id: { $in: schoolIds } }).select("name").lean()).map((s) => [String(s._id), s.name as string])
    );
    const staffIdList = staff.map((s) => s._id);
    const ownClasses = await Class.find({ classTeacher: { $in: staffIdList }, school: { $in: schoolIds }, isActive: true })
      .select("name section classTeacher")
      .lean();

    const leaders: SearchResult[] = [];
    const teachers: SearchResult[] = [];
    for (const person of staff) {
      const id = String(person._id);
      const ledSchool =
        principals.find((p) => String(p.principal) === id)?._id ??
        memberships.find((m) => String(m.user) === id && m.role === "school-leader")?.school;
      if (ledSchool) {
        leaders.push({
          type: "leader", id, name: fullName(person) || person.email,
          subtitle: `Head Teacher, ${schoolNames.get(String(ledSchool)) ?? "School"}`,
          href: { level: "school", id: String(ledSchool) },
        });
        continue;
      }
      const school = memberships.find((m) => String(m.user) === id)?.school;
      if (!school) continue;
      const own = ownClasses.find((c) => String(c.classTeacher) === id);
      teachers.push({
        type: "teacher", id, name: fullName(person) || person.email,
        subtitle: [own ? `Class teacher, ${[own.name, own.section].filter(Boolean).join(" ")}` : "Teacher", schoolNames.get(String(school))].filter(Boolean).join(" · "),
        href: own ? { level: "arm", id: String(own._id) } : { level: "school", id: String(school) },
      });
    }

    const results: SearchResult[] = [
      ...schools.map((s) => ({
        type: "school" as const, id: String(s._id), name: s.name, subtitle: s.location || null,
        href: { level: "school" as const, id: String(s._id) },
      })),
      ...leaders.slice(0, PER_TYPE),
      ...arms.map((c) => ({
        type: "arm" as const, id: String(c._id), name: [c.name, c.section].filter(Boolean).join(" "),
        subtitle: (c.school as unknown as { name?: string } | null)?.name ?? null,
        href: { level: "arm" as const, id: String(c._id) },
      })),
      ...teachers.slice(0, PER_TYPE),
      ...pupils
        .filter((p) => p.class)
        .map((p) => {
          const cls = p.class as unknown as { _id: unknown; name: string; section?: string };
          const school = p.school as unknown as { name?: string } | null;
          return {
            type: "pupil" as const, id: String(p._id), name: fullName(p),
            subtitle: [[cls.name, cls.section].filter(Boolean).join(" "), school?.name, p.enrollmentNo].filter(Boolean).join(" · "),
            href: { level: "arm" as const, id: String(cls._id) },
          };
        }),
    ];

    return Response.json({ success: true, data: { query: q, results } });
  } catch (error) {
    console.error("[Spotlight Search Error]", error);
    return Response.json({ success: false, error: error.message || "Search failed" }, { status: 500 });
  }
}
