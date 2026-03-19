/**
 * Hook to check if user is approved for dashboard access
 */

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useDashboardAccess() {
  const { user } = useAuth();
  const router = useRouter();
  const [isApproved, setIsApproved] = useState(null);

  useEffect(() => {
    if (!user) {
      // Not authenticated - will be handled by auth context
      return;
    }

    // Check approval status
    if (user.approvalStatus === 'approved') {
      setIsApproved(true);
    } else {
      // User is not approved, redirect based on status
      if (user.approvalStatus === 'pending') {
        router.push('/dashboard/pending-approval');
      } else if (user.approvalStatus === 'rejected') {
        router.push('/dashboard/registration-rejected');
      }
      setIsApproved(false);
    }
  }, [user, router]);

  return isApproved;
}

export default useDashboardAccess;
