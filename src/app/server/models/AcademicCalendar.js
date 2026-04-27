import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Holiday name is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Holiday date is required"],
    },
    type: {
      type: String,
      enum: ["public", "school", "religious"],
      default: "public",
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const academicCalendarSchema = new mongoose.Schema(
  {
    session: {
      type: String,
      required: [true, "Academic session is required"],
      trim: true,
      index: true,
      description: "e.g., 2026/2027",
    },
    term: {
      type: String,
      enum: ["first", "second", "third"],
      required: [true, "Term is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Term start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "Term end date is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
      description: "Only one term should be current at a time globally",
    },
    holidays: [holidaySchema],
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

// Ensure only one term is current at a time globally
academicCalendarSchema.pre("save", async function (next) {
  if (this.isCurrent) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isCurrent: false } }
    );
  }
  next();
});

// Compound index for session + term uniqueness
academicCalendarSchema.index({ session: 1, term: 1 }, { unique: true });
academicCalendarSchema.index({ isCurrent: 1 });
academicCalendarSchema.index({ isActive: 1 });

export default mongoose.models.AcademicCalendar ||
  mongoose.model("AcademicCalendar", academicCalendarSchema);

