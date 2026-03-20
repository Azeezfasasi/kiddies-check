"use client";
import { useState, useRef, memo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Separate FormField component to prevent re-creation on each render
const FormField = memo(({
  label,
  name,
  type = "text",
  placeholder,
  required = true,
  as = "input",
  children,
  helpText,
  value,
  onChange,
  onKeyDown,
  errors,
  disabled = false,
}) => (
  <div className="mb-6">
    <label htmlFor={name} className="block text-gray-700 font-medium mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>

    {as === "input" && (
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 transition ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        } ${
          errors[name] ? "border-red-500 focus:ring-red-500" : "border-gray-300"
        }`}
        placeholder={placeholder}
      />
    )}

    {as === "select" && (
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 transition ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        } ${
          errors[name] ? "border-red-500 focus:ring-red-500" : "border-gray-300"
        }`}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {children}
      </select>
    )}

    {helpText && <p className="text-gray-500 text-sm mt-1">{helpText}</p>}
    {errors[name] && (
      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
        <span>⚠</span> {errors[name]}
      </p>
    )}
  </div>
));

FormField.displayName = "FormField";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const fileInputRef = useRef(null);

  // Detect if this is an invitation flow
  const invitationToken = searchParams?.get('invitationToken') || '';
  const schoolId = searchParams?.get('schoolId') || '';
  const invitedEmail = searchParams?.get('email') ? decodeURIComponent(searchParams.get('email')) : ''; // Decode URL-encoded email
  const isInvitation = !!(invitationToken && schoolId);

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "", // Will be populated in useEffect if invitation
    phone: "",
    role: "", // Will be set automatically for invited users
    password: "",
    confirmPassword: "",
    school: "",
    model: "",
    location: "",
    numberOfTeachers: "",
    numberOfStudents: "",
    schoolLogo: null,
    schoolLogoFile: null,
    terms: false,
  });

  // Pre-fill invited email from URL parameter or by checking invitations
  useEffect(() => {
    const fetchInvitationEmail = async () => {
      if (isInvitation && !invitedEmail) {
        // If email not in URL, fetch it from the invitation record
        try {
          const response = await fetch(`/api/school/invitation/details?invitationToken=${invitationToken}&schoolId=${schoolId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.data?.email) {
              setFormData((prev) => ({
                ...prev,
                email: data.data.email,
              }));
            }
          }
        } catch (err) {
          console.error('Failed to fetch invitation email:', err);
        }
      } else if (isInvitation && invitedEmail) {
        // Email is in URL, use it directly
        setFormData((prev) => ({
          ...prev,
          email: invitedEmail,
        }));
      }
    };

    fetchInvitationEmail();
  }, [isInvitation, invitedEmail, invitationToken, schoolId]);

  // For invited users: skip role step, so totalSteps is 2 (personal info + password)
  // For regular users: 5 steps
  const totalSteps = isInvitation ? 2 : 5;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleKeyDown = (e) => {
    // Prevent form submission and any Enter key behavior
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          schoolLogo: "Please upload a valid image file (JPEG, PNG, GIF, or WebP)",
        }));
        return;
      }

      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          schoolLogo: "File size must be less than 10MB",
        }));
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      setFormData((prev) => ({
        ...prev,
        schoolLogo: file.name,
        schoolLogoFile: file,
      }));

      setErrors((prev) => ({
        ...prev,
        schoolLogo: "",
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
      
      // For invited users, skip email validation - it's pre-filled and read-only
      if (!isInvitation) {
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
          newErrors.email = "Invalid email address";
      }
      
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    }

    // Skip role validation for invited users (they already have a role assigned)
    if (step === 2 && !isInvitation) {
      if (!formData.role) newErrors.role = "Role is required";
    }

    // For invited users, password is step 2; for regular users, it's step 3
    const passwordStep = isInvitation ? 2 : 3;
    if (step === passwordStep) {
      if (!formData.password) newErrors.password = "Password is required";
      else if (formData.password.length < 6)
        newErrors.password = "Password must be at least 6 characters";
      if (!formData.confirmPassword)
        newErrors.confirmPassword = "Please confirm password";
      else if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match";
    }

    if (step === 4) {
      if (!formData.school.trim()) newErrors.school = "School name is required";
      if (!formData.model) newErrors.model = "School model is required";
      if (!formData.location.trim()) newErrors.location = "Location is required";
      if (!formData.numberOfTeachers)
        newErrors.numberOfTeachers = "Number of teachers is required";
      if (!formData.numberOfStudents)
        newErrors.numberOfStudents = "Number of students is required";
    }

    if (step === 5) {
      if (!formData.schoolLogo) newErrors.schoolLogo = "School logo is required";
      if (!formData.terms) newErrors.terms = "You must agree to the terms";
    }

    // Skip steps 4 and 5 for invited users
    if (isInvitation && (step === 4 || step === 5)) {
      return true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(currentStep)) return;

    setSubmitting(true);

    try {
      if (isInvitation) {
        // For invited users, use the invitation acceptance endpoint
        const acceptResponse = await fetch('/api/school/invitation/accept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invitationToken,
            schoolId,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
          }),
        });

        const acceptData = await acceptResponse.json();

        if (acceptData.success) {
          // Auto-login with returned token
          if (acceptData.data.token) {
            localStorage.setItem('token', acceptData.data.token);
            localStorage.setItem('userId', acceptData.data.user._id);
            localStorage.setItem('schoolId', acceptData.data.user.schoolId);
          }
          // Redirect to dashboard
          router.push('/dashboard');
          return;
        }

        alert(acceptData.error || 'Failed to accept invitation');
        return;
      }

      // Regular registration flow (not invited)
      let schoolLogoUrl = null;

      // Upload school logo to Cloudinary if available
      if (formData.schoolLogoFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", formData.schoolLogoFile);
        uploadFormData.append("folder", "rayob/school-logos");

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload logo to Cloudinary");
        }

        const uploadData = await uploadResponse.json();

        if (uploadData.success) {
          schoolLogoUrl = uploadData.url;
        } else {
          throw new Error(uploadData.error || "Upload failed");
        }
      }

      // Register user with Cloudinary URL
      const result = await register(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.phone,
        formData.role,
        formData.password,
        formData.confirmPassword,
        formData.school,
        formData.location,
        formData.model,
        formData.numberOfTeachers,
        formData.numberOfStudents,
        schoolLogoUrl || formData.schoolLogo
      );

      if (result?.success) {
        router.push(`/register/verify-otp?email=${encodeURIComponent(formData.email)}`);
        return;
      }

      alert(result?.message || "Registration failed");
    } catch (err) {
      console.error(err);
      alert(err.message || "Registration error");
    } finally {
      setSubmitting(false);
    }
  };

  const ProgressIndicator = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i + 1} className="flex items-center flex-1">
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                i + 1 <= currentStep
                  ? "bg-blue-900 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {i + 1 < currentStep ? "✓" : i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`flex-1 h-1 mx-2 transition-colors ${
                  i + 1 < currentStep ? "bg-blue-900" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="text-center text-sm text-gray-600 font-medium">
        Step {currentStep} of {totalSteps}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {isInvitation ? "Complete Your Profile" : "Create Your Account"}
          </h1>
          <p className="text-gray-600 text-lg">
            {isInvitation 
              ? "Set up your credentials to join the school"
              : "Join Kiddies Check and manage your school effortlessly"
            }
          </p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator />

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="space-y-8"
        >
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="animate-fadeIn space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Personal Information
                </h2>
                <p className="text-gray-600">
                  Let's start with your basic information
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="First Name"
                  name="firstName"
                  placeholder="John"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  errors={errors}
                />
                <FormField
                  label="Last Name"
                  name="lastName"
                  placeholder="Doe"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  errors={errors}
                />
              </div>

              <FormField
                label="Email Address"
                name="email"
                type="email"
                placeholder="your.email@example.com"
                required
                disabled={isInvitation}
                value={formData.email}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                errors={errors}
              />
              {isInvitation && (
                <p className="text-sm text-gray-500 -mt-4 mb-4">
                  This email cannot be changed as it was used for your invitation.
                </p>
              )}

              <FormField
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="+234 (800) 000-0000"
                required
                helpText="Include country code for better communication"
                value={formData.phone}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                errors={errors}
              />
            </div>
          )}

          {/* Step 2: Select Your Role (SKIP for invited users) */}
          {!isInvitation && currentStep === 2 && (
            <div className="animate-fadeIn space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Select Your Role
                </h2>
                <p className="text-gray-600">
                  Choose the role that best describes your position
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: "learning-specialist", label: "Learning Specialist", icon: "🎓" },
                  { value: "school-leader", label: "School Leader", icon: "👨‍💼" },
                  { value: "teacher", label: "Teacher", icon: "👩‍🏫" },
                  { value: "parent", label: "Parent", icon: "👨‍👩‍👧" },
                ].map((roleOption) => (
                  <label
                    key={roleOption.value}
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.role === roleOption.value
                        ? "border-blue-900 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={roleOption.value}
                      checked={formData.role === roleOption.value}
                      onChange={handleChange}
                      className="h-6 w-6 text-blue-900 border-gray-300 focus:ring-2 focus:ring-blue-900 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-2xl">{roleOption.icon}</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {roleOption.label}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              {errors.role && (
                <p className="text-red-500 text-sm mt-4 flex items-center gap-1">
                  <span>⚠</span> {errors.role}
                </p>
              )}
            </div>
          )}

          {/* Step 3/2: Password Setup - Step 3 for regular users, Step 2 for invited users */}
          {currentStep === (isInvitation ? 2 : 3) && (
            <div className="animate-fadeIn space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Set Your Password
                </h2>
                <p className="text-gray-600">
                  Create a strong password to secure your account
                </p>
              </div>

              <FormField
                label="Password"
                name="password"
                type="password"
                placeholder="••••••••••"
                required
                value={formData.password}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                errors={errors}
              />

              <FormField
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                placeholder="••••••••••"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                errors={errors}
              />

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Password Requirements:
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    At least 6 characters
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    Mix of uppercase and lowercase letters
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-1">✓</span>
                    Include numbers and special characters
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 4: School Information */}
          {!isInvitation && currentStep === 4 && (
            <div className="animate-fadeIn space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  School Information
                </h2>
                <p className="text-gray-600">
                  Tell us more about your educational institution
                </p>
              </div>

              <FormField
                label="School Name"
                name="school"
                placeholder="e.g., St. Mary's Academy"
                required
                value={formData.school}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                errors={errors}
              />

              <FormField
                label="School Model"
                name="model"
                as="select"
                required
                value={formData.model}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                errors={errors}
              >
                <option value="primary">Primary School</option>
                <option value="secondary">Secondary School</option>
                <option value="both">Both Primary & Secondary</option>
              </FormField>

              <FormField
                label="School Location"
                name="location"
                placeholder="e.g., Lagos, Nigeria"
                required
                helpText="Enter your school's city or complete address"
                value={formData.location}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                errors={errors}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Number of Teachers"
                  name="numberOfTeachers"
                  type="number"
                  placeholder="e.g., 25"
                  required
                  value={formData.numberOfTeachers}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  errors={errors}
                />
                <FormField
                  label="Number of Students"
                  name="numberOfStudents"
                  type="number"
                  placeholder="e.g., 500"
                  required
                  value={formData.numberOfStudents}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  errors={errors}
                />
              </div>
            </div>
          )}

          {/* Step 5: School Logo & Agreement */}
          {!isInvitation && currentStep === 5 && (
            <div className="animate-fadeIn space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Complete Your Registration
                </h2>
                <p className="text-gray-600">
                  Upload your school logo and agree to terms
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  School Logo <span className="text-red-500">*</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    errors.schoolLogo
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 hover:border-blue-900 hover:bg-blue-50"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="schoolLogo"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {logoPreview ? (
                    <div className="space-y-4">
                      <img
                        src={logoPreview}
                        alt="School logo preview"
                        className="h-24 w-24 mx-auto object-cover rounded-lg"
                      />
                      <div>
                        <p className="text-gray-700 font-medium">
                          {formData.schoolLogo}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          Click to change
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-5xl">🏫</div>
                      <div>
                        <p className="text-gray-700 font-semibold">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-gray-500 text-sm">
                          PNG, JPG, GIF or WebP • Max 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {errors.schoolLogo && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span>⚠</span> {errors.schoolLogo}
                  </p>
                )}
              </div>

              {/* Terms & Conditions */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="terms"
                    checked={formData.terms}
                    onChange={handleChange}
                    className={`mt-1 h-5 w-5 rounded border text-blue-900 focus:ring-2 focus:ring-blue-900 transition ${
                      errors.terms ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <span className="text-gray-700">
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="text-blue-900 hover:text-blue-800 font-semibold"
                    >
                      Terms & Conditions
                    </Link>
                    {" "}and{" "}
                    <Link
                      href="/privacy"
                      className="text-blue-900 hover:text-blue-800 font-semibold"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.terms && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <span>⚠</span> {errors.terms}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-10 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={currentStep === totalSteps ? handleSubmit : handleNext}
              disabled={submitting}
              className={`flex-1 px-6 py-3 text-white font-semibold rounded-xl transition ${
                submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-900 hover:bg-blue-800 active:bg-blue-950"
              }`}
            >
              {submitting
                ? "Creating account..."
                : currentStep === totalSteps
                  ? "Complete Registration"
                  : "Next →"}
            </button>
          </div>
        </form>

        {/* Login Link */}
        <p className="text-center text-gray-600 mt-8">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-900 hover:text-blue-800 font-semibold"
          >
            Sign in here
          </Link>
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <RegisterContent />
    </Suspense>
  );
}
