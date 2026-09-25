"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, ChevronLeft, ChevronRight, Download, Hash, Loader, Printer, ReceiptText, RefreshCw, Search } from "lucide-react";
import toast from "react-hot-toast";
import useBillingScope from "../components/useBillingScope";
import BillingShell, { EmptyState, StatCard } from "../components/BillingShell";
import { secondaryButton } from "../components/ModalFrame";
import {
  PAYMENT_METHODS,
  balanceAfterPayment,
  billingRequest,
  downloadCSV,
  formatCurrency,
  formatDate,
  methodLabel,
  printReceipt,
  studentName,
} from "../components/billingUtils";

const PAGE_SIZE = 50;
const personName = (p) => (p ? `${p.firstName || ""} ${p.lastName || ""}`.trim() : "—");

export default function PaymentHistoryPage() {
  const scope = useBillingScope();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showVoided, setShowVoided] = useState(false);
  const [page, setPage] = useState(1);

  const { token, schoolId, academicSession, term, ready } = scope;

  const load = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    try {
      const res = await billingRequest(
        token,
        `/api/billing/bills?schoolId=${schoolId}&academicSession=${encodeURIComponent(academicSession)}&term=${term}`
      );
      setBills(res.bills || []);
    } catch (error) {
      toast.error(error.message);
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, [ready, token, schoolId, academicSession, term]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => setPage(1), [search, method, classFilter, from, to, showVoided]);

  const payments = useMemo(
    () =>
      bills
        .flatMap((bill) => bill.payments.map((payment) => ({ payment, bill })))
        .sort((a, b) => new Date(b.payment.paidAt).getTime() - new Date(a.payment.paidAt).getTime()),
    [bills]
  );

  const classes = useMemo(() => {
    const map = new Map(bills.map((b) => [b.class?._id, b.class?.name]));
    return [...map.entries()].filter(([id]) => id).sort((a, b) => a[1].localeCompare(b[1], undefined, { numeric: true }));
  }, [bills]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(`${to}T23:59:59`) : null;
    return payments.filter(({ payment, bill }) => {
      if (!showVoided && payment.voided) return false;
      if (method !== "all" && payment.method !== method) return false;
      if (classFilter !== "all" && bill.class?._id !== classFilter) return false;
      const paidAt = new Date(payment.paidAt);
      if (fromDate && paidAt < fromDate) return false;
      if (toDate && paidAt > toDate) return false;
      if (query) {
        const haystack = `${studentName(bill.student)} ${bill.student?.enrollmentNo || ""} ${payment.receiptNo} ${payment.reference || ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [payments, search, method, classFilter, from, to, showVoided]);

  const stats = useMemo(() => {
    const valid = filtered.filter(({ payment }) => !payment.voided);
    const byMethod: Record<string, number> = {};
    for (const { payment } of valid) byMethod[payment.method] = (byMethod[payment.method] || 0) + payment.amount;
    const total = valid.reduce((sum, { payment }) => sum + payment.amount, 0);
    return { total, count: valid.length, average: valid.length ? total / valid.length : 0, byMethod };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    downloadCSV(
      `payments-${academicSession}-${term}.csv`.replace(/[^a-z0-9.-]+/gi, "-"),
      ["Date", "Receipt No.", "Student", "Admission No.", "Class", "Method", "Reference", "Amount", "Recorded By", "Voided", "Void Reason", "Note"],
      filtered.map(({ payment, bill }) => [
        formatDate(payment.paidAt),
        payment.receiptNo,
        studentName(bill.student),
        bill.student?.enrollmentNo || "",
        bill.class?.name || "",
        methodLabel(payment.method),
        payment.reference || "",
        payment.amount,
        personName(payment.recordedBy),
        payment.voided ? "Yes" : "No",
        payment.voidReason || "",
        payment.note || "",
      ])
    );
  };

  return (
    <BillingShell
      scope={scope}
      title="Payment History"
      description="Every payment recorded for the selected term, with printable receipts."
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
      {loading && bills.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <EmptyState icon={ReceiptText} inline title="No payments yet" message="Payments recorded on the Student Bills page will appear here." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4">
            <StatCard label="Total received" value={formatCurrency(stats.total)} sub="Matching current filters" icon={Banknote} tone="green" />
            <StatCard label="Payments" value={stats.count} icon={Hash} tone="blue" />
            <StatCard label="Average payment" value={formatCurrency(stats.average)} icon={ReceiptText} tone="slate" />
          </div>

          {Object.keys(stats.byMethod).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(stats.byMethod)
                .sort((a, b) => b[1] - a[1])
                .map(([m, amount]) => (
                  <button
                    key={m}
                    onClick={() => setMethod(method === m ? "all" : m)}
                    className={`text-xs font-semibold rounded-full border px-3 py-1 transition ${
                      method === m ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
                    }`}
                  >
                    {methodLabel(m)} · {formatCurrency(amount)}
                  </button>
                ))}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-center">
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Student, receipt or reference"
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="all">All classes</option>
                {classes.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="all">All methods</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" aria-label="From date" />
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" aria-label="To date" />
            </div>
            <label className="inline-flex items-center gap-2 mt-3 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={showVoided} onChange={(e) => setShowVoided(e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
              Show voided payments
            </label>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Receipt</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Recorded by</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                        No payments match these filters.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map(({ payment, bill }) => (
                      <tr key={payment._id} className={payment.voided ? "bg-red-50/40 text-gray-400" : "hover:bg-gray-50"}>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(payment.paidAt)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={payment.voided ? "line-through" : "font-mono text-xs text-gray-700"}>{payment.receiptNo}</span>
                          {payment.voided && <div className="text-xs text-red-500">Voided</div>}
                          {payment.reference && <div className="text-xs text-gray-400">Ref: {payment.reference}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{studentName(bill.student)}</div>
                          <div className="text-xs text-gray-500">{bill.student?.enrollmentNo || "—"}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{bill.class?.name || "—"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{methodLabel(payment.method)}</td>
                        <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${payment.voided ? "line-through" : "text-green-700"}`}>
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{personName(payment.recordedBy)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            title="Print receipt"
                            onClick={() =>
                              printReceipt({ schoolName: scope.schoolName, bill, payment, balanceAfter: balanceAfterPayment(bill, payment) }) ||
                              toast.error("Allow pop-ups to print the receipt")
                            }
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
                <button className={secondaryButton + " !px-2 !py-1"} disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button className={secondaryButton + " !px-2 !py-1"} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </BillingShell>
  );
}
