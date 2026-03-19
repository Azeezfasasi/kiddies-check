'use client';

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import TeamSectionManager from '@/components/dashboard-components/TeamSectionManager'

export default function OurTeamManager() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'learning-specialist']}>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Team Section Manager</h1>
          <p className="text-gray-600 mt-1">Manage your leadership team members</p>
        </div>
        <TeamSectionManager />
      </div>
    </ProtectedRoute>
  )
}
