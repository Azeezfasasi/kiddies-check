"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader, Printer, ReceiptText, Wallet, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  STATUS_META,
  TERM_LABELS,
  balanceAfterPayment,
  formatCurrency,
  formatDate,
  isOverdue,
  methodLabel,
  printReceipt,
} from "@/app/dashboard/(billing)/billing/components/billingUtils";

// Read-only school-fee view for parents: every term's bill for one child,
// with payments and printable receipts.
export default function StudentFeesPanel({ studentId, studentName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openBill, setOpenBill] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/parent/fees?studentId=${studentId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to load fees");
        setData(json);
        setOpenBill(json.bills[0]?._id || null);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load school fees");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  const bills = data?.bills || [];
  const current = bills[0];
  const school = current ? data.schools[String(current.school)] : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">{studentName}&apos;s School Fees</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-16">
              <Wallet className="w-14 h-14 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No school fees have been billed for {studentName} yet.</p>
            </div>
          ) : (
            <>
              <div
                className={`rounded-xl p-5 mb-6 ${
                  data.totalOutstanding > 0 ? "bg-red-50 border border-red-100" : "bg-green-50 border border-green-100"
                }`}
              >
                <p className={`text-sm font-medium ${data.totalOutstanding > 0 ? "text-red-700" : "text-green-700"}`}>
                  {data.totalOutstanding > 0 ? "Total outstanding" : "All fees paid"}
                </p>
                <p className={`text-3xl font-bold mt-1 ${data.totalOutstanding > 0 ? "text-red-700" : "text-green-700"}`}>
                  {formatCurrency(data.totalOutstanding)}
                </p>
                {data.totalOutstanding > 0 && current?.dueDate && current.balance > 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    {isOverdue(current) ? "Was due" : "Due by"} {formatDate(current.dueDate)}
                  </p>
                )}
                {school && (school.phone || school.email) && (
                  <p className="text-xs text-gray-600 mt-3">
                    Questions about fees? Contact {school.name}
                    {school.phone ? ` on ${school.phone}` : ""}
                    {school.email ? ` or ${school.email}` : ""}.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {bills.map((bill) => {
                  const open = openBill === bill._id;
                  const carried = (bill.carriedForward?.amount || 0) > 0;
                  const meta = STATUS_META[bill.status] || STATUS_META.unpaid;
                  return (
                    <div key={bill._id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setOpenBill(open ? null : bill._id)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">
                            {TERM_LABELS[bill.term]} {bill.academicSession}
                          </p>
                          <p className="text-xs text-gray-500">{bill.class?.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.className}`}>{meta.label}</span>
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
                        </div>
                      </button>

                      {open && (
                        <div className="p-4 text-sm">
                          <table className="w-full mb-4">
                            <tbody className="divide-y divide-gray-100">
                              {(bill.arrears || []).map((a) => (
                                <tr key={a.bill}>
                                  <td className="py-1.5 text-violet-700">
                                    Balance brought forward ({TERM_LABELS[a.term]} {a.academicSession})
                                  </td>
                                  <td className="py-1.5 text-right text-violet-700">{formatCurrency(a.amount)}</td>
                                </tr>
                              ))}
                              {bill.items.map((item) => (
                                <tr key={item.name}>
                                  <td className="py-1.5 text-gray-600">{item.name}</td>
                                  <td className="py-1.5 text-right">{formatCurrency(item.amount)}</td>
                                </tr>
                              ))}
                              {bill.discount?.amount > 0 && (
                                <tr>
                                  <td className="py-1.5 text-sky-700">Discount</td>
                                  <td className="py-1.5 text-right text-sky-700">−{formatCurrency(bill.discount.amount)}</td>
                                </tr>
                              )}
                              <tr className="font-semibold">
                                <td className="py-1.5">Total due</td>
                                <td className="py-1.5 text-right">{formatCurrency(bill.netAmount)}</td>
                              </tr>
                              <tr>
                                <td className="py-1.5 text-green-700">Paid</td>
                                <td className="py-1.5 text-right text-green-700">{formatCurrency(bill.amountPaid)}</td>
                              </tr>
                              <tr className="font-bold">
                                <td className="py-1.5">Balance</td>
                                <td className={`py-1.5 text-right ${bill.balance > 0 ? "text-red-600" : ""}`}>
                                  {bill.waived ? "Waived" : formatCurrency(Math.max(bill.balance, 0))}
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          {carried && (
                            <p className="text-xs text-violet-700 bg-violet-50 rounded-lg p-2.5 mb-4">
                              The unpaid {formatCurrency(bill.carriedForward.amount)} was moved to the{" "}
                              {TERM_LABELS[bill.carriedForward.term]} {bill.carriedForward.academicSession} bill.
                            </p>
                          )}

                          <p className="font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                            <ReceiptText className="w-4 h-4" /> Payments
                          </p>
                          {bill.payments.length === 0 ? (
                            <p className="text-gray-500 text-xs">No payments recorded for this term.</p>
                          ) : (
                            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                              {[...bill.payments]
                                .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))
                                .map((p) => (
                                  <li key={p._id} className="flex items-center justify-between gap-3 px-3 py-2">
                                    <div>
                                      <p className="font-medium text-gray-800">{formatCurrency(p.amount)}</p>
                                      <p className="text-xs text-gray-500">
                                        {formatDate(p.paidAt)} · {methodLabel(p.method)} · {p.receiptNo}
                                      </p>
                                    </div>
                                    <button
                                      title="Print receipt"
                                      onClick={() =>
                                        printReceipt({
                                          schoolName: data.schools[String(bill.school)]?.name,
                                          bill,
                                          payment: p,
                                          balanceAfter: balanceAfterPayment(bill, p),
                                        }) || toast.error("Allow pop-ups to print the receipt")
                                      }
                                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                                    >
                                      <Printer className="w-4 h-4" />
                                    </button>
                                  </li>
                                ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
