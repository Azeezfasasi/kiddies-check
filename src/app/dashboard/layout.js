"use client"
import React, { useState, useEffect } from "react"
import DashboardHeader from "@/components/dashboard-component/DashboardHeader"
import DashboardMenu from "@/components/dashboard-component/DashboardMenu"
import { ProtectedRoute } from "@/components/ProtectedRoute"

// This is a client layout so we can manage sidebar collapse state.
export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  function toggleSidebar() {
    setCollapsed(c => !c)
  }

  function toggleMobileMenu() {
    setMobileOpen(v => !v)
  }
  // Add a body-level class while the dashboard is mounted so we can hide
  // the site header that is rendered by the root layout.
  useEffect(() => {
    document.body.classList.add("hide-site-header")
    return () => document.body.classList.remove("hide-site-header")
  }, [])

  return (
    <ProtectedRoute allowedRoles={['admin', 'learning-specialist', 'school-leader', 'teacher', 'parent']}>
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <DashboardHeader onToggleSidebar={toggleSidebar} onToggleMobileMenu={toggleMobileMenu} />

        <div className="flex">
          <DashboardMenu collapsed={collapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
