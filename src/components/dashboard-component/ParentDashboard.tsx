"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Clock, XCircle, MessageSquare, BookOpen, Loader } from "lucide-react";

// Chart colors (validated): one series -> categorical slot 1; attendance uses the fixed status
// palette, always shown with an icon and label so color never carries the meaning alone.
const SERIES = "#2a78d6";
const GRID = "#e1e0d9";
const AXIS = "#898781";
const STATUS = { present: "#0ca30c", late: "#fab219", absent: "#d03b3b" };

type ChildSummary = {
  _id: string;
  firstName: string;
  lastName: string;
  picture: string | null;
  className: string | null;
  attendance: { present: number; late: number; absent: number; days: number; rate: number | null };
  scores: { average: number | null; previousAverage: number | null; change: number | null; assessmentsLast30: number };
  scoreTrend: { weekStart: string; average: number | null; count: number }[];
  subjectAverages: { subject: string; average: number; count: number }[];
  exams: { taken: number; average: number | null; latest: { title: string; score: number; maxScore: number; submittedAt: string } | null };
  reportCards: number;
  feedback: {
    last30: number;
    recent: { _id: string; title: string; comment: string; authorName: string; authorRole: string; replies: number; createdAt: string }[];
  };
  recentAssessments: { _id: string; subject: string; percentage: number; gradeLevel: string | null; assessmentType: string; date: string }[];
};

const fmtPercent = (n: number | null) => (n === null || n === undefined ? "—" : `${Math.round(n)}%`);
const fmtDate = (d: string) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
const weekLabel = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

function StatTile({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
      {children && <div className="mt-1 text-sm text-gray-500">{children}</div>}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  table,
  children,
}: {
  title: string;
  subtitle: string;
  table: React.ReactNode;
  children: React.ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
        >
          {showTable ? "Show chart" : "Show table"}
        </button>
      </div>
      {showTable ? <div className="overflow-x-auto">{table}</div> : children}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  render,
}: {
  active?: boolean;
  payload?: readonly { payload?: unknown }[];
  render: (point) => React.ReactNode;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">{render(payload[0].payload)}</div>
  );
}

const tableClass = "w-full text-left text-sm";
const thClass = "border-b border-gray-200 py-2 pr-4 font-medium text-gray-600";
const tdClass = "border-b border-gray-100 py-2 pr-4 text-gray-800 tabular-nums";

function ScoreTrend({ data }: { data: ChildSummary["scoreTrend"] }) {
  const hasData = data.some((w) => w.average !== null);
  const points = data.map((w) => ({ ...w, label: weekLabel(w.weekStart) }));
  return (
    <ChartCard
      title="Score trend"
      subtitle="Weekly average score, last 12 weeks"
      table={
        <table className={tableClass}>
          <thead>
            <tr><th className={thClass}>Week of</th><th className={thClass}>Average</th><th className={thClass}>Assessments</th></tr>
          </thead>
          <tbody>
            {points.map((w) => (
              <tr key={w.weekStart}><td className={tdClass}>{w.label}</td><td className={tdClass}>{fmtPercent(w.average)}</td><td className={tdClass}>{w.count}</td></tr>
            ))}
          </tbody>
        </table>
      }
    >
      {hasData ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 12 }} axisLine={{ stroke: GRID }} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                cursor={{ stroke: AXIS, strokeWidth: 1 }}
                content={(props) => (
                  <ChartTooltip
                    {...props}
                    render={(p) => (
                      <>
                        <p className="font-medium text-gray-900">Week of {p.label}</p>
                        <p className="text-gray-600">
                          {p.average === null ? "No assessments" : `Average ${fmtPercent(p.average)} · ${p.count} assessment${p.count === 1 ? "" : "s"}`}
                        </p>
                      </>
                    )}
                  />
                )}
              />
              <Line
                type="monotone"
                dataKey="average"
                stroke={SERIES}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                connectNulls
                dot={{ r: 4, fill: SERIES, stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: SERIES, stroke: "#ffffff", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-16 text-center text-sm text-gray-500">No assessments recorded in the last 12 weeks yet.</p>
      )}
    </ChartCard>
  );
}

function SubjectAverages({ data }: { data: ChildSummary["subjectAverages"] }) {
  const height = Math.max(160, data.length * 36 + 24);
  return (
    <ChartCard
      title="Subject averages"
      subtitle="Average score per subject, last 90 days"
      table={
        <table className={tableClass}>
          <thead>
            <tr><th className={thClass}>Subject</th><th className={thClass}>Average</th><th className={thClass}>Assessments</th></tr>
          </thead>
          <tbody>
            {data.map((s) => (
              <tr key={s.subject}><td className={tdClass}>{s.subject}</td><td className={tdClass}>{fmtPercent(s.average)}</td><td className={tdClass}>{s.count}</td></tr>
            ))}
          </tbody>
        </table>
      }
    >
      {data.length ? (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
              <YAxis type="category" dataKey="subject" width={130} tick={{ fill: "#52514e", fontSize: 12 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(42,120,214,0.06)" }}
                content={(props) => (
                  <ChartTooltip
                    {...props}
                    render={(p) => (
                      <>
                        <p className="font-medium text-gray-900">{p.subject}</p>
                        <p className="text-gray-600">Average {fmtPercent(p.average)} · {p.count} assessment{p.count === 1 ? "" : "s"}</p>
                      </>
                    )}
                  />
                )}
              />
              <Bar dataKey="average" fill={SERIES} barSize={18} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                <LabelList dataKey="average" position="right" formatter={(v) => fmtPercent(Number(v))} style={{ fill: "#52514e", fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-16 text-center text-sm text-gray-500">No assessments recorded in the last 90 days yet.</p>
      )}
    </ChartCard>
  );
}

function AttendanceSplit({ attendance }: { attendance: ChildSummary["attendance"] }) {
  const parts = [
    { key: "present", label: "Present", count: attendance.present, color: STATUS.present, Icon: CheckCircle2, ink: "#ffffff" },
    { key: "late", label: "Late", count: attendance.late, color: STATUS.late, Icon: Clock, ink: "#0b0b0b" },
    { key: "absent", label: "Absent", count: attendance.absent, color: STATUS.absent, Icon: XCircle, ink: "#ffffff" },
  ];
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900">Attendance</h3>
      <p className="mb-4 text-sm text-gray-500">School days recorded in the last 30 days</p>
      {attendance.days ? (
        <>
          <div
            className="flex h-7 w-full gap-[2px]"
            role="img"
            aria-label={parts.map((p) => `${p.label} ${p.count} days`).join(", ")}
          >
            {parts
              .filter((p) => p.count > 0)
              .map((p) => {
                const share = (p.count / attendance.days) * 100;
                return (
                  <div
                    key={p.key}
                    title={`${p.label}: ${p.count} day${p.count === 1 ? "" : "s"} (${Math.round(share)}%)`}
                    className="flex items-center rounded px-2 text-xs font-semibold"
                    style={{ width: `${share}%`, backgroundColor: p.color, color: p.ink }}
                  >
                    {share >= 14 ? `${Math.round(share)}%` : ""}
                  </div>
                );
              })}
          </div>
          <ul className="mt-4 grid grid-cols-3 gap-2 text-sm">
            {parts.map(({ key, label, count, color, Icon }) => (
              <li key={key} className="flex items-center gap-2 text-gray-700">
                <Icon className="h-4 w-4 shrink-0" style={{ color }} aria-hidden="true" />
                <span>
                  {label} <span className="font-semibold text-gray-900">{count}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="py-6 text-sm text-gray-500">No attendance recorded in the last 30 days.</p>
      )}
    </div>
  );
}

function RecentActivity({ child }: { child: ChildSummary }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <BookOpen className="h-4 w-4 text-gray-500" aria-hidden="true" /> Recent assessments
        </h3>
        {child.recentAssessments.length ? (
          <ul className="divide-y divide-gray-100">
            {child.recentAssessments.map((a) => (
              <li key={a._id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.subject}</p>
                  <p className="text-xs capitalize text-gray-500">{a.assessmentType} · {fmtDate(a.date)}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 tabular-nums">
                  {fmtPercent(a.percentage)}
                  {a.gradeLevel && <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700">{a.gradeLevel}</span>}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No assessments yet.</p>
        )}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <MessageSquare className="h-4 w-4 text-gray-500" aria-hidden="true" /> Latest feedback
        </h3>
        {child.feedback.recent.length ? (
          <ul className="divide-y divide-gray-100">
            {child.feedback.recent.map((f) => (
              <li key={f._id} className="py-2.5">
                <p className="text-sm font-medium text-gray-900">{f.title}</p>
                <p className="line-clamp-2 text-sm text-gray-600">{f.comment}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {f.authorName} · {fmtDate(f.createdAt)}
                  {f.replies > 0 && ` · ${f.replies} repl${f.replies === 1 ? "y" : "ies"}`}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No feedback yet.</p>
        )}
        <Link href="/dashboard/my-children" className="mt-3 inline-block text-sm font-medium text-blue-700 hover:underline">
          Open My Children to read and reply
        </Link>
      </div>
    </div>
  );
}

export default function ParentDashboard() {
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/parent/dashboard");
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to load your children's progress");
        setChildren(data.children || []);
        setSelectedId(data.children?.[0]?._id || "");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const child = useMemo(() => children.find((c) => c._id === selectedId) || null, [children, selectedId]);

  if (loading) {
    return (
      <div className="mt-6 flex justify-center py-16">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  }

  if (!children.length) {
    return (
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-gray-900">No children linked to your account yet</p>
        <p className="mt-1 text-sm text-gray-500">Once your child&apos;s school links them to your account, their progress will appear here.</p>
      </div>
    );
  }

  const change = child.scores.change;

  return (
    <div className="mt-6 space-y-6">
      {children.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1" role="tablist" aria-label="Choose a child">
          {children.map((c) => {
            const selected = c._id === selectedId;
            return (
              <button
                key={c._id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setSelectedId(c._id)}
                className={`flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                  selected ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"
                }`}
              >
                {c.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.picture} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {c.firstName?.[0]}{c.lastName?.[0]}
                  </span>
                )}
                <span>
                  <span className="block text-sm font-semibold text-gray-900">{c.firstName} {c.lastName}</span>
                  <span className="block text-xs text-gray-500">{c.className || "No class"}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {child.firstName}&apos;s progress
        </h2>
        <p className="text-sm text-gray-500">{child.className ? `${child.className} · ` : ""}Updated from school records</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Attendance, last 30 days" value={fmtPercent(child.attendance.rate)}>
          {child.attendance.days
            ? `${child.attendance.present + child.attendance.late} of ${child.attendance.days} days in school`
            : "No days recorded yet"}
        </StatTile>
        <StatTile label="Average score, last 30 days" value={fmtPercent(child.scores.average)}>
          {change === null ? (
            `${child.scores.assessmentsLast30} assessment${child.scores.assessmentsLast30 === 1 ? "" : "s"}`
          ) : (
            <span className="inline-flex items-center gap-1">
              {change >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-[#006300]" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-[#d03b3b]" aria-hidden="true" />
              )}
              <span className={change >= 0 ? "text-[#006300]" : "text-[#b42828]"}>
                {change >= 0 ? "+" : ""}{change} pts
              </span>
              <span>vs previous 30 days</span>
            </span>
          )}
        </StatTile>
        <StatTile label="CBT exams" value={child.exams.taken ? fmtPercent(child.exams.average) : "—"}>
          {child.exams.taken
            ? `Average across ${child.exams.taken} exam${child.exams.taken === 1 ? "" : "s"}`
            : "No CBT exams taken yet"}
        </StatTile>
        <StatTile label="Report cards" value={String(child.reportCards)}>
          <Link href="/dashboard/my-children" className="font-medium text-blue-700 hover:underline">
            View in My Children
          </Link>
        </StatTile>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ScoreTrend data={child.scoreTrend} />
        <SubjectAverages data={child.subjectAverages} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <AttendanceSplit attendance={child.attendance} />
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-gray-900">Latest CBT exam</h3>
          {child.exams.latest ? (
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">{child.exams.latest.title}</p>
                <p className="text-xs text-gray-500">Submitted {fmtDate(child.exams.latest.submittedAt)}</p>
              </div>
              <p className="text-3xl font-semibold text-gray-900">
                {child.exams.latest.score}
                <span className="text-lg font-normal text-gray-500"> / {child.exams.latest.maxScore}</span>
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">No CBT exams taken yet.</p>
          )}
          <p className="mt-4 border-t border-gray-100 pt-3 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{child.feedback.last30}</span> new feedback note{child.feedback.last30 === 1 ? "" : "s"} from school in the last 30 days
          </p>
        </div>
      </div>

      <RecentActivity child={child} />
    </div>
  );
}
