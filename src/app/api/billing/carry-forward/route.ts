import type { NextRequest } from "next/server";
/**
 * /api/billing/carry-forward
 * Bring unpaid balances from earlier terms into existing bills. New bills
 * pick up arrears automatically; this is for bills generated before the
 * earlier balance existed (or before carry-forward was introduced).
 */

import StudentBill from "@/app/server/models/StudentBill";
import { TERMS, authorizeSchool, carryBalancesInto, jsonError } from "@/app/server/lib/billing";

/**
 * POST /api/billing/carry-forward
 * { schoolId, academicSession, term } — admin / school leader
 */
export async function POST(request: NextRequest) {
  try {
    const { schoolId, academicSession, term } = await request.json();
    const auth = await authorizeSchool(request, schoolId, { requireFeeManager: true });
    if (auth.error) return jsonError(auth.error, auth.status);

    if (!academicSession || !(TERMS as readonly string[]).includes(term)) {
      return jsonError("academicSession and a valid term are required", 400);
    }

    const bills = await StudentBill.find({ school: schoolId, academicSession, term, waived: { $ne: true } });
    const { carried, amount } = await carryBalancesInto(bills, auth.user._id);

    return Response.json({
      success: true,
      message:
        carried > 0
          ? `Brought forward ${amount} in unpaid balances for ${carried} student(s).`
          : "No unpaid balances from earlier terms to bring forward.",
      carried,
      amount,
    });
  } catch (error) {
    console.error("Error carrying balances forward:", error);
    return jsonError("Failed to carry balances forward", 500);
  }
}
