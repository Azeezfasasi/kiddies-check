"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Copy, Info, Layers, Loader, Pencil, School, Settings2, Trash2, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmActionModal from "@/app/components/ConfirmActionModal";
import useBillingScope from "../components/useBillingScope";
import BillingShell, { EmptyState, StatCard } from "../components/BillingShell";
import FeeStructureModal from "../components/FeeStructureModal";
import ModalFrame, { inputClass, labelClass, primaryButton, secondaryButton } from "../components/ModalFrame";
import { TERM_LABELS, TERMS, billingRequest, canManageFees, formatCurrency, formatDate } from "../components/billingUtils";

export default function FeeSetupPage() {
  const scope = useBillingScope();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [editClassIds, setEditClassIds] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const [showCarry, setShowCarry] = useState(false);
  const [carrying, setCarrying] = useState(false);
  const [serverCanManage, setServerCanManage] = useState(null);

  const { token, schoolId, academicSession, term, ready } = scope;
  const isFeeManager = serverCanManage ?? canManageFees(scope.role);

  const load = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    try {
      const res = await billingRequest(
        token,
        `/api/billing/fee-structures?schoolId=${schoolId}&academicSession=${encodeURIComponent(academicSession)}&term=${term}`
      );
      setRows(res.classes || []);
      setServerCanManage(res.canManageFees);
    } catch (error) {
      toast.error(error.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [ready, token, schoolId, academicSession, term]);

  useEffect(() => {
    load();
    setSelected(new Set());
  }, [load]);

  const totals = useMemo(() => {
    const withFees = rows.filter((r) => r.structure);
    return {
      configured: withFees.length,
      expected: withFees.reduce((sum, r) => sum + r.structure.totalAmount * r.studentCount, 0),
      collected: withFees.reduce((sum, r) => sum + r.collected, 0),
      students: withFees.reduce((sum, r) => sum + r.studentCount, 0),
    };
  }, [rows]);

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const carryForward = async () => {
    setCarrying(true);
    try {
      const res = await billingRequest(token, "/api/billing/carry-forward", {
        method: "POST",
        body: JSON.stringify({ schoolId, academicSession, term }),
      });
      toast.success(res.message, { duration: 6000 });
      setShowCarry(false);
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCarrying(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await billingRequest(token, `/api/billing/fee-structures/${deleteRow.structure._id}`, { method: "DELETE" });
      toast.success(res.message);
      setDeleteRow(null);
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <BillingShell
      scope={scope}
      title="Fee Setup"
      description="Set the school fees for each class. All students in a class are billed automatically."
      actions={
        isFeeManager && (
          <>
            <button className={secondaryButton} onClick={() => setShowCopy(true)} disabled={!ready}>
              <Copy className="w-4 h-4" /> Copy From Another Term
            </button>
            <button className={secondaryButton} onClick={() => setShowCarry(true)} disabled={!ready || totals.configured === 0}>
              <ArrowRightLeft className="w-4 h-4" /> Bring Forward Balances
            </button>
            <button
              className={primaryButton}
              onClick={() => setEditClassIds(selected.size ? [...selected] : rows.filter((r) => !r.structure).map((r) => r.class._id))}
              disabled={!ready || rows.length === 0}
            >
              <Settings2 className="w-4 h-4" /> {selected.size ? `Set Fees for ${selected.size} Selected` : "Set Fees"}
            </button>
          </>
        )
      }
    >
      {!isFeeManager && (
        <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-800">
          <Info className="w-5 h-5 shrink-0" />
          Class fees can only be changed by an admin, school leader or school director. You have view-only access to them here.
        </div>
      )}

      {loading && rows.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={School} inline title="No classes found" message="Create classes for this school before setting fees." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
            <StatCard label="Classes with fees" value={`${totals.configured} / ${rows.length}`} sub={`${totals.students} students billed`} icon={Layers} tone="blue" />
            <StatCard label="Expected this term" value={formatCurrency(totals.expected)} sub="Before discounts and waivers" icon={TrendingUp} tone="green" />
            <StatCard label="Collected so far" value={formatCurrency(totals.collected)} icon={TrendingUp} tone="amber" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b text-left text-xs uppercase text-gray-500">
                  <tr>
                    {isFeeManager && (
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={selected.size === rows.length}
                          onChange={() => setSelected(selected.size === rows.length ? new Set() : new Set(rows.map((r) => r.class._id)))}
                          className="w-4 h-4 rounded border-gray-300"
                          aria-label="Select all classes"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Fee items</th>
                    <th className="px-4 py-3 text-right">Per student</th>
                    <th className="px-4 py-3 text-right">Students</th>
                    <th className="px-4 py-3 text-right">Expected</th>
                    <th className="px-4 py-3">Due date</th>
                    {isFeeManager && <th className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr key={r.class._id} className={`hover:bg-gray-50 ${selected.has(r.class._id) ? "bg-blue-50/60" : ""}`}>
                      {isFeeManager && (
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.has(r.class._id)} onChange={() => toggle(r.class._id)} className="w-4 h-4 rounded border-gray-300" />
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{r.class.name}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {r.structure ? (
                          <div className="flex flex-wrap gap-1 max-w-sm">
                            {r.structure.items.map((i) => (
                              <span key={i.name} className="text-xs bg-gray-100 rounded px-1.5 py-0.5" title={formatCurrency(i.amount)}>
                                {i.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-amber-600">Not set</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">{r.structure ? formatCurrency(r.structure.totalAmount) : "—"}</td>
                      <td className="px-4 py-3 text-right">{r.studentCount}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {r.structure ? formatCurrency(r.structure.totalAmount * r.studentCount) : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{r.structure ? formatDate(r.structure.dueDate) : "—"}</td>
                      {isFeeManager && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              title={r.structure ? "Edit fees" : "Set fees"}
                              onClick={() => setEditClassIds([r.class._id])}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {r.structure && (
                              <button title="Remove fees" onClick={() => setDeleteRow(r)} className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {editClassIds && (
        <FeeStructureModal
          token={token}
          schoolId={schoolId}
          academicSession={academicSession}
          term={term}
          rows={rows}
          initialClassIds={editClassIds}
          onClose={() => setEditClassIds(null)}
          onSaved={() => {
            setEditClassIds(null);
            setSelected(new Set());
            load();
          }}
        />
      )}

      {deleteRow && (
        <ConfirmActionModal
          title={`Remove fees for ${deleteRow.class.name}?`}
          message={`This deletes the ${TERM_LABELS[term]} fees for ${deleteRow.class.name} and their unpaid bills. It is blocked if any payment has been recorded — edit the fees instead in that case.`}
          confirmText="Remove Fees"
          isDestructive
          isLoading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteRow(null)}
        />
      )}

      {showCarry && (
        <ConfirmActionModal
          title="Bring forward unpaid balances?"
          message={`Any unpaid balance a student has from an earlier term is added to their ${TERM_LABELS[term]} ${academicSession} bill as "Balance brought forward", and the earlier bill is marked Carried Forward. New bills do this automatically — use this for bills that were created before the earlier balance existed.`}
          confirmText="Bring Forward"
          isLoading={carrying}
          onConfirm={carryForward}
          onCancel={() => setShowCarry(false)}
        />
      )}

      {showCopy && (
        <CopyTermModal
          scope={scope}
          onClose={() => setShowCopy(false)}
          onDone={() => {
            setShowCopy(false);
            load();
          }}
        />
      )}
    </BillingShell>
  );
}

function CopyTermModal({ scope, onClose, onDone }) {
  const options = scope.calendarTerms
    .filter((t) => !(t.session === scope.academicSession && t.term === scope.term))
    .sort((a, b) => b.session.localeCompare(a.session) || TERMS.indexOf(b.term) - TERMS.indexOf(a.term));

  const [source, setSource] = useState(options[0] ? `${options[0].session}|${options[0].term}` : "");
  const [overwrite, setOverwrite] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const [fromSession, fromTerm] = source.split("|");
    setSaving(true);
    try {
      const res = await billingRequest(scope.token, "/api/billing/fee-structures", {
        method: "POST",
        body: JSON.stringify({
          action: "copy",
          schoolId: scope.schoolId,
          academicSession: scope.academicSession,
          term: scope.term,
          fromSession,
          fromTerm,
          overwrite,
        }),
      });
      toast.success(res.message);
      onDone();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalFrame
      title="Copy Fees From Another Term"
      subtitle={`Into ${TERM_LABELS[scope.term]} ${scope.academicSession}`}
      onClose={onClose}
      footer={
        <>
          <button className={secondaryButton} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className={primaryButton} onClick={submit} disabled={saving || !source}>
            {saving && <Loader className="w-4 h-4 animate-spin" />}
            Copy Fees
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Copy from</label>
          <select value={source} onChange={(e) => setSource(e.target.value)} className={inputClass}>
            {options.length === 0 && <option value="">No other terms available</option>}
            {options.map((t) => (
              <option key={`${t.session}|${t.term}`} value={`${t.session}|${t.term}`}>
                {TERM_LABELS[t.term]} {t.session}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-gray-300" />
          <span>
            Overwrite classes that already have fees for this term
            <span className="block text-xs text-gray-500">When unchecked, only classes without fees are filled in.</span>
          </span>
        </label>
        <p className="text-xs text-gray-500">Due dates are not copied — set them afterwards for the new term.</p>
      </div>
    </ModalFrame>
  );
}
