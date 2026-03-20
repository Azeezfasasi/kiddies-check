import mongoose from 'mongoose';

const schoolMemberSchema = new mongoose.Schema(
  {
    // References
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },

    // Role within the school
    role: {
      type: String,
      enum: ['school-leader', 'teacher', 'parent', 'staff'],
      required: [true, 'Role is required'],
    },

    // Status
    status: {
      type: String,
      enum: ['invited', 'active', 'inactive', 'removed'],
      default: 'active',
    },

    // Invitation Details
    invitationToken: {
      type: String,
      select: false,
    },
    invitationExpires: Date,
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    invitedAt: Date,

    // Acceptance
    acceptedAt: Date,
    declinedAt: Date,
    declinedReason: String,

    // Permissions specific to this school
    permissions: [
      {
        type: String,
        enum: [
          'view_students',
          'edit_students',
          'view_reports',
          'manage_members',
          'edit_school_info',
          'view_analytics',
        ],
      },
    ],

    // Metadata
    lastAccessAt: Date,
    notes: String,
  },
  { timestamps: true }
);

// Unique compound index to prevent duplicate memberships
schoolMemberSchema.index({ school: 1, user: 1 }, { unique: true });
schoolMemberSchema.index({ school: 1, status: 1 });
schoolMemberSchema.index({ user: 1, status: 1 });
schoolMemberSchema.index({ invitedBy: 1 });

export default mongoose.models.SchoolMember ||
  mongoose.model('SchoolMember', schoolMemberSchema);
