import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import School from "../models/School.js";
import { connectDB } from "../db/connect.js";
import nodemailer from "nodemailer";
import { sendOtpEmail } from "../utils/emailService.js";

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Brevo API endpoint and key
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "info@kiddiescheck.org";
const SENDER_NAME = process.env.BREVO_SENDER_NAME || "Kiddies Check Team";

// Helper function to send emails via Brevo
const sendEmailViaBrevo = async (toEmail, subject, htmlContent) => {
  if (!BREVO_API_KEY) {
    console.error("BREVO_API_KEY not configured");
    throw new Error("Email service not configured");
  }

  const payload = {
    sender: {
      name: SENDER_NAME,
      email: SENDER_EMAIL,
    },
    to: [
      {
        email: toEmail,
      },
    ],
    subject: subject,
    htmlContent: htmlContent,
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Brevo API error:", errorData);
      throw new Error(`Brevo API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending email via Brevo:", error.message);
    throw error;
  }
};

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// 1. REGISTER - Create new user account
export const register = async (req) => {
  try {
    await connectDB();

    const body = await req.json();
    const { firstName, lastName, email, phone, role, password, confirmPassword, school, location, model, numberOfTeachers, numberOfStudents, schoolLogo } = body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !role || !password || !school || !location || !model || !numberOfTeachers || !numberOfStudents || !schoolLogo) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 409 }
      );
    }

    // Create or find School
    let schoolRecord = await School.findOne({ name: school });
    if (!schoolRecord) {
      schoolRecord = new School({
        name: school,
        email: email, // Use school email, can be updated later
        location: location,
        model: model,
        numberOfTeachers: parseInt(numberOfTeachers) || 0,
        numberOfStudents: parseInt(numberOfStudents) || 0,
        logo: schoolLogo,
        approvalStatus: 'pending',
        isActive: true,
      });
      await schoolRecord.save();
    } else {
      // Update existing school with new info if provided
      schoolRecord.numberOfTeachers = parseInt(numberOfTeachers) || schoolRecord.numberOfTeachers;
      schoolRecord.numberOfStudents = parseInt(numberOfStudents) || schoolRecord.numberOfStudents;
      if (schoolLogo) schoolRecord.logo = schoolLogo;
      await schoolRecord.save();
    }

    // Create user
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      role,
      password,
      schoolId: schoolRecord._id,  // Reference to School model
      schoolName: school,  // Keep for backward compatibility
      location: location,
      model: model,
      numberOfTeachers: parseInt(numberOfTeachers),
      numberOfStudents: parseInt(numberOfStudents),
      schoolLogo: schoolLogo,
      isEmailVerified: false,
    });

    await user.save();

    // Set as school principal if role is school-leader
    if (role === 'school-leader') {
      schoolRecord.principal = user._id;
      await schoolRecord.save();
    }

    // Generate and save OTP
    const otp = user.generateRegistrationOTP();
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    try {
      await sendOtpEmail(email, firstName, otp, school);
    } catch (emailError) {
      console.error("Error sending OTP email:", emailError.message);
      // Continue with registration even if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful. OTP has been sent to your email. Please verify it to continue.",
        email,
        schoolId: schoolRecord._id,
        requiresOtpVerification: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Registration failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
};

// 2. LOGIN - Authenticate user
export const login = async (req) => {
  try {
    await connectDB();

    const body = await req.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user and include password
    const user = await User.findByEmail(email).select("+password").populate("schoolId");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      return NextResponse.json(
        {
          success: false,
          message: "Account locked. Try again later.",
        },
        { status: 423 }
      );
    }

    // Check if account is active
    if (!user.isActive || user.accountStatus !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Account is disabled or suspended",
        },
        { status: 403 }
      );
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      await user.incLoginAttempts();
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false }); // avoid full validation on partial login update (phone may be empty for legacy users)

    // Generate token
    const token = generateToken(user._id);

    // Return user info with approval status
    const userProfile = user.getPublicProfile();

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        token,
        user: {
          ...userProfile,
          schoolId: user.schoolId?._id || user.schoolId,
          schoolName: user.schoolId?.name,
        },
        schoolId: user.schoolId?._id || user.schoolId,
        approvalStatus: user.approvalStatus,
        canAccessDashboard: user.approvalStatus === 'approved',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Login failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
};

// ADMIN: CREATE USER WITH ROLE ASSIGNMENT
export const createUserByAdmin = async (req) => {
  try {
    await connectDB();

    // Only allow admins/super-admins
    if (!req.user || !["admin", "super-admin"].includes(req.user.role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Admins only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { firstName, lastName, email, password, confirmPassword, role } = body;

    // Validation
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }
    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "Passwords do not match" },
        { status: 400 }
      );
    }
    if (!["admin", 'learning-specialist', 'school-leader', 'teacher', 'parent' ].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid role" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 409 }
      );
    }

    // Create user with role
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      isEmailVerified: true, // Admin-created users are auto-verified
      createdBy: req.user.id,
    });
    await user.save();

    // Generate token for user (optional, not returned to admin)
    // const token = generateToken(user._id);

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        user: user.getPublicProfile(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin create user error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create user",
        error: error.message,
      },
      { status: 500 }
    );
  }
};

// 3. VERIFY EMAIL - Confirm email address
export const verifyEmail = async (req) => {
  try {
    await connectDB();

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Verification token is required" },
        { status: 400 }
      );
    }

    // Hash the token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Email verification failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
};

// 4. FORGOT PASSWORD - Send password reset email
export const forgotPassword = async (req) => {
  try {
    await connectDB();

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const user = await User.findByEmail(email);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Generate reset token
    const resetToken = user.getPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send reset email via Brevo
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 15px; font-weight: bold; }
            .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
            .warning { background: #fef3c7; padding: 10px 15px; border-radius: 5px; margin-top: 15px; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Reset Your Password</h2>
            </div>
            <div class="content">
              <p>Hello ${user.firstName},</p>
              <p>We received a request to reset your password for your Kiddies Check account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetLink}" class="button">Reset Password</a>
              <div class="warning">
                <strong>This link expires in 1 hour</strong><br>
                If you didn't request this password reset, please ignore this email or contact support immediately.
              </div>
              <p>Or copy and paste this link in your browser:<br><small>${resetLink}</small></p>
              <hr>
              <p><small>Best regards,<br>Kiddies Check Team</small></p>
            </div>
            <div class="footer">
              <p>© 2026 Kiddies Check. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await sendEmailViaBrevo(email, "Password Reset - Kiddies Check", htmlContent);
      console.log(`Password reset email sent to ${email}`);
    } catch (mailError) {
      console.error("Failed to send password reset email:", mailError.message);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send reset email. Please try again later.",
          error: mailError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Password reset email sent. Check your inbox.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process password reset request",
        error: error.message,
      },
      { status: 500 }
    );
  }
};

// 5. RESET PASSWORD - Update password with reset token
export const resetPassword = async (req) => {
  try {
    await connectDB();

    const body = await req.json();
    const { token, password, confirmPassword } = body;

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Hash the token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Generate new token
    const newToken = generateToken(user._id);

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successful",
        token: newToken,
        user: user.getPublicProfile(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Password reset failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
};

// 6. UPDATE PASSWORD - Change password (authenticated user)
export const updatePassword = async (req) => {
  try {
    await connectDB();

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;
    const userId = req.user?.id;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "New passwords do not match" },
        { status: 400 }
      );
    }

    // Find user with password
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordMatch = await user.matchPassword(currentPassword);

    if (!isPasswordMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password is incorrect",
        },
        { status: 401 }
      );
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Password updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update password error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update password",
        error: error.message,
      },
      { status: 500 }
    );
  }
};

// 7. GET USER PROFILE - Fetch authenticated user data
export const getUserProfile = async (req) => {
  try {
    await connectDB();

    const userId = req.user?.id;

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: user.getPublicProfile(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch profile",
        error: error.message,
      },
      { status: 500 }
    );
  }
};

// 8. UPDATE USER PROFILE - Update own user details
export const updateUserProfile = async (req) => {
  try {
    await connectDB();

    const userId = req.user?.id;
    const body = await req.json();
    const { firstName, lastName, phone, company, department, position, avatar } =
      body;

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (company) user.company = company;
    if (department) user.department = department;
    if (position) user.position = position;
    if (avatar) user.avatar = avatar;

    user.updatedAt = Date.now();
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        user: user.getPublicProfile(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update profile",
        error: error.message,
      },
      { status: 500 }
    );
  }
};

// 9. ADMIN: GET ALL USERS - List all users
export const getAllUsers = async (req) => {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const isActive = searchParams.get("isActive");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;

    let filter = { accountStatus: { $ne: "deleted" } }; // Exclude deleted users
    if (role) filter.role = role;
    if (isActive !== null) filter.isActive = isActive === "true";

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    return NextResponse.json(
      {
        success: true,
        total,
        page,
        pages: Math.ceil(total / limit),
        users: users.map((u) => u.getPublicProfile()),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get all users error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch users",
        error: error.message,
      },
      { status: 500 }
    );
  }
};

// 10. ADMIN: GET USER BY ID - Get specific user details
export const getUserById = async (req, userId) => {
  try {
    await connectDB();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: user.getPublicProfile(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch user",
        error: error.message,
      },
      { status: 500 }
    );
  }
};

// 11. ADMIN: UPDATE USER BY ID - Admin edit user details
export const updateUserById = async (req, userId) => {
  try {
    await connectDB();

    const adminId = req.user?.id;
    const body = await req.json();
    const updates = { ...body };

    // Prevent updating sensitive fields through this endpoint
    delete updates.password;
    delete updates.email;

    let user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    user.updatedBy = adminId;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "User updated successfully",
        user: user.getPublicProfile(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update user",
        error: error.message,
      },
      { status: 500 }
    );
  }
};

// 12. ADMIN: CHANGE USER ROLE - Update user role and permissions
export const changeUserRole = async (req, userId) => {
  try {
    await connectDB();

    const adminId = req.user?.id;
    const body = await req.json();
    const { role, permissions } = body;

    if (!role || !["admin", "learning-specialist", "school-leader", "teacher", "parent"].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid role. Must be one of: admin, learning-specialist, school-leader, teacher, parent" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    user.role = role;
    if (permissions && Array.isArray(permissions)) {
      user.permissions = permissions;
    }
    user.updatedBy = adminId;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "User role updated successfully",
        user: user.getPublicProfile(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Change role error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to change role",
        error: error.message,
      },
      { status: 500 }
    );
  }
};

// 13. ADMIN: DISABLE/ENABLE USER - Toggle user active status
export const toggleUserStatus = async (req, userId) => {
  try {
    await connectDB();

    const adminId = req.user?.id;
    let isActive;

    // Try to parse body for explicit isActive, otherwise toggle
    try {
      const body = await req.json();
      isActive = body.isActive;
    } catch {
      isActive = undefined;
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // If isActive is provided and is boolean, use it; otherwise toggle
    if (typeof isActive === "boolean") {
      user.isActive = isActive;
    } else {
      user.isActive = !user.isActive;
    }

    user.accountStatus = user.isActive ? "active" : "suspended";
    user.updatedBy = adminId;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: `User ${user.isActive ? "enabled" : "disabled"} successfully`,
        user: user.getPublicProfile(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Toggle status error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to toggle user status",
        error: error.message,
      },
      { status: 500 }
    );
  }
};

// 14. ADMIN: RESET USER PASSWORD - Admin reset password for user
export const adminResetPassword = async (req, userId) => {
  try {
    await connectDB();

    const adminId = req.user?.id;
    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters",
        },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    user.password = newPassword;
    user.updatedBy = adminId;
    user.notes = user.notes ? user.notes + "\n" : "";
    user.notes += `Password reset by admin on ${new Date().toISOString()}`;
    await user.save();

    // Send notification email
    try {
      await transporter.sendMail({
        to: user.email,
        subject: "Your Password Has Been Reset",
        html: `<h2>Password Reset by Administrator</h2>
               <p>Your password has been reset to: <strong>${newPassword}</strong></p>
               <p>Please change this password immediately after logging in.</p>`,
      });
    } catch (mailError) {
      console.log("Email notification failed:", mailError.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: "User password reset successfully",
        temporaryPassword: newPassword,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin reset password error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to reset password",
        error: error.message,
      },
      { status: 500 }
    );
  }
};

// 15. DELETE USER - Admin delete user account
export const deleteUser = async (req, userId) => {
  try {
    await connectDB();

    const adminId = req.user?.id;

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Soft delete - mark as deleted
    user.accountStatus = "deleted";
    user.isActive = false;
    user.updatedBy = adminId;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "User deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete user",
        error: error.message,
      },
      { status: 500 }
    );
  }
};

// 16. LOGOUT - Clear session/logout
export const logout = async (req) => {
  try {
    return NextResponse.json(
      {
        success: true,
        message: "Logout successful",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Logout failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
};
