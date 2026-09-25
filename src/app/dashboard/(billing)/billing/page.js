"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  BadgePercent,
  Banknote,
  Bell,
  MailX,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  Eye,
  Loader,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  TrendingUp,
  Undo2,
  Wallet,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmActionModal from "@/app/components/ConfirmActionModal";
import useBillingScope from "./components/useBillingScope";
import BillingShell, { EmptyState, StatCard, StatusBadge } from "./components/BillingShell";
import RecordPaymentModal from "./components/RecordPaymentModal";
import BillDetailModal from "./components/BillDetailModal";
import BulkActionModal from "./components/BulkActionModal";
import { primaryButton, secondaryButton } from "./components/ModalFrame";
import {
  STATUS_META,
  TERM_LABELS,
  billingRequest,
  canManageFees,
  downloadCSV,
  formatCurrency,
  formatDate,
  isOverdue,
  studentName,
  timeAgo,
} from "./components/billingUtils";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "owing", label: "Owing (unpaid + part paid)" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Part paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "waived", label: "Waived" },
  { value: "overpaid", label: "In credit" },
  { value: "carried-forward", label: "Carried forward" },
];

const SORTS = [
  { value: "name", label: "Name (A–Z)" },
  { value: "balance", label: "Highest balance" },
  { value: "paid", label: "Highest paid" },
  { value: "class", label: "Class" },
  { value: "recent", label: "Recent payment" },
];

const PAGE_SIZES = [25, 50, 100];

export default function BillingPage() {
  const scope = useBillingScope();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState(new Set());
  const [payBill, setPayBill] = useState(null);
  const [detailBillId, setDetailBillId] = useState(null);
  const [bulkAction, setBulkAction] = useState(null);
  const [quickPaid, setQuickPaid] = useState(null);
  const [remindBill, setRemindBill] = useState(null);
  const [quickSaving, setQuickSaving] = useState(false);

  const { token, schoolId, academicSession, term, ready } = scope;

  const load = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    try {
      const res = await billingRequest(
        token,
        `/api/billing/bills?schoolId=${schoolId}&academicSession=${encodeURIComponent(academicSession)}&term=${term}`
      );
      setData(res);
    } catch (error) {
      toast.error(error.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [ready, token, schoolId, academicSession, term]);

  useEffect(() => {
    load();
    setSelected(new Set());
    setClassFilter("all");
  }, [load]);

  useEffect(() => setPage(1), [search, classFilter, statusFilter, sort, pageSize]);

  const bills = useMemo(() => data?.bills || [], [data]);
  const isFeeManager = data?.canManageFees ?? canManageFees(scope.role);

  const classScoped = useMemo(
    () => (classFilter === "all" ? bills : bills.filter((b) => b.class?._id === classFilter)),
    [bills, classFilter]
  );

  const summary = useMemo(() => summarise(classScoped), [classScoped]);

  const classBreakdown = useMemo(() => {
    const groups = new Map();
    for (const bill of bills) {
      const key = bill.class?._id || "unknown";
      if (!groups.has(key)) groups.set(key, { id: key, name: bill.class?.name || "Unknown class", bills: [] });
      groups.get(key).bills.push(bill);
    }
    return [...groups.values()]
      .map((g) => ({ ...g, ...summarise(g.bills) }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [bills]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = classScoped.filter((b) => {
      if (query) {
        const haystack = `${studentName(b.student)} ${b.student?.enrollmentNo || ""} ${b.student?.guardian?.name || ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      switch (statusFilter) {
        case "all":
          return true;
        case "owing":
          return b.status === "unpaid" || b.status === "partial";
        case "overdue":
          return isOverdue(b);
        default:
          return b.status === statusFilter;
      }
    });
    const sorters = {
      name: (a, b) => studentName(a.student).localeCompare(studentName(b.student)),
      balance: (a, b) => b.balance - a.balance,
      paid: (a, b) => b.amountPaid - a.amountPaid,
      class: (a, b) =>
        (a.class?.name || "").localeCompare(b.class?.name || "", undefined, { numeric: true }) ||
        studentName(a.student).localeCompare(studentName(b.student)),
      recent: (a, b) => new Date(b.lastPaymentAt || 0) - new Date(a.lastPaymentAt || 0),
    };
    return rows.sort(sorters[sort]);
  }, [classScoped, search, statusFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selectedBills = bills.filter((b) => selected.has(b._id));
  const allFilteredSelected = filtered.length > 0 && filtered.every((b) => selected.has(b._id));

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAllFiltered = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((b) => next.delete(b._id));
      else filtered.forEach((b) => next.add(b._id));
      return next;
    });

  const markFullyPaid = async () => {
    setQuickSaving(true);
    try {
      const res = await billingRequest(token, `/api/billing/bills/${quickPaid._id}/payments`, {
        method: "POST",
        body: JSON.stringify({ payFullBalance: true, method: "cash", note: "Marked as fully paid" }),
      });
      toast.success(res.message);
      setQuickPaid(null);
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setQuickSaving(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      "Student",
      "Admission No.",
      "Class",
      "Total Fees",
      "Brought Forward",
      "Discount",
      "Amount Paid",
      "Balance",
      "Status",
      "Overdue",
      "Due Date",
      "Last Payment",
      "Guardian",
      "Guardian Phone",
    ];
    const rows = filtered.map((b) => [
      studentName(b.student),
      b.student?.enrollmentNo || "",
      b.class?.name || "",
      b.netAmount,
      b.arrearsAmount || 0,
      b.discount?.amount || 0,
      b.amountPaid,
      b.waived ? 0 : b.balance,
      STATUS_META[b.status]?.label || b.status,
      isOverdue(b) ? "Yes" : "No",
      b.dueDate ? formatDate(b.dueDate) : "",
      b.lastPaymentAt ? formatDate(b.lastPaymentAt) : "",
      b.student?.guardian?.name || "",
      b.student?.guardian?.phone || "",
    ]);
    const slug = `${scope.schoolName || "school"}-${academicSession}-${term}`.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    downloadCSV(`fees-${slug}.csv`, headers, rows);
  };

  const unbilled = data?.unbilledStudents || [];
  const unbilledClassCount = new Set(unbilled.map((s) => s.class?._id)).size;

  return (
    <BillingShell
      scope={scope}
      title="Billing"
      description="Track school fees, record manual payments and follow up on outstanding balances."
      actions={
        <>
          <button className={secondaryButton} onClick={load} disabled={loading || !ready}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button className={secondaryButton} onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </>
      }
    >
      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : !data ? null : bills.length === 0 ? (
        <EmptyState
          icon={Wallet}
          inline
          title={`No fees set for ${TERM_LABELS[term]} ${academicSession}`}
          message={
            isFeeManager
              ? "Set the school fees for each class. Every student in the class is billed automatically."
              : "An admin or school leader needs to set class fees for this term before bills appear here."
          }
          action={
            isFeeManager && (
              <Link href="/dashboard/billing/fee-setup" className={primaryButton}>
                <Settings2 className="w-4 h-4" /> Set Up Class Fees
              </Link>
            )
          }
        />
      ) : (
        <>
          {unbilled.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="flex-1">
                <strong>{unbilled.length}</strong> student{unbilled.length === 1 ? "" : "s"} in {unbilledClassCount} class
                {unbilledClassCount === 1 ? "" : "es"} ({[...new Set(unbilled.map((s) => s.class?.name).filter(Boolean))].slice(0, 4).join(", ")}
                {unbilledClassCount > 4 ? "…" : ""}) {unbilled.length === 1 ? "has" : "have"} no fees set for this term.
              </p>
              {isFeeManager && (
                <Link href="/dashboard/billing/fee-setup" className="font-semibold text-amber-900 underline whitespace-nowrap">
                  Set fees
                </Link>
              )}
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
            <StatCard label="Expected" value={formatCurrency(summary.expected)} sub={
                summary.broughtForward > 0
                  ? `${summary.count} billed · incl. ${formatCurrency(summary.broughtForward)} brought forward`
                  : `${summary.count} students billed`
              } icon={CircleDollarSign} tone="blue" />
            <StatCard label="Collected" value={formatCurrency(summary.collected)} sub={`${summary.paidCount} fully paid`} icon={Banknote} tone="green" />
            <StatCard
              label="Outstanding"
              value={formatCurrency(summary.outstanding)}
              sub={`${summary.owingCount} owing · ${summary.overdueCount} overdue`}
              icon={AlertTriangle}
              tone="red"
            />
            <StatCard label="Collection Rate" value={`${summary.rate}%`} sub={<ProgressBar value={summary.rate} />} icon={TrendingUp} tone="amber" />
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {[
              ["paid", summary.paidCount],
              ["partial", summary.partialCount],
              ["unpaid", summary.unpaidCount],
              ["overdue", summary.overdueCount],
              ["waived", summary.waivedCount],
            ].map(([status, count]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  statusFilter === status ? "ring-2 ring-blue-500 ring-offset-1" : ""
                } ${STATUS_META[status].className}`}
              >
                {STATUS_META[status].label}
                <span className="bg-white/70 text-gray-800 rounded-full px-1.5">{count}</span>
              </button>
            ))}
          </div>

          {/* By class */}
          {classBreakdown.length > 1 && (
            <details className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 group" open>
              <summary className="cursor-pointer select-none px-5 py-4 font-bold text-gray-800 flex items-center justify-between">
                Collection by class
                <span className="text-xs font-medium text-gray-500">Click a class to filter</span>
              </summary>
              <div className="overflow-x-auto border-t border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-2">Class</th>
                      <th className="px-4 py-2 text-right">Students</th>
                      <th className="px-4 py-2 text-right">Expected</th>
                      <th className="px-4 py-2 text-right">Collected</th>
                      <th className="px-4 py-2 text-right">Outstanding</th>
                      <th className="px-4 py-2 w-48">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {classBreakdown.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setClassFilter(classFilter === c.id ? "all" : c.id)}
                        className={`cursor-pointer hover:bg-blue-50/50 ${classFilter === c.id ? "bg-blue-50" : ""}`}
                      >
                        <td className="px-4 py-2 font-medium text-gray-800">{c.name}</td>
                        <td className="px-4 py-2 text-right">{c.count}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(c.expected)}</td>
                        <td className="px-4 py-2 text-right text-green-700">{formatCurrency(c.collected)}</td>
                        <td className="px-4 py-2 text-right text-red-600">{formatCurrency(c.outstanding)}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <ProgressBar value={c.rate} />
                            <span className="text-xs text-gray-500 w-10 text-right">{c.rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student, admission no. or guardian"
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="all">All classes</option>
                {classBreakdown.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                {STATUS_FILTERS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    Sort: {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="sticky top-0 z-20 bg-blue-900 text-white rounded-xl shadow-lg px-4 py-3 mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold mr-2">{selected.size} selected</span>
              <BulkButton icon={CheckCheck} label="Mark as Paid" onClick={() => setBulkAction("mark-paid")} />
              <BulkButton icon={Plus} label="Record Payment" onClick={() => setBulkAction("record-payment")} />
              <BulkButton icon={Bell} label="Send Reminder" onClick={() => setBulkAction("remind")} />
              {isFeeManager && (
                <>
                  <BulkButton icon={BadgePercent} label="Discount" onClick={() => setBulkAction("discount")} />
                  <BulkButton icon={Ban} label="Waive" onClick={() => setBulkAction("waive")} />
                  <BulkButton icon={Undo2} label="Remove Waiver" onClick={() => setBulkAction("unwaive")} />
                </>
              )}
              <button onClick={() => setSelected(new Set())} className="ml-auto inline-flex items-center gap-1 text-sm text-blue-100 hover:text-white">
                <X className="w-4 h-4" /> Clear
              </button>
            </div>
          )}

          {/* Bills table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleAllFiltered}
                        className="w-4 h-4 rounded border-gray-300"
                        aria-label="Select all matching students"
                      />
                    </th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3 text-right">Fees</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Payment</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                        No students match these filters.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((bill) => {
                      const owing = !bill.waived && bill.balance > 0;
                      return (
                        <tr key={bill._id} className={`hover:bg-gray-50 ${selected.has(bill._id) ? "bg-blue-50/60" : ""}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selected.has(bill._id)}
                              onChange={() => toggleOne(bill._id)}
                              className="w-4 h-4 rounded border-gray-300"
                              aria-label={`Select ${studentName(bill.student)}`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => setDetailBillId(bill._id)} className="text-left">
                              <div className="font-medium text-gray-800 hover:text-blue-700">{studentName(bill.student)}</div>
                              <div className="text-xs text-gray-500">
                                {bill.student?.enrollmentNo || "—"}
                                {bill.student?.isActive === false && <span className="ml-2 text-red-500">Withdrawn</span>}
                                {bill.discount?.amount > 0 && <span className="ml-2 text-sky-600">Discount</span>}
                                {bill.canEmail === false && (
                                  <span className="ml-2 inline-flex items-center gap-0.5 text-gray-400" title="No parent or guardian email on record">
                                    <MailX className="w-3 h-3" /> No email
                                  </span>
                                )}
                              </div>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{bill.class?.name || "—"}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {formatCurrency(bill.netAmount)}
                            {bill.arrearsAmount > 0 && (
                              <div className="text-xs text-violet-600">incl. {formatCurrency(bill.arrearsAmount)} b/f</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap text-green-700">{formatCurrency(bill.amountPaid)}</td>
                          <td className={`px-4 py-3 text-right whitespace-nowrap font-semibold ${owing ? "text-red-600" : "text-gray-500"}`}>
                            {bill.waived ? "—" : formatCurrency(Math.max(bill.balance, 0))}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              <StatusBadge status={bill.status} />
                              {isOverdue(bill) && <StatusBadge status="overdue" />}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(bill.lastPaymentAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              {owing && (
                                <>
                                  <IconButton title="Record payment" onClick={() => setPayBill(bill)} icon={Plus} tone="blue" />
                                  <IconButton title="Mark as fully paid" onClick={() => setQuickPaid(bill)} icon={CheckCheck} tone="green" />
                                  {bill.canEmail && (
                                    <IconButton
                                      title={bill.lastReminderAt ? `Send reminder (last sent ${timeAgo(bill.lastReminderAt)})` : "Send payment reminder"}
                                      onClick={() => setRemindBill(bill)}
                                      icon={Bell}
                                      tone="amber"
                                    />
                                  )}
                                </>
                              )}
                              <IconButton title="View details" onClick={() => setDetailBillId(bill._id)} icon={Eye} />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span>
                  {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
                </span>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="border border-gray-300 rounded-md px-2 py-1 bg-white">
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n} / page
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button className={secondaryButton + " !px-2 !py-1"} disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  className={secondaryButton + " !px-2 !py-1"}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {payBill && (
        <RecordPaymentModal
          token={token}
          bill={payBill}
          schoolName={scope.schoolName}
          onClose={() => setPayBill(null)}
          onRecorded={load}
        />
      )}

      {detailBillId && !payBill && (
        <BillDetailModal
          token={token}
          billId={detailBillId}
          schoolName={scope.schoolName}
          onClose={() => setDetailBillId(null)}
          onChanged={load}
          onRecordPayment={(bill) => setPayBill(bill)}
        />
      )}

      {bulkAction && (
        <BulkActionModal
          token={token}
          schoolId={schoolId}
          action={bulkAction}
          bills={selectedBills}
          onClose={() => setBulkAction(null)}
          onDone={() => {
            setBulkAction(null);
            setSelected(new Set());
            load();
          }}
        />
      )}

      {remindBill && (
        <BulkActionModal
          token={token}
          schoolId={schoolId}
          action="remind"
          bills={[remindBill]}
          onClose={() => setRemindBill(null)}
          onDone={() => {
            setRemindBill(null);
            load();
          }}
        />
      )}

      {quickPaid && (
        <ConfirmActionModal
          title="Mark as fully paid?"
          message={`This records a cash payment of ${formatCurrency(quickPaid.balance)} for ${studentName(
            quickPaid.student
          )}, clearing their balance for ${TERM_LABELS[term]}${
            quickPaid.canEmail ? ", and emails the parent a receipt" : ""
          }. Use "Record payment" instead to set a different method or reference.`}
          confirmText="Mark as Paid"
          isLoading={quickSaving}
          onConfirm={markFullyPaid}
          onCancel={() => setQuickPaid(null)}
        />
      )}
    </BillingShell>
  );
}

function summarise(bills) {
  const s = {
    count: bills.length,
    expected: 0,
    collected: 0,
    outstanding: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0,
    waivedCount: 0,
    overdueCount: 0,
    owingCount: 0,
    broughtForward: 0,
  };
  for (const b of bills) {
    if (!b.waived) s.expected += b.netAmount;
    if (!b.waived) s.broughtForward += b.arrearsAmount || 0;
    s.collected += b.amountPaid;
    if (!b.waived && b.balance > 0) {
      s.outstanding += b.balance;
      s.owingCount++;
    }
    if (b.status === "paid" || b.status === "overpaid") s.paidCount++;
    if (b.status === "partial") s.partialCount++;
    if (b.status === "unpaid") s.unpaidCount++;
    if (b.status === "waived") s.waivedCount++;
    if (isOverdue(b)) s.overdueCount++;
  }
  s.rate = s.expected > 0 ? Math.min(100, Math.round((Math.min(s.collected, s.expected) / s.expected) * 100)) : 0;
  return s;
}

function ProgressBar({ value }) {
  const color = value >= 80 ? "bg-green-500" : value >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <span className="block w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
      <span className={`block h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
    </span>
  );
}

function BulkButton({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition">
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

function IconButton({ icon: Icon, title, onClick, tone = "gray" }) {
  const tones = {
    gray: "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
    blue: "text-blue-600 hover:bg-blue-50",
    green: "text-green-600 hover:bg-green-50",
    amber: "text-amber-600 hover:bg-amber-50",
  };
  return (
    <button title={title} aria-label={title} onClick={onClick} className={`p-1.5 rounded-lg transition ${tones[tone]}`}>
      <Icon className="w-4 h-4" />
    </button>
  );
}
