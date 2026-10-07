import AcademicCalendar from "@/app/server/models/AcademicCalendar";

/**
 * Reporting periods for Spotlight. Dates are plain YYYY-MM-DD keys in the
 * server's local timezone, matching how attendance dates are stored
 * (local midnight, see /api/teacher/attendance).
 */

export type PeriodType = "day" | "week" | "term";

export interface TermInfo {
  id: string;
  session: string;
  term: "first" | "second" | "third";
  label: string; // "Term 1"
  start: string;
  end: string;
}

export interface Bucket {
  key: string; // a day key, or "W3" for a term week
  label: string; // "Mon", "W3"
  days: string[]; // working days inside the bucket, up to today
}

export interface ResolvedPeriod {
  type: PeriodType;
  date: string; // the anchor date the client navigates with
  start: string;
  end: string;
  days: string[]; // working days in the period, up to today
  label: string;
  term: TermInfo | null;
  weekNumber: number | null;
  prevDate: string | null;
  nextDate: string | null;
  comparison: { label: string; days: string[] } | null;
  series: Bucket[];
}

const TERM_NUMBER = { first: 1, second: 2, third: 3 } as const;
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const fromKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const addDays = (key: string, n: number) => {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
};

const mondayOf = (key: string) => {
  const day = fromKey(key).getDay();
  return addDays(key, day === 0 ? -6 : 1 - day);
};

const rangeKeys = (start: string, end: string) => {
  const keys: string[] = [];
  for (let k = start; k <= end; k = addDays(k, 1)) keys.push(k);
  return keys;
};

const fmt = (key: string, options: Intl.DateTimeFormatOptions) =>
  fromKey(key).toLocaleDateString("en-US", options);

/** Loads terms and holidays once per request. */
export async function loadCalendar() {
  const docs = await AcademicCalendar.find({ isActive: true })
    .select("session term startDate endDate holidays")
    .sort({ startDate: 1 })
    .lean<{ _id: unknown; session: string; term: TermInfo["term"]; startDate: Date; endDate: Date; holidays?: { date: Date }[] }[]>();

  const holidays = new Set<string>();
  const terms: TermInfo[] = docs.map((t) => {
    t.holidays?.forEach((h) => holidays.add(toKey(new Date(h.date))));
    return {
      id: String(t._id),
      session: t.session,
      term: t.term,
      label: `Term ${TERM_NUMBER[t.term] ?? ""}`.trim(),
      start: toKey(new Date(t.startDate)),
      end: toKey(new Date(t.endDate)),
    };
  });
  return { terms, holidays };
}

type Calendar = Awaited<ReturnType<typeof loadCalendar>>;

export function resolvePeriod(type: PeriodType, anchor: string, calendar: Calendar): ResolvedPeriod {
  const today = toKey(new Date());
  const isWorkingDay = (key: string) => {
    const dow = fromKey(key).getDay();
    return dow !== 0 && dow !== 6 && !calendar.holidays.has(key);
  };
  const workingDays = (start: string, end: string) =>
    rangeKeys(start, end < today ? end : today).filter(isWorkingDay);
  const stepWorkingDay = (key: string, dir: 1 | -1) => {
    let k = addDays(key, dir);
    for (let i = 0; i < 30 && !isWorkingDay(k); i++) k = addDays(k, dir);
    return k;
  };
  const termOf = (key: string) =>
    calendar.terms.find((t) => t.start <= key && key <= t.end) ??
    // Between terms: report against the most recent term that has started
    [...calendar.terms].reverse().find((t) => t.start <= key) ??
    null;
  const weekNumberOf = (key: string, term: TermInfo | null) =>
    term && key >= term.start ? Math.floor((fromKey(mondayOf(key)).getTime() - fromKey(mondayOf(term.start)).getTime()) / (7 * 864e5)) + 1 : null;

  let date = anchor > today ? today : anchor;

  if (type === "day") {
    if (!isWorkingDay(date)) date = stepWorkingDay(date, -1);
    const term = termOf(date);
    const next = stepWorkingDay(date, 1);
    const prev = stepWorkingDay(date, -1);
    const monday = mondayOf(date);
    return {
      type, date, start: date, end: date,
      days: workingDays(date, date),
      label: `${fmt(date, { weekday: "long", month: "short", day: "numeric", year: "numeric" })}${term ? ` (${term.label})` : ""}`,
      term,
      weekNumber: weekNumberOf(date, term),
      prevDate: prev,
      nextDate: next <= today ? next : null,
      comparison: { label: "vs previous working day", days: workingDays(prev, prev) },
      series: rangeKeys(monday, addDays(monday, 4)).map((k) => ({
        key: k,
        label: DAY_NAMES[fromKey(k).getDay()],
        days: workingDays(k, k),
      })),
    };
  }

  if (type === "week") {
    const start = mondayOf(date);
    const end = addDays(start, 4);
    const term = termOf(start);
    const week = weekNumberOf(start, term);
    const prevStart = addDays(start, -7);
    const nextStart = addDays(start, 7);
    return {
      type, date: start, start, end,
      days: workingDays(start, end),
      label: `${fmt(start, { month: "short", day: "numeric" })} – ${fmt(end, { month: "short", day: "numeric", year: "numeric" })}${week ? ` (Week ${week})` : ""}`,
      term,
      weekNumber: week,
      prevDate: prevStart,
      nextDate: nextStart <= today ? nextStart : null,
      comparison: { label: "vs previous week", days: workingDays(prevStart, addDays(prevStart, 4)) },
      series: rangeKeys(start, end).map((k) => ({
        key: k,
        label: DAY_NAMES[fromKey(k).getDay()],
        days: workingDays(k, k),
      })),
    };
  }

  // Term
  const term = termOf(date);
  if (!term) {
    return {
      type, date, start: date, end: date, days: [], label: "No term in the academic calendar",
      term: null, weekNumber: null, prevDate: null, nextDate: null, comparison: null, series: [],
    };
  }
  const index = calendar.terms.indexOf(term);
  const prevTerm = calendar.terms[index - 1] ?? null;
  const nextTerm = calendar.terms[index + 1] ?? null;
  const series: Bucket[] = [];
  for (let monday = mondayOf(term.start), w = 1; monday <= term.end && monday <= today; monday = addDays(monday, 7), w++) {
    const from = monday < term.start ? term.start : monday;
    const friday = addDays(monday, 4);
    series.push({ key: `W${w}`, label: `W${w}`, days: workingDays(from, friday > term.end ? term.end : friday) });
  }
  return {
    type, date: term.start, start: term.start, end: term.end,
    days: workingDays(term.start, term.end),
    label: `${term.label}, ${term.session}`,
    term,
    weekNumber: null,
    prevDate: prevTerm?.start ?? null,
    nextDate: nextTerm && nextTerm.start <= today ? nextTerm.start : null,
    comparison: prevTerm ? { label: "vs previous term", days: workingDays(prevTerm.start, prevTerm.end) } : null,
    series,
  };
}
