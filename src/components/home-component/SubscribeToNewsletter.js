'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function SubscribeToNewsletter() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, success, error
  const [message, setMessage] = useState('');

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email.trim()) {
      setStatus('error');
      setMessage('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter?action=subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim() || 'Subscriber',
          lastName: lastName.trim() || '',
        }),
      });

      const data = await response.json();

      if (response.ok || data.success) {
        setStatus('success');
        setMessage('Successfully subscribed! Check your email for confirmation.');
        setEmail('');
        setFirstName('');
        setLastName('');
        
        // Reset after 5 seconds
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 5000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Connection error. Please try again later.');
      console.error('Subscribe error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full py-16 bg-gradient-to-r from-blue-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                Stay Updated
              </h2>
              <p className="text-lg text-gray-600">
                Subscribe to our newsletter and get the latest news, updates, and exclusive offers delivered to your inbox.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                  <span className="text-blue-900 font-bold text-sm">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Latest Updates</h3>
                  <p className="text-sm text-gray-600">Get notified about new services and features</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                  <span className="text-blue-900 font-bold text-sm">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Exclusive Deals</h3>
                  <p className="text-sm text-gray-600">Be the first to know about special promotions</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                  <span className="text-blue-900 font-bold text-sm">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">No Spam</h3>
                  <p className="text-sm text-gray-600">Unsubscribe anytime, we respect your privacy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
              <Mail className="w-6 h-6 text-blue-900" />
              <h3 className="text-xl font-bold text-gray-900">Subscribe Now</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name (Optional)
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name (Optional)
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Status Messages */}
              {status === 'success' && (
                <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">{message}</p>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">{message}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || status === 'success'}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-900 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 group"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Subscribing...</span>
                  </>
                ) : status === 'success' ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Subscribed!</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    <span>Subscribe</span>
                  </>
                )}
              </button>

              {/* Privacy Notice */}
              <p className="text-xs text-gray-600 text-center">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </form>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Join <span className="font-semibold text-gray-900">thousands of subscribers</span> who receive our weekly updates
          </p>
        </div>
      </div>
    </div>
  );
}
