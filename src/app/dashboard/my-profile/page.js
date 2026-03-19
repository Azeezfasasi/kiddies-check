import React from 'react'
import ProfileManagement from './components/ProfileManagement'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function page() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'learning-specialist', 'school-leader', 'teacher', 'parent']}>
      <ProfileManagement />
    </ProtectedRoute>
  )
}
