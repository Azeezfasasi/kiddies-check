import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";
import { defineModel } from "./defineModel";

// A class's school fees for one term. Every active student in the class
// gets a StudentBill generated from this structure.
const feeItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Fee item name is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Fee item amount is required"],
      min: [0, "Fee item amount cannot be negative"],
    },
  },
  { _id: false }
);

const feeStructureSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    academicSession: {
      type: String,
      required: [true, "Academic session is required"],
      trim: true,
    },
    term: {
      type: String,
      enum: ["first", "second", "third"],
      required: [true, "Term is required"],
    },
    items: {
      type: [feeItemSchema],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "At least one fee item is required",
      },
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    dueDate: Date,
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

feeStructureSchema.pre("save", function (next) {
  let total = 0;
  for (const item of this.items || []) total += Number(item.amount) || 0;
  this.totalAmount = Math.round(total * 100) / 100;
  next();
});

feeStructureSchema.index(
  { school: 1, class: 1, academicSession: 1, term: 1 },
  { unique: true }
);
feeStructureSchema.index({ school: 1, academicSession: 1, term: 1 });

/** Plain field shape of a FeeStructure (as returned by `.lean()`). */
export type FeeStructureFields = InferSchemaType<typeof feeStructureSchema>;
/** A loaded FeeStructure document (as returned by `findById` etc.). */
export type FeeStructureDocument = HydratedDocument<FeeStructureFields>;

export default defineModel("FeeStructure", feeStructureSchema);
