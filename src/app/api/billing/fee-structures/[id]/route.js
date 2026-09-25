/**
 * /api/billing/fee-structures/[id]
 */

import FeeStructure from "@/app/server/models/FeeStructure";
import StudentBill from "@/app/server/models/StudentBill";
import { checkSchoolAccess, isValidId, jsonError, verifyBillingUser } from "@/app/server/lib/billing";

/**
 * DELETE /api/billing/fee-structures/[id]
 * Removes a class's fees and the bills generated from them. Refused once any
 * payment has been recorded against those bills, so no payment is ever lost.
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!isValidId(id)) return jsonError("Invalid fee structure id", 400);

    const auth = await verifyBillingUser(request);
    if (auth.error) return jsonError(auth.error, auth.status);

    const structure = await FeeStructure.findById(id);
    if (!structure) return jsonError("Fee structure not found", 404);

    const denied = await checkSchoolAccess(auth.user, structure.school, { requireFeeManager: true });
    if (denied) return jsonError(denied.error, denied.status);

    const billsWithPayments = await StudentBill.countDocuments({
      feeStructure: structure._id,
      payments: { $elemMatch: { voided: { $ne: true } } },
    });
    if (billsWithPayments > 0) {
      return jsonError(
        `${billsWithPayments} student(s) in this class already have payments recorded. Edit the fees instead, or void those payments first.`,
        409
      );
    }

    const { deletedCount } = await StudentBill.deleteMany({ feeStructure: structure._id });
    await structure.deleteOne();

    return Response.json({
      success: true,
      message: `Class fees removed and ${deletedCount} unpaid bill(s) deleted.`,
    });
  } catch (error) {
    console.error("Error deleting fee structure:", error);
    return jsonError("Failed to delete fee structure", 500);
  }
}
