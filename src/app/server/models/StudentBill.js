import mongoose from "mongoose";

// One student's school-fee bill for one term. Payments are recorded
// manually (no payment gateway) and kept as an append-only ledger:
// corrections are made by voiding a payment, never by deleting it.
const billItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Payment amount must be greater than zero"],
    },
    method: {
      type: String,
      enum: ["cash", "bank-transfer", "pos", "cheque", "online", "other"],
      default: "cash",
    },
    reference: { type: String, trim: true },
    receiptNo: { type: String, required: true },
    paidAt: { type: Date, default: Date.now },
    note: { type: String, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recordedAt: { type: Date, default: Date.now },
    voided: { type: Boolean, default: false },
    voidReason: { type: String, trim: true },
    voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    voidedAt: Date,
  },
  { _id: true }
);

// Audit trail for changes that aren't payments (discounts, waivers, fee
// changes), so there is a record of who changed a bill and why.
const activitySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    description: { type: String, trim: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const studentBillSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    // The class the student was billed under — kept even if the student
    // later moves class, so historical bills stay accurate.
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    feeStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeStructure",
      index: true,
    },
    academicSession: { type: String, required: true, trim: true },
    term: {
      type: String,
      enum: ["first", "second", "third"],
      required: true,
    },
    items: [billItemSchema],
    grossAmount: { type: Number, default: 0 },
    discount: {
      amount: { type: Number, default: 0, min: 0 },
      reason: { type: String, trim: true },
    },
    netAmount: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["unpaid", "partial", "paid", "overpaid", "waived"],
      default: "unpaid",
      index: true,
    },
    waived: { type: Boolean, default: false },
    waiverReason: { type: String, trim: true },
    dueDate: Date,
    notes: { type: String, trim: true },
    payments: [paymentSchema],
    activity: [activitySchema],
    lastPaymentAt: Date,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Derives every money field from items/discount/payments so totals can't
// drift from the ledger. Exported so insertMany (which skips save hooks)
// can compute the same values up front.
export const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

export function computeBillTotals(bill) {
  const grossAmount = roundMoney((bill.items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
  const discountAmount = Math.min(roundMoney(bill.discount?.amount), grossAmount);
  const netAmount = roundMoney(grossAmount - discountAmount);
  const activePayments = (bill.payments || []).filter((p) => !p.voided);
  const amountPaid = roundMoney(activePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0));
  const balance = bill.waived ? 0 : roundMoney(netAmount - amountPaid);

  let status;
  if (bill.waived) status = "waived";
  else if (balance < 0) status = "overpaid";
  else if (balance === 0) status = "paid";
  else if (amountPaid > 0) status = "partial";
  else status = "unpaid";

  const lastPaymentAt = activePayments.reduce(
    (latest, p) => (!latest || new Date(p.paidAt) > latest ? new Date(p.paidAt) : latest),
    null
  );

  return { grossAmount, netAmount, amountPaid, balance, status, lastPaymentAt };
}

studentBillSchema.pre("save", function (next) {
  const totals = computeBillTotals(this);
  this.grossAmount = totals.grossAmount;
  this.netAmount = totals.netAmount;
  this.amountPaid = totals.amountPaid;
  this.balance = totals.balance;
  this.status = totals.status;
  this.lastPaymentAt = totals.lastPaymentAt || undefined;
  if (this.discount && this.discount.amount > totals.grossAmount) {
    this.discount.amount = totals.grossAmount;
  }
  next();
});

studentBillSchema.index({ student: 1, academicSession: 1, term: 1 }, { unique: true });
studentBillSchema.index({ school: 1, academicSession: 1, term: 1, class: 1 });
studentBillSchema.index({ "payments.receiptNo": 1 });

export default mongoose.models.StudentBill ||
  mongoose.model("StudentBill", studentBillSchema);
