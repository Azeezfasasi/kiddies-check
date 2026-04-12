import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema(
  {
    // School Info
    name: {
      type: String,
      required: [true, 'School name is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'School email is required'],
      unique: true,
      lowercase: true,
      validate: {
        validator: function (email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Invalid email address',
      },
    },
    phone: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    model: {
      type: String,
      trim: true,
      description: 'School model/type (e.g., public, private, hybrid)',
    },
    schoolType: {
      type: String,
      enum: ['my-childs-school', 'home-school'],
      description: 'Type of school (My Child\'s School or Home School)',
    },
    logo: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // School Metrics
    numberOfTeachers: {
      type: Number,
      default: 0,
    },
    numberOfStudents: {
      type: Number,
      default: 0,
    },

    // Leadership
    principal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      description: 'Reference to the school principal/leader',
    },

    // Admin Approval
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: String,

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
schoolSchema.index({ principal: 1 });
schoolSchema.index({ approvalStatus: 1, isActive: 1 });
schoolSchema.index({ createdAt: -1 });

export default mongoose.models.School || mongoose.model('School', schoolSchema);
