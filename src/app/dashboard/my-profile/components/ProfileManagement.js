'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import axios from 'axios';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ProfileManagement() {
  const { user, token, updateUserData } = useAuth();
  const fileInputRef = useRef(null);
  const schoolLogoInputRef = useRef(null);

  // Profile Update States
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    department: '',
    position: '',
    avatar: '',
    school: '',
    location: '',
    model: '',
    numberOfTeachers: '',
    numberOfStudents: '',
    schoolLogo: '',
  });

  // Password Change States
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // UI States
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [schoolLogoPreview, setSchoolLogoPreview] = useState(null);
  const [schoolLogoFile, setSchoolLogoFile] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        company: user.company || '',
        department: user.department || '',
        position: user.position || '',
        avatar: user.avatar || '',
        school: user.schoolName || '',
        location: user.location || '',
        model: user.model || '',
        numberOfTeachers: user.numberOfTeachers || '',
        numberOfStudents: user.numberOfStudents || '',
        schoolLogo: user.schoolLogo || '',
      });
      if (user.avatar) {
        setPreviewImage(user.avatar);
      }
      if (user.schoolLogo) {
        setSchoolLogoPreview(user.schoolLogo);
      }
    }
  }, [user]);

  // Handle profile form change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    setProfileError('');
  };

  // Handle password form change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordError('');
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Image size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setProfileError('Please select a valid image file');
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle school logo selection
  const handleSchoolLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfileError('School logo size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setProfileError('Please select a valid image file for school logo');
      return;
    }

    setSchoolLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setSchoolLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Upload school logo to Cloudinary via API
  const uploadSchoolLogoToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'kiddies-check/school-logos');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload school logo');
      }

      const data = await response.json();
      
      if (!data.success || !data.url) {
        throw new Error('Upload returned invalid response');
      }

      return data.url;
    } catch (error) {
      console.error('School logo upload error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to upload school logo');
    }
  };

  // Convert image to Base64
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Submit profile update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    // Validation
    if (!profileForm.firstName?.trim() || !profileForm.lastName?.trim()) {
      setProfileError('First name and last name are required');
      return;
    }

    if (profileForm.firstName.length < 2 || profileForm.lastName.length < 2) {
      setProfileError('Names must be at least 2 characters');
      return;
    }

    setProfileLoading(true);

    try {
      const updateData = { ...profileForm };

      // Convert and include avatar if changed
      if (imageFile) {
        const base64Avatar = await convertImageToBase64(imageFile);
        updateData.avatar = base64Avatar;
      }

      // Upload school logo to Cloudinary if changed
      if (schoolLogoFile) {
        setLogoUploading(true);
        setProfileError('');
        console.log('Starting school logo upload...');
        try {
          const logoUrl = await uploadSchoolLogoToCloudinary(schoolLogoFile);
          console.log('School logo uploaded successfully:', logoUrl);
          updateData.schoolLogo = logoUrl;
          setSchoolLogoFile(null);
          setSchoolLogoPreview(logoUrl);
        } catch (error) {
          console.error('School logo upload failed:', error);
          setProfileError('Failed to upload school logo: ' + (error instanceof Error ? error.message : 'Unknown error'));
          setLogoUploading(false);
          setProfileLoading(false);
          return;
        }
        setLogoUploading(false);
      }

      const response = await axios.put('/api/users/profile', updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        setProfileSuccess('Profile updated successfully!');
        setImageFile(null);
        setSchoolLogoFile(null);

        // Update context with new user data
        if (updateUserData && response.data.user) {
          // Update form with new data to reflect changes
          const updatedUser = response.data.user;
          setProfileForm({
            firstName: updatedUser.firstName || '',
            lastName: updatedUser.lastName || '',
            phone: updatedUser.phone || '',
            company: updatedUser.company || '',
            department: updatedUser.department || '',
            position: updatedUser.position || '',
            avatar: updatedUser.avatar || '',
            school: updatedUser.schoolName || '',
            location: updatedUser.location || '',
            model: updatedUser.model || '',
            numberOfTeachers: updatedUser.numberOfTeachers || '',
            numberOfStudents: updatedUser.numberOfStudents || '',
            schoolLogo: updatedUser.schoolLogo || '',
          });
          
          // Update previews
          if (updatedUser.avatar) {
            setPreviewImage(updatedUser.avatar);
          }
          if (updatedUser.schoolLogo) {
            setSchoolLogoPreview(updatedUser.schoolLogo);
          }
          
          updateUserData(updatedUser);
        }

        // Clear success message after 3 seconds
        setTimeout(() => setProfileSuccess(''), 3000);
      }
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to update profile';
      setProfileError(message);
    } finally {
      setProfileLoading(false);
    }
  };

  // Submit password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await axios.put('/api/users/change-password', passwordForm, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        // Clear success message after 3 seconds
        setTimeout(() => setPasswordSuccess(''), 3000);
      }
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to change password';
      setPasswordError(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'learning-specialist', 'school-leader', 'teacher', 'parent']}>
    <div className="min-h-screen bg-gray-50 pt-0 pb-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[24px] md:text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-lg text-gray-600">
            Manage your account information and security settings
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Profile Details
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'password'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Change Password
          </button>
        </div>

        {/* Profile Details Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <form onSubmit={handleProfileSubmit} className="space-y-8">
              {/* Profile Picture Section */}
              <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-gray-200">
                <div className="flex flex-col items-center sm:items-start">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4 border-4 border-gray-300 flex items-center justify-center">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                        <span className="text-4xl text-white font-semibold">
                          {profileForm.firstName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Change Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {profileForm.firstName} {profileForm.lastName}
                  </h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <p>
                      <span className="font-medium text-gray-900">Email: </span>
                      {user?.email}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">
                        Account Status:{' '}
                      </span>
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Active
                      </span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">
                        Member Since:{' '}
                      </span>
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              {profileError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  ✓ {profileSuccess}
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileForm.firstName}
                    onChange={handleProfileChange}
                    disabled={profileLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileForm.lastName}
                    onChange={handleProfileChange}
                    disabled={profileLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100"
                    placeholder="Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    disabled={profileLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100"
                    placeholder="+234 000-0000"
                  />
                </div>
              </div>

              {/* School Information Section - Only for school-leader */}
              {user?.role === 'school-leader' && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">School Information</h3>
                  
                  {/* School Logo Upload */}
                  <div className="mb-8 pb-8 border-b border-gray-200">
                    <label className="block text-sm font-medium text-gray-900 mb-4">
                      School Logo
                    </label>
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="flex flex-col items-center">
                        <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-200 mb-4 border-2 border-gray-300 flex items-center justify-center">
                          {schoolLogoPreview ? (
                            <img
                              src={schoolLogoPreview}
                              alt="School Logo"
                              className="w-full h-full object-contain p-2"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                              <span className="text-gray-600 text-center text-xs font-medium p-4">
                                School Logo Preview
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => schoolLogoInputRef.current?.click()}
                          disabled={logoUploading || profileLoading}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-60"
                        >
                          {logoUploading ? 'Uploading...' : 'Change Logo'}
                        </button>
                        <input
                          ref={schoolLogoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleSchoolLogoChange}
                          className="hidden"
                        />
                        <p className="text-sm text-gray-500 mt-2 text-center">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        School Name
                      </label>
                      <input
                        type="text"
                        name="school"
                        value={profileForm.school}
                        onChange={handleProfileChange}
                        disabled={profileLoading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100"
                        placeholder="e.g., St. Mary's Academy"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        School Model
                      </label>
                      <select
                        name="model"
                        value={profileForm.model}
                        onChange={handleProfileChange}
                        disabled={profileLoading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100"
                      >
                        <option value="">Select School Model</option>
                        <option value="primary">Primary School</option>
                        <option value="secondary">Secondary School</option>
                        <option value="both">Both Primary & Secondary</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        School Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={profileForm.location}
                        onChange={handleProfileChange}
                        disabled={profileLoading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100"
                        placeholder="e.g., Lagos, Nigeria"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Number of Teachers
                      </label>
                      <input
                        type="number"
                        name="numberOfTeachers"
                        value={profileForm.numberOfTeachers}
                        onChange={handleProfileChange}
                        disabled={profileLoading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100"
                        placeholder="e.g., 25"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Number of Students
                      </label>
                      <input
                        type="number"
                        name="numberOfStudents"
                        value={profileForm.numberOfStudents}
                        onChange={handleProfileChange}
                        disabled={profileLoading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100"
                        placeholder="e.g., 500"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Messages */}
              {profileError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  ✓ {profileSuccess}
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-8 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition font-medium"
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <form onSubmit={handlePasswordSubmit} className="max-w-xl space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Change Your Password
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Enter your current password and choose a new password. Use a
                  strong password with at least 6 characters.
                </p>
              </div>

              {/* Messages */}
              {passwordError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  ✓ {passwordSuccess}
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  disabled={passwordLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100"
                  placeholder="Enter your current password"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  disabled={passwordLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100"
                  placeholder="Enter a new password"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Minimum 6 characters required
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  disabled={passwordLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100"
                  placeholder="Confirm your new password"
                />
              </div>
              
              {/* Messages */}
              {profileError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  ✓ {profileSuccess}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition font-medium"
                >
                  {passwordLoading ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}
