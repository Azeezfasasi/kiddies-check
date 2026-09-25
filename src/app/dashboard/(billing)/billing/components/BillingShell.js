"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarX, Loader, ShieldAlert, Wallet } from "lucide-react";
import { BILLING_ROLES, STATUS_META, TERM_LABELS } from "./billingUtils";

const TABS = [
  { href: "/dashboard/billing", label: "Student Bills" },
  { href: "/dashboard/billing/fee-setup", label: "Fee Setup" },
  { href: "/dashboard/billing/payments", label: "Payment History" },
];

const selectClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

export default function BillingShell({ scope, title, description, actions, children }) {
  const pathname = usePathname();

  if (scope.initialised && !BILLING_ROLES.includes(scope.role)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        message="Billing is available to admins, school leaders and learning specialists."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-0 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Wallet className="w-7 h-7 text-blue-600" />
              {title}
            </h1>
            <p className="text-gray-600 mt-1">{description}</p>
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>

        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  active
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">School</label>
              {scope.role === "admin" ? (
                <select value={scope.schoolId} onChange={(e) => scope.selectSchool(e.target.value)} className={selectClass}>
                  {scope.schools.length === 0 && <option value="">No schools found</option>}
                  {scope.schools.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700">
                  {scope.schoolName || (scope.initialised ? "No school assigned" : "Loading your school…")}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Academic Session
              </label>
              <select value={scope.academicSession} onChange={(e) => scope.selectSession(e.target.value)} className={selectClass}>
                {scope.sessions.length === 0 && <option value="">No sessions configured</option>}
                {scope.sessions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Term</label>
              <select value={scope.term} onChange={(e) => scope.setTerm(e.target.value)} className={selectClass}>
                {scope.termsForSession.length === 0 && <option value="">No terms</option>}
                {scope.termsForSession.map((t) => (
                  <option key={t} value={t}>
                    {TERM_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {!scope.initialised ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : scope.sessions.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title="No academic calendar yet"
            message="Billing runs per term. Add the academic session and its terms in Academic Calendar first."
            inline
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, message, action, inline = false }) {
  return (
    <div className={inline ? "" : "min-h-[60vh] flex items-center justify-center p-4"}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center max-w-xl mx-auto">
        <Icon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <p className="text-gray-500 mt-1 text-sm">{message}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

export function StatCard({ label, value, sub, tone = "blue", icon: Icon }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="text-xl md:text-2xl font-bold text-gray-800 mt-1 break-words">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg shrink-0 ${tones[tone]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.unpaid;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap ${meta.className}`}>
      {meta.label}
    </span>
  );
}
