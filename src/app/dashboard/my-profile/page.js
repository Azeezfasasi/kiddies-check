import React from 'react'
import ProfileManagement from './components/ProfileManagement'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ALL_ROLES } from '@/utils/roles';

export default function page() {
  return (
    <ProtectedRoute allowedRoles={ALL_ROLES}>
      <ProfileManagement />
    </ProtectedRoute>
  )
}
