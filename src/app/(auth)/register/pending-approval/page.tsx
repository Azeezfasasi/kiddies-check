'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PendingApprovalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 pt-12 pb-8 text-white text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Application Received!</h1>
            <p className="text-blue-100">Your registration is pending admin approval</p>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {/* Status Message */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
              <p className="text-blue-900 font-medium mb-2">What happens next?</p>
              <p className="text-sm text-blue-800 leading-relaxed">
                Our administration team will review your registration and details. We'll send you an approval confirmation email once the review is complete.
              </p>
            </div>

            {/* Details Box */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email Address</p>
                  <p className="text-gray-900 font-medium">{email}</p>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Status</p>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-gray-900 font-medium">Pending Approval</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Approval Timeline</h3>
              <div className="space-y-4">
                {[
                  { done: true, label: 'Email Verified' },
                  { done: true, label: 'Registration Received' },
                  { done: false, label: 'Admin Review' },
                  { done: false, label: 'Approval Confirmation' },
                  { done: false, label: 'Dashboard Access' },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start">
                    <div className="flex-shrink-0">
                      {step.done ? (
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-500">
                          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-300"></div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${step.done ? 'text-green-900' : 'text-gray-600'}`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-900">
                <span className="font-semibold">ℹ️ Note:</span> You won't be able to access the dashboard until your registration is approved. This usually takes 24-48 hours.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href="/login" className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-lg text-center hover:shadow-lg transition">
                Go to Login
              </Link>
              <a href="/contact" className="block w-full border-2 border-blue-500 text-blue-600 font-semibold py-3 rounded-lg text-center hover:bg-blue-50 transition">
                Contact Support
              </a>
            </div>

            {/* Footer Message */}
            <p className="text-center text-xs text-gray-500 mt-6">
              Check your email for updates about your application status
            </p>
          </div>
        </div>

        {/* Return Home Link */}
        <div className="text-center mt-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
export default function PendingApprovalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PendingApprovalContent />
    </Suspense>
  );
}