'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function RegistrationRejectedPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if approved
    if (user?.approvalStatus === 'approved') {
      router.push('/dashboard');
    }
    // Redirect if pending
    if (user?.approvalStatus === 'pending') {
      router.push('/dashboard/pending-approval');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-red-500 to-orange-600 px-8 pt-12 pb-8 text-white text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-6a4 4 0 110-8 4 4 0 010 8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Application Rejected</h1>
            <p className="text-red-100">Your registration could not be approved</p>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {/* Main Message */}
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
              <p className="text-red-900 font-medium mb-2">Your application was not approved</p>
              <p className="text-sm text-red-800">
                We were unable to approve your registration at this time. Please review the reason below.
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
              </div>
            </div>

            {/* Rejection Reason */}
            {user?.rejectionReason && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Reason for Rejection</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {user.rejectionReason}
                </p>
              </div>
            )}

            {/* What You Can Do */}
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">What You Can Do Next</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 10 10.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Review the provided rejection reason</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 10 10.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Correct the issues in your application</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 10 10.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Submit a new registration with updated information</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 10 10.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Contact our support team for assistance</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/register"
                className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-lg text-center hover:shadow-lg transition"
              >
                Register Again
              </Link>
              <a href="/contact" className="block w-full border-2 border-blue-500 text-blue-600 font-semibold py-3 rounded-lg text-center hover:bg-blue-50 transition">
                Contact Support
              </a>
            </div>

            {/* Support Info */}
            <div className="bg-gray-50 rounded-lg p-4 mt-6 text-center">
              <p className="text-sm text-gray-700 mb-2">Need help with your registration?</p>
              <p className="text-xs text-gray-600">
                Our support team is ready to assist you at{' '}
                <a href="mailto:support@kiddiescheck.com" className="text-blue-600 hover:text-blue-700 font-medium">
                  support@kiddiescheck.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
