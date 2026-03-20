"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("token");
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // logout must be stable for callbacks that use it
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("schoolId");
    localStorage.removeItem("userId");
  }, []);

  // Load token from localStorage on mount and fetch profile
  useEffect(() => {
    let canceled = false;

    const doFetchProfile = async () => {
      if (!token) {
        if (!canceled) setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (!canceled && data.success) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        logout();
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    doFetchProfile();

    return () => {
      canceled = true;
    };
  }, [token, logout]);

  const login = async (email, password) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("token", data.token);
        // Save schoolId if available
        if (data.schoolId) {
          localStorage.setItem("schoolId", data.schoolId);
        }
        // Also save userId for API calls
        if (data.user?._id) {
          localStorage.setItem("userId", data.user._id);
        }
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const register = async (firstName, lastName, email, phone, role, password, confirmPassword, school, location, model, numberOfTeachers, numberOfStudents, schoolLogo) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          role,
          password,
          confirmPassword,
          school,
          location,
          model,
          numberOfTeachers: parseInt(numberOfTeachers),
          numberOfStudents: parseInt(numberOfStudents),
          schoolLogo,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("token", data.token);
        // Save schoolId if available
        if (data.schoolId) {
          localStorage.setItem("schoolId", data.schoolId);
        }
        // Also save userId for API calls
        if (data.user?._id) {
          localStorage.setItem("userId", data.user._id);
        }
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // (logout is defined above with useCallback)

  const updateProfile = async (updates) => {
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: updates.firstName,
          lastName: updates.lastName,
          phone: updates.phone,
          company: updates.company,
          department: updates.department,
          position: updates.position,
          avatar: updates.avatar,
          school: updates.school,
          location: updates.location,
          model: updates.model,
          numberOfTeachers: updates.numberOfTeachers ? parseInt(updates.numberOfTeachers) : undefined,
          numberOfStudents: updates.numberOfStudents ? parseInt(updates.numberOfStudents) : undefined,
          schoolLogo: updates.schoolLogo,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!token,
    isAdmin: user?.role === "admin",
    isLearningSpecialist: user?.role === "learning-specialist",
    isSchoolLeader: user?.role === "school-leader",
    isTeacher: user?.role === "teacher",
    isParent: user?.role === "parent",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
