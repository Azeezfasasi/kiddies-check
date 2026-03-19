'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * ProtectedRoute Component
 * 
 * Usage:
 * <ProtectedRoute allowedRoles={['admin', 'learning-specialist', 'school-leader', 'teacher', 'parent']}>
 *   <YourComponent />
 * </ProtectedRoute>
 * 
 * allowedRoles: array of roles that can access this route
 * - 'admin' - admin access
 * - 'learning-specialist' - learning specialist access
 * - 'school-leader' - school leader access
 * - 'teacher' - teacher access
 * - 'parent' - parent access
 * 
 * If no allowedRoles provided, any authenticated user can access
 */
export function ProtectedRoute({ children, allowedRoles = null }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to load
    if (loading) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // If roles are specified, check if user has permission
    if (allowedRoles && Array.isArray(allowedRoles)) {
      if (!allowedRoles.includes(user?.role)) {
        // User doesn't have permission - redirect to home or unauthorized page
        router.push('/');
        return;
      }
    }
  }, [isAuthenticated, user?.role, loading, allowedRoles, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated or no permission
  if (!isAuthenticated || (allowedRoles && !allowedRoles.includes(user?.role))) {
    return null;
  }

  return children;
}
