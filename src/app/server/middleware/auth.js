import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { connectDB } from "../db/connect.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
export const authenticate = async (req, callback) => {
  try {
    const token =
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      req.cookies?.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token provided" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    await connectDB();

    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Account is disabled",
        },
        { status: 403 }
      );
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return NextResponse.json(
        {
          success: false,
          message: "Password recently changed. Please login again.",
        },
        { status: 401 }
      );
    }

    req.user = { id: user._id, role: user.role, permissions: user.permissions };
    return callback();
  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json(
      { success: false, message: "Invalid token" },
      { status: 401 }
    );
  }
};

// Middleware to check if user has specific role
export const authorize = (...roles) => {
  return async (req, callback) => {
    if (!req.user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!roles.includes(req.user.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Insufficient permissions",
        },
        { status: 403 }
      );
    }

    return callback();
  };
};

// Middleware to check specific permission
export const checkPermission = (...permissions) => {
  return async (req, callback) => {
    if (!req.user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const userPermissions = req.user.permissions || [];

    if (!permissions.some((p) => userPermissions.includes(p))) {
      return NextResponse.json(
        {
          success: false,
          message: "Permission denied",
        },
        { status: 403 }
      );
    }

    return callback();
  };
};

// Middleware for admin only
export const isAdmin = async (req, callback) => {
  if (!req.user || req.user.role !== "admin") {
    return NextResponse.json(
      {
        success: false,
        message: "Admin access only",
      },
      { status: 403 }
    );
  }

  return callback();
};

// Middleware for manager and admin
export const isManagerOrAdmin = async (req, callback) => {
  if (!req.user || !["manager", "admin"].includes(req.user.role)) {
    return NextResponse.json(
      {
        success: false,
        message: "Manager or Admin access only",
      },
      { status: 403 }
    );
  }

  return callback();
};
