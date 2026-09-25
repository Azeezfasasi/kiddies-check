'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function PendingApprovalDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if approved
    if (user?.approvalStatus === 'approved') {
      router.push('/dashboard');
    }
    // Redirect if rejected
    if (user?.approvalStatus === 'rejected') {
      router.push('/dashboard/registration-rejected');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-8 pt-12 pb-8 text-white text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Registration Pending</h1>
            <p className="text-yellow-100">Your application is under review</p>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {/* Main Message */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-6">
              <p className="text-yellow-900 font-medium mb-2">Your application is pending admin approval</p>
              <p className="text-sm text-yellow-800">
                Thank you for registering with KiddiesCheck! Our administration team is reviewing your application. This typically takes 24-48 hours.
              </p>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Your Email</p>
                  <p className="text-gray-900 font-medium">{user?.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">School Name</p>
                  <p className="text-gray-900 font-medium">{user?.school || 'Not specified'}</p>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Status</p>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-gray-900 font-medium">Pending Approval</span>
                  </div>
                </div>
              </div>
            </div>

            {/* What to Expect */}
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">What to Expect</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 10 10.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Admin review of your school information</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 10 10.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Verification of provided details</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 10 10.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Email notification once approval decision is made</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 10 10.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Full dashboard access upon approval</span>
                </li>
              </ul>
            </div>

            {/* Warning Box */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-900">
                <span className="font-semibold">⚠️ Please note:</span> Dashboard access is not yet available. You'll be able to access all features once your registration is approved.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-lg text-center hover:shadow-lg transition"
              >
                Return to Login
              </Link>
              <a href="/contact" className="block w-full border-2 border-blue-500 text-blue-600 font-semibold py-3 rounded-lg text-center hover:bg-blue-50 transition">
                Questions? Contact Support
              </a>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-gray-500 mt-6">
              Check your email for approval updates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
