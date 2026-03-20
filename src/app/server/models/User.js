import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { type } from "os";

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: {
        validator: function (email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: "Invalid email address",
      },
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    company: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },

    // School Onboarding process
    schoolName: { type: String, trim: true }, // Legacy field, use schoolId
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      index: true,
    },
    // Multi-school access for admins and learning-specialists
    managedSchools: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'School',
      default: [],
      index: true,
    },
    location: { type: String, trim: true },
    model: { type: String, trim: true },
    numberOfTeachers: { type: Number },
    numberOfStudents: { type: Number },
    schoolLogo: { type: String, trim: true },

    // Authentication
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: Date,

    // Authorization
    role: {
      type: String,
      enum: ["admin", "learning-specialist", "school-leader", "teacher", "parent"],
      default: "teacher",
    },
    permissions: [
      {
        type: String,
        enum: [
          "create_blog",
          "edit_blog",
          "delete_blog",
          "view_users",
          "manage_users",
          "manage_quotes",
          "manage_contacts",
          "view_reports",
          "admin_panel",
        ],
      },
    ],

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: Date,

    // Account Details
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
    },

    // Registration Approval Workflow
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedAt: Date,
    approvedBy: mongoose.Schema.Types.ObjectId,
    rejectionReason: String,
    
    // OTP for email verification during registration
    registrationOTP: {
      type: String,
      select: false,
    },
    registrationOTPExpires: Date,
    registrationOTPAttempts: {
      type: Number,
      default: 0,
    },
    registrationOTPVerified: {
      type: Boolean,
      default: false,
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
    createdBy: mongoose.Schema.Types.ObjectId,
    updatedBy: mongoose.Schema.Types.ObjectId,
    notes: String,
  },
  { timestamps: true }
);

// Index for frequently queried fields
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ managedSchools: 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if password changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Method to generate password reset token
userSchema.methods.getPasswordResetToken = function () {
  const crypto = require("crypto");
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

// Method to generate email verification token
userSchema.methods.getEmailVerificationToken = function () {
  const crypto = require("crypto");
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

  return verificationToken;
};

// Method to generate registration OTP
userSchema.methods.generateRegistrationOTP = function () {
  const OTP = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  
  this.registrationOTP = require("crypto")
    .createHash("sha256")
    .update(OTP)
    .digest("hex");

  this.registrationOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  this.registrationOTPAttempts = 0;
  this.registrationOTPVerified = false;

  return OTP;
};

// Method to verify registration OTP
userSchema.methods.verifyRegistrationOTP = function (otp) {
  const crypto = require("crypto");
  const hashedOTP = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

  if (this.registrationOTP !== hashedOTP) {
    this.registrationOTPAttempts += 1;
    return false;
  }

  if (this.registrationOTPExpires < Date.now()) {
    return false;
  }

  this.registrationOTPVerified = true;
  this.registrationOTP = undefined;
  this.registrationOTPExpires = undefined;
  this.registrationOTPAttempts = 0;

  return true;
};

// Method to check if account is locked
userSchema.methods.isAccountLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= 5 && !this.isAccountLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }

  return await this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function () {
  return await this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// Method to get user public profile
userSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
  return userObject;
};

// Static method to find by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by role
userSchema.statics.findByRole = function (role) {
  return this.find({ role });
};

// Method to check if user can access a school
userSchema.methods.canAccessSchool = function (schoolId) {
  // Admin and learning-specialist can access schools in managedSchools
  if (['admin', 'learning-specialist'].includes(this.role)) {
    return this.managedSchools.some(id => id.toString() === schoolId.toString());
  }
  // Other users can only access their own school
  return this.schoolId && this.schoolId.toString() === schoolId.toString();
};

// Method to get all accessible schools
userSchema.methods.getAccessibleSchools = async function () {
  if (['admin', 'learning-specialist'].includes(this.role)) {
    return this.managedSchools;
  }
  // Return primary school only
  return this.schoolId ? [this.schoolId] : [];
};

export default mongoose.models.User || mongoose.model("User", userSchema);
