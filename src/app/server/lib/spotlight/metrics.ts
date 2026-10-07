import { Types } from "mongoose";
import Attendance from "@/app/server/models/Attendance";
import Assessment from "@/app/server/models/Assessment";
import Student from "@/app/server/models/Student";
import Class from "@/app/server/models/Class";
import School from "@/app/server/models/School";
import SchoolMember from "@/app/server/models/SchoolMember";
import User from "@/app/server/models/User";
import type { UserDocument } from "@/app/server/models/User";
import { roleLabel } from "@/utils/roles";
import { fromKey, type ResolvedPeriod } from "./period";
import type { SpotlightScope } from "./scope";

/**
 * KPI maths for Spotlight. Each view runs a handful of grouped queries over
 * the date window it needs (period, comparison period and chart), then every
 * number is derived from those per-day tallies in memory.
 *
 * KPI definitions
 *   present           present + late, out of attendance records marked
 *   attendanceMarked  records marked, out of active pupils x working days
 *   assessments       teachers who recorded >= 1 assessment in the period,
 *                     out of the scope's teachers. At arm level (and for arm
 *                     rows) it is pupils with >= 1 assessment, out of pupils,
 *                     because an arm has no teacher roster to measure against.
 */

export type KpiKey = "assessments" | "present" | "attendanceMarked";
export type Level = "network" | "school" | "arm";

type Id = Types.ObjectId;
type Kpis = Record<KpiKey, number | null>;

interface Tally { row: string; day: string; marked: number; present: number; late: number }
interface Assessed { row: string; actor: string; day: string }

export interface ViewRow {
  id: string;
  name: string;
  subtitle: string | null;
  href: { level: Level; id: string } | null;
  kpis: Kpis;
  detail?: string;
}

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
const dayKey = { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: TZ } };
const presentSum = { $sum: { $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] } };
const lateSum = { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } };

const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : null);
const fullName = (u?: { firstName?: string; lastName?: string } | null) =>
  u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || null : null;
const str = (v: unknown) => String(v);

function windowOf(period: ResolvedPeriod) {
  const all = [...period.days, ...(period.comparison?.days ?? []), ...period.series.flatMap((b) => b.days)].sort();
  if (all.length === 0) return null;
  const end = fromKey(all[all.length - 1]);
  end.setHours(23, 59, 59, 999);
  return { $gte: fromKey(all[0]), $lte: end };
}

/** Teachers per school: active teacher memberships plus legacy User.schoolId teachers. */
async function teachersBySchool(schoolIds: Id[]) {
  const [members, legacy] = await Promise.all([
    SchoolMember.find({ school: { $in: schoolIds }, role: "teacher", status: "active", user: { $ne: null } })
      .select("school user")
      .lean(),
    User.find({ role: "teacher", isActive: true, schoolId: { $in: schoolIds } }).select("schoolId").lean(),
  ]);
  const map = new Map<string, Set<string>>();
  const add = (school: unknown, user: unknown) => {
    const set = map.get(str(school)) ?? new Set<string>();
    set.add(str(user));
    map.set(str(school), set);
  };
  members.forEach((m) => add(m.school, m.user));
  legacy.forEach((u) => add(u.schoolId, u._id));
  return map;
}

/** Turns per-day tallies into KPI values for a set of days. */
function calculator(tallies: Tally[], assessed: Assessed[]) {
  return {
    attendance(days: Set<string>, rows: Set<string> | null, pupils: number) {
      let marked = 0, present = 0, late = 0;
      for (const t of tallies) {
        if (!days.has(t.day) || (rows && !rows.has(t.row))) continue;
        marked += t.marked;
        present += t.present;
        late += t.late;
      }
      return {
        present: pct(present, marked),
        attendanceMarked: pupils > 0 && days.size > 0 ? Math.min(100, pct(marked, pupils * days.size) ?? 0) : null,
        marked, onTime: present - late, late, expected: pupils * days.size,
      };
    },
    /** Distinct actors (teachers or pupils) with an assessment on these days, limited to `eligible`. */
    actors(days: Set<string>, rows: Set<string> | null, eligible: Set<string> | null) {
      const found = new Set<string>();
      for (const a of assessed) {
        if (!days.has(a.day) || (rows && !rows.has(a.row))) continue;
        if (!eligible || eligible.has(a.actor)) found.add(a.actor);
      }
      return found;
    },
  };
}

function kpiBlock(
  period: ResolvedPeriod,
  value: (days: Set<string>) => Kpis & { detail: Record<KpiKey, { label: string; value: string }[]> }
) {
  const current = value(new Set(period.days));
  const previous = period.comparison ? value(new Set(period.comparison.days)) : null;
  const series = period.series.map((b) => ({ key: b.key, label: b.label, values: value(new Set(b.days)) }));
  const keys: KpiKey[] = ["assessments", "present", "attendanceMarked"];
  return Object.fromEntries(
    keys.map((k) => [
      k,
      {
        value: current[k],
        previous: previous ? previous[k] : null,
        series: series.map((s) => ({ key: s.key, label: s.label, value: s.values[k] })),
        detail: current.detail[k],
      },
    ])
  ) as Record<KpiKey, { value: number | null; previous: number | null; series: { key: string; label: string; value: number | null }[]; detail: { label: string; value: string }[] }>;
}

const fmtCount = (n: number) => n.toLocaleString("en-US");

// ---------------------------------------------------------------------------

export async function networkView(user: UserDocument, scope: SpotlightScope, period: ResolvedPeriod) {
  const schoolIds = scope.schoolIds;
  const window = windowOf(period);

  const [schools, pupils, arms, teachers, leaders, tallies, assessed] = await Promise.all([
    School.find({ _id: { $in: schoolIds } }).select("name location principal").populate("principal", "firstName lastName").lean(),
    Student.aggregate([{ $match: { school: { $in: schoolIds }, isActive: true } }, { $group: { _id: "$school", n: { $sum: 1 } } }]),
    Class.aggregate([{ $match: { school: { $in: schoolIds }, isActive: true } }, { $group: { _id: "$school", n: { $sum: 1 } } }]),
    teachersBySchool(schoolIds),
    SchoolMember.find({ school: { $in: schoolIds }, role: "school-leader", status: "active", user: { $ne: null } })
      .select("school user")
      .populate("user", "firstName lastName email")
      .lean(),
    window
      ? Attendance.aggregate([
          { $match: { school: { $in: schoolIds }, date: window } },
          { $group: { _id: { row: "$school", day: dayKey }, marked: { $sum: 1 }, present: presentSum, late: lateSum } },
        ])
      : [],
    window
      ? Assessment.aggregate([
          { $match: { school: { $in: schoolIds }, date: window, teacher: { $ne: null } } },
          { $group: { _id: { row: "$school", actor: "$teacher", day: dayKey } } },
        ])
      : [],
  ]);

  const calc = calculator(
    tallies.map((t) => ({ row: str(t._id.row), day: t._id.day, marked: t.marked, present: t.present, late: t.late })),
    assessed.map((a) => ({ row: str(a._id.row), actor: str(a._id.actor), day: a._id.day }))
  );
  const pupilsBySchool = new Map(pupils.map((p) => [str(p._id), p.n as number]));
  const armsBySchool = new Map(arms.map((a) => [str(a._id), a.n as number]));
  const allTeachers = new Set([...teachers.values()].flatMap((s) => [...s]));
  const totalPupils = [...pupilsBySchool.values()].reduce((a, b) => a + b, 0);

  const kpis = kpiBlock(period, (days) => {
    const att = calc.attendance(days, null, totalPupils);
    const recorded = calc.actors(days, null, allTeachers).size;
    return {
      assessments: pct(recorded, allTeachers.size),
      present: att.present,
      attendanceMarked: att.attendanceMarked,
      detail: {
        assessments: [{ label: "Teachers recording", value: `${fmtCount(recorded)} of ${fmtCount(allTeachers.size)}` }],
        present: [
          { label: "On time", value: `${pct(att.onTime, att.marked) ?? "–"}%` },
          { label: "Late", value: `${pct(att.late, att.marked) ?? "–"}%` },
        ],
        attendanceMarked: [{ label: "Records marked", value: `${fmtCount(att.marked)} of ${fmtCount(att.expected)}` }],
      },
    };
  });

  const periodDays = new Set(period.days);
  const leaderBySchool = new Map<string, { id: string; name: string | null }>();
  leaders.forEach((l) => {
    const u = l.user as unknown as { _id: unknown; firstName?: string; lastName?: string } | null;
    if (u && !leaderBySchool.has(str(l.school))) leaderBySchool.set(str(l.school), { id: str(u._id), name: fullName(u) });
  });

  const rows: ViewRow[] = schools.map((s) => {
    const id = str(s._id);
    const principal = s.principal as unknown as { _id: unknown; firstName?: string; lastName?: string } | null;
    const head = principal ? { id: str(principal._id), name: fullName(principal) } : leaderBySchool.get(id) ?? null;
    const schoolTeachers = teachers.get(id) ?? new Set<string>();
    const att = calc.attendance(periodDays, new Set([id]), pupilsBySchool.get(id) ?? 0);
    return {
      id,
      name: s.name,
      subtitle: head?.name ?? null,
      href: { level: "school", id },
      kpis: {
        assessments: pct(calc.actors(periodDays, new Set([id]), schoolTeachers).size, schoolTeachers.size),
        present: att.present,
        attendanceMarked: att.attendanceMarked,
      },
    };
  });
  const rowById = new Map(rows.map((r) => [r.id, r]));

  // No reporting lines exist in Kiddies Check, so the network "team" is each school's head teacher
  const team: ViewRow[] = rows
    .map((r) => {
      const school = schools.find((s) => str(s._id) === r.id)!;
      const principal = school.principal as unknown as { _id: unknown } | null;
      const head = principal ? { id: str(principal._id), name: r.subtitle } : leaderBySchool.get(r.id);
      return head?.name
        ? { id: head.id, name: head.name, subtitle: `Head Teacher, ${r.name}`, href: { level: "school" as Level, id: r.id }, kpis: rowById.get(r.id)!.kpis }
        : null;
    })
    .filter((r): r is ViewRow => r !== null);

  const teacherCount = allTeachers.size;
  return {
    level: "network" as Level,
    entity: {
      kind: "person",
      id: str(user._id),
      name: fullName(user) ?? "",
      role: roleLabel(user.role),
      email: user.email,
      phone: user.phone || null,
      memberSince: user.createdAt,
      headTeacher: null,
      location: null,
    },
    counts: {
      schools: schools.length,
      teachers: teacherCount,
      arms: [...armsBySchool.values()].reduce((a, b) => a + b, 0),
      pupils: totalPupils,
      ptr: teacherCount ? Math.round((totalPupils / teacherCount) * 10) / 10 : null,
    },
    kpis,
    rows: { kind: "school", items: rows },
    team,
  };
}

// ---------------------------------------------------------------------------

export async function schoolView(schoolId: Id, period: ResolvedPeriod) {
  const window = windowOf(period);

  const [school, classes, pupils, teachers, leaders, tallies, rowAssessed, teacherAssessed] = await Promise.all([
    School.findById(schoolId).select("name email phone location principal").populate("principal", "firstName lastName email").lean(),
    Class.find({ school: schoolId, isActive: true }).select("name section level classTeacher").populate("classTeacher", "firstName lastName").sort({ name: 1 }).lean(),
    Student.aggregate([{ $match: { school: schoolId, isActive: true } }, { $group: { _id: "$class", n: { $sum: 1 } } }]),
    teachersBySchool([schoolId]),
    SchoolMember.find({ school: schoolId, role: "school-leader", status: "active", user: { $ne: null } })
      .select("user")
      .populate("user", "firstName lastName email")
      .lean(),
    window
      ? Attendance.aggregate([
          { $match: { school: schoolId, date: window } },
          { $lookup: { from: Student.collection.name, localField: "student", foreignField: "_id", as: "s", pipeline: [{ $project: { class: 1 } }] } },
          { $group: { _id: { row: { $arrayElemAt: ["$s.class", 0] }, day: dayKey }, marked: { $sum: 1 }, present: presentSum, late: lateSum } },
        ])
      : [],
    window
      ? Assessment.aggregate([
          { $match: { school: schoolId, date: window } },
          { $group: { _id: { row: "$class", actor: "$student", day: dayKey } } },
        ])
      : [],
    window
      ? Assessment.aggregate([
          { $match: { school: schoolId, date: window, teacher: { $ne: null } } },
          { $group: { _id: { row: "$class", actor: "$teacher", day: dayKey } } },
        ])
      : [],
  ]);
  if (!school) return null;

  const tallyRows = tallies.map((t) => ({ row: str(t._id.row), day: t._id.day, marked: t.marked, present: t.present, late: t.late }));
  const byClass = calculator(tallyRows, rowAssessed.map((a) => ({ row: str(a._id.row), actor: str(a._id.actor), day: a._id.day })));
  const byTeacher = calculator(tallyRows, teacherAssessed.map((a) => ({ row: str(a._id.row), actor: str(a._id.actor), day: a._id.day })));

  const pupilsByClass = new Map(pupils.map((p) => [str(p._id), p.n as number]));
  const totalPupils = [...pupilsByClass.values()].reduce((a, b) => a + b, 0);
  const schoolTeachers = teachers.get(str(schoolId)) ?? new Set<string>();

  const kpis = kpiBlock(period, (days) => {
    const att = byClass.attendance(days, null, totalPupils);
    const recorded = byTeacher.actors(days, null, schoolTeachers).size;
    return {
      assessments: pct(recorded, schoolTeachers.size),
      present: att.present,
      attendanceMarked: att.attendanceMarked,
      detail: {
        assessments: [{ label: "Teachers recording", value: `${recorded} of ${schoolTeachers.size}` }],
        present: [
          { label: "On time", value: `${pct(att.onTime, att.marked) ?? "–"}%` },
          { label: "Late", value: `${pct(att.late, att.marked) ?? "–"}%` },
        ],
        attendanceMarked: [{ label: "Records marked", value: `${fmtCount(att.marked)} of ${fmtCount(att.expected)}` }],
      },
    };
  });

  const periodDays = new Set(period.days);
  const rows: ViewRow[] = classes.map((c) => {
    const id = str(c._id);
    const classPupils = pupilsByClass.get(id) ?? 0;
    const att = byClass.attendance(periodDays, new Set([id]), classPupils);
    return {
      id,
      name: [c.name, c.section].filter(Boolean).join(" "),
      subtitle: fullName(c.classTeacher as unknown as { firstName?: string; lastName?: string }),
      href: { level: "arm", id },
      kpis: {
        assessments: pct(byClass.actors(periodDays, new Set([id]), null).size, classPupils),
        present: att.present,
        attendanceMarked: att.attendanceMarked,
      },
    };
  });

  // Team: the school's teachers. Attendance columns show the arm they are class teacher of.
  const teacherUsers = await User.find({ _id: { $in: [...schoolTeachers] } }).select("firstName lastName email").lean();
  const recordedTeachers = byTeacher.actors(periodDays, null, schoolTeachers);
  const team: ViewRow[] = teacherUsers.map((t) => {
    const id = str(t._id);
    const ownClass = classes.find((c) => str((c.classTeacher as unknown as { _id?: unknown })?._id) === id);
    const classRow = ownClass ? rows.find((r) => r.id === str(ownClass._id)) : undefined;
    return {
      id,
      name: fullName(t) ?? t.email,
      subtitle: classRow ? `Class teacher, ${classRow.name}` : "Teacher",
      href: classRow ? { level: "arm" as Level, id: classRow.id } : null,
      kpis: {
        assessments: recordedTeachers.has(id) ? 100 : 0,
        present: classRow?.kpis.present ?? null,
        attendanceMarked: classRow?.kpis.attendanceMarked ?? null,
      },
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const principal = school.principal as unknown as { _id: unknown; firstName?: string; lastName?: string; email?: string } | null;
  const leader = leaders[0]?.user as unknown as { _id: unknown; firstName?: string; lastName?: string; email?: string } | undefined;
  const head = principal ?? leader ?? null;

  return {
    level: "school" as Level,
    entity: {
      kind: "school",
      id: str(school._id),
      name: school.name,
      role: "School",
      email: school.email ?? null,
      phone: school.phone || null,
      memberSince: null,
      headTeacher: head ? { id: str(head._id), name: fullName(head), email: head.email ?? null } : null,
      location: school.location || null,
    },
    counts: {
      schools: null,
      teachers: schoolTeachers.size,
      arms: classes.length,
      pupils: totalPupils,
      ptr: schoolTeachers.size ? Math.round((totalPupils / schoolTeachers.size) * 10) / 10 : null,
    },
    kpis,
    rows: { kind: "arm", items: rows },
    team,
  };
}

// ---------------------------------------------------------------------------

export async function armView(classId: Id, period: ResolvedPeriod) {
  const window = windowOf(period);
  const cls = await Class.findById(classId)
    .select("name section level school classTeacher")
    .populate("classTeacher", "firstName lastName email")
    .populate("school", "name")
    .lean();
  if (!cls) return null;

  const students = await Student.find({ class: classId, isActive: true }).select("firstName lastName enrollmentNo").sort({ lastName: 1 }).lean();
  const studentIds = students.map((s) => s._id);

  const [tallies, assessed, assessors] = await Promise.all([
    window
      ? Attendance.aggregate([
          { $match: { student: { $in: studentIds }, date: window } },
          { $group: { _id: { row: "$student", day: dayKey }, marked: { $sum: 1 }, present: presentSum, late: lateSum } },
        ])
      : [],
    window
      ? Assessment.aggregate([
          { $match: { class: classId, date: window } },
          { $group: { _id: { row: "$student", actor: "$student", day: dayKey } } },
        ])
      : [],
    window
      ? Assessment.aggregate([
          { $match: { class: classId, date: { $gte: fromKey(period.start), $lte: window.$lte }, teacher: { $ne: null } } },
          { $group: { _id: "$teacher", n: { $sum: 1 } } },
        ])
      : [],
  ]);

  const calc = calculator(
    tallies.map((t) => ({ row: str(t._id.row), day: t._id.day, marked: t.marked, present: t.present, late: t.late })),
    assessed.map((a) => ({ row: str(a._id.row), actor: str(a._id.actor), day: a._id.day }))
  );

  const kpis = kpiBlock(period, (days) => {
    const att = calc.attendance(days, null, students.length);
    const assessedPupils = calc.actors(days, null, null).size;
    return {
      assessments: pct(assessedPupils, students.length),
      present: att.present,
      attendanceMarked: att.attendanceMarked,
      detail: {
        assessments: [{ label: "Pupils assessed", value: `${assessedPupils} of ${students.length}` }],
        present: [
          { label: "On time", value: `${pct(att.onTime, att.marked) ?? "–"}%` },
          { label: "Late", value: `${pct(att.late, att.marked) ?? "–"}%` },
        ],
        attendanceMarked: [{ label: "Records marked", value: `${fmtCount(att.marked)} of ${fmtCount(att.expected)}` }],
      },
    };
  });

  const periodDays = new Set(period.days);
  const rows: ViewRow[] = students.map((s) => {
    const id = str(s._id);
    const att = calc.attendance(periodDays, new Set([id]), 1);
    return {
      id,
      name: fullName(s) ?? "",
      subtitle: s.enrollmentNo || null,
      href: null,
      kpis: {
        assessments: calc.actors(periodDays, new Set([id]), null).size ? 100 : 0,
        present: att.present,
        attendanceMarked: att.attendanceMarked,
      },
    };
  });

  // Team: the class teacher plus anyone who recorded assessments for this arm in the period
  const classTeacher = cls.classTeacher as unknown as { _id: unknown; firstName?: string; lastName?: string; email?: string } | null;
  const assessorIds = assessors.map((a) => a._id);
  const assessorUsers = await User.find({ _id: { $in: assessorIds } }).select("firstName lastName email").lean();
  const countBy = new Map(assessors.map((a) => [str(a._id), a.n as number]));
  const people = new Map<string, { name: string; email?: string }>();
  if (classTeacher) people.set(str(classTeacher._id), { name: fullName(classTeacher) ?? "", email: classTeacher.email });
  assessorUsers.forEach((u) => people.set(str(u._id), { name: fullName(u) ?? u.email, email: u.email }));
  const team: ViewRow[] = [...people.entries()].map(([id, p]) => ({
    id,
    name: p.name,
    subtitle: classTeacher && str(classTeacher._id) === id ? "Class teacher" : "Subject teacher",
    href: null,
    kpis: { assessments: countBy.get(id) ? 100 : 0, present: null, attendanceMarked: null },
    detail: `${countBy.get(id) ?? 0} assessments recorded`,
  }));

  const school = cls.school as unknown as { _id: unknown; name: string };
  return {
    level: "arm" as Level,
    school: { id: str(school._id), name: school.name },
    entity: {
      kind: "arm",
      id: str(cls._id),
      name: [cls.name, cls.section].filter(Boolean).join(" "),
      role: `Arm, ${school.name}`,
      email: null,
      phone: null,
      memberSince: null,
      headTeacher: classTeacher ? { id: str(classTeacher._id), name: fullName(classTeacher), email: classTeacher.email ?? null, label: "Class Teacher" } : null,
      location: null,
    },
    counts: {
      schools: null,
      teachers: team.length,
      arms: null,
      pupils: students.length,
      ptr: team.length ? Math.round((students.length / team.length) * 10) / 10 : null,
    },
    kpis,
    rows: { kind: "pupil", items: rows },
    team,
  };
}
