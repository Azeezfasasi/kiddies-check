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
        // Save user role
        if (data.user?.role) {
          localStorage.setItem("userRole", data.user.role);
        }
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const register = async (firstName, lastName, email, phone, role, password, confirmPassword, school, location, model, numberOfTeachers, numberOfStudents, schoolLogo, teacherClass, numberOfLearners, subjects, children, schoolType, schoolId) => {
    try {
      // Build registration object dynamically
      const registrationData = {
        firstName,
        lastName,
        email,
        phone,
        role,
        password,
        confirmPassword,
      };

      // Only include school fields if they're provided (for school-leader role)
      if (school) {
        registrationData.school = school;
      }
      if (location) {
        registrationData.location = location;
      }
      if (model) {
        registrationData.model = model;
      }
      if (numberOfTeachers) {
        registrationData.numberOfTeachers = parseInt(numberOfTeachers);
      }
      if (numberOfStudents) {
        registrationData.numberOfStudents = parseInt(numberOfStudents);
      }
      if (schoolLogo) {
        registrationData.schoolLogo = schoolLogo;
      }
      if (schoolType) {
        registrationData.schoolType = schoolType;
      }
      if (schoolId) {
        registrationData.schoolId = schoolId;
      }
      if (children && children.length > 0) {
        registrationData.children = children;
      }

      console.log('========== AuthContext.register() ==========');
      console.log('Registration Data (to be sent):', registrationData);
      console.log('Children included:', children ? `✅ ${children.length} children` : '❌ No children');

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });
      const data = await response.json();
      
      console.log('Register API Response:', data);

      if (data.success) {
        // Store children data temporarily for prospective students creation
        if (children && children.length > 0) {
          localStorage.setItem("pendingChildren", JSON.stringify(children));
          console.log('✅ Stored pendingChildren in localStorage:', JSON.stringify(children));
        } else {
          console.log('⚠️ No children to store in localStorage');
        }
        
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("token", data.token);
        // Save schoolId if available
        if (data.schoolId) {
          localStorage.setItem("schoolId", data.schoolId);
          console.log('✅ Stored schoolId:', data.schoolId);
        }
        // Also save userId for API calls
        if (data.user?._id) {
          localStorage.setItem("userId", data.user._id);
          console.log('✅ Stored userId:', data.user._id);
        }
        // Save user role
        if (data.user?.role) {
          localStorage.setItem("userRole", data.user.role);
          console.log('✅ Stored userRole:', data.user.role);
        }
        return { success: true };
      }
      console.log('❌ Registration failed:', data.message);
      return { success: false, message: data.message };
    } catch (error) {
      console.error('❌ Registration error:', error);
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
