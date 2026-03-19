# KiddiesCheck Registration Approval Workflow - Implementation Summary

## Overview

A complete user registration approval system has been implemented for KiddiesCheck, requiring admin approval before dashboard access.

---

## 📋 What Was Implemented

### 1. **Database Schema Updates**

**File:** `src/app/server/models/User.js`

Added fields to support the approval workflow:

- `approvalStatus` - Enum: 'pending', 'approved', 'rejected' (default: 'pending')
- `approvedAt` - Timestamp of approval decision
- `approvedBy` - Reference to admin user who approved
- `rejectionReason` - Explanation for rejection
- `registrationOTP` - Hashed 6-digit OTP
- `registrationOTPExpires` - OTP expiration timestamp (10 minutes)
- `registrationOTPAttempts` - Count of failed attempts (0-3)
- `registrationOTPVerified` - Boolean flag

**New Methods:**

```javascript
generateRegistrationOTP(); // Creates 6-digit OTP with hash
verifyRegistrationOTP(otp); // Validates OTP, checks expiry, increments attempts
```

---

### 2. **Email Templates & Service**

#### Email Templates

**File:** `src/app/server/templates/emailTemplates.js`

Four beautiful HTML email templates:

1. **Registration OTP** - 6-digit code with security warning
2. **Admin Pending Notification** - School details for admin review
3. **Registration Approved** - Confirmation with dashboard access info
4. **Registration Rejected** - Reason and next steps

#### Email Service

**File:** `src/app/server/utils/emailService.js`

Brevo SMTP integration:

- `sendOtpEmail()` - Send OTP to user
- `sendAdminPendingNotification()` - Alert admin of registration
- `sendApprovalEmail()` - Confirmation to user
- `sendRejectionEmail()` - Rejection notice with reason

**Required Environment Variables:**

```env
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_LOGIN=your_email@brevo.com
BREVO_SMTP_PASSWORD=your_password
EMAIL_FROM=noreply@kiddiescheck.com
ADMIN_EMAIL=admin@kiddiescheck.com
FRONTEND_URL=https://your-domain.com
```

---

### 3. **API Endpoints**

#### Registration Endpoint (Updated)

**POST** `/api/auth/register`

- Creates user with `approvalStatus: 'pending'`
- Generates and sends OTP
- Returns success without token (requires OTP verification first)

**Response:**

```json
{
  "success": true,
  "message": "Registration successful. OTP has been sent to your email.",
  "email": "user@school.com",
  "requiresOtpVerification": true
}
```

#### OTP Verification Endpoint (New)

**POST** `/api/auth/verify-registration-otp`

- Validates 6-digit OTP
- Marks registration as OTP-verified
- Sends admin notification
- Limits to 3 attempts per OTP
- 10-minute validity window

**Request:**

```json
{
  "email": "user@school.com",
  "otp": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP verified successfully. Your registration is now pending admin approval.",
  "registrationOTPVerified": true
}
```

#### Resend OTP Endpoint (New)

**POST** `/api/auth/resend-otp`

- Generates new OTP
- Resends to email
- 60-second cooldown to prevent spam
- Resets attempt counter

#### Login Endpoint (Enhanced)

**POST** `/api/auth/login`

- Returns `approvalStatus` in response
- Returns `canAccessDashboard: true|false`
- Allows login even if not approved (frontend controls access)

**Enhanced Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token",
  "user": { /* user profile */ },
  "approvalStatus": "pending|approved|rejected",
  "canAccessDashboard": true|false
}
```

#### Admin Registrations Endpoint (New)

**GET/PUT** `/api/admin/registrations`

**GET** - List pending registrations (admin only)

```bash
curl -H "Authorization: Bearer {token}" \
  https://api.example.com/api/admin/registrations
```

**PUT** - Approve or reject registration (admin only)

```json
{
  "userId": "user_id",
  "action": "approve"
}
```

**For Rejection:**

```json
{
  "userId": "user_id",
  "action": "reject",
  "rejectionReason": "Invalid school documentation"
}
```

---

### 4. **Frontend Pages & Components**

#### OTP Verification Page

**File:** `src/app/register/verify-otp/page.js`

Features:

- 6-digit numeric input with auto-formatting
- Resend OTP button with 60-second cooldown
- Error messages with attempt counter
- Security warning about OTP
- Redirect to pending approval on success

**URL:** `/register/verify-otp?email={email}`

#### Pending Approval Page

**File:** `src/app/register/pending-approval/page.js`

Shows:

- Confirmation of received application
- School details summary
- Approval timeline with progress indicators
- Expected timeline (24-48 hours)
- Support contact information

**URL:** `/register/pending-approval?email={email}`

#### Dashboard Pending Approval Page

**File:** `src/app/dashboard/pending-approval/page.js`

Shows when user logs in but not approved:

- Status indicator showing "pending"
- What to expect during review
- Expected timeline
- Contact support link
- Cannot access dashboard yet

**URL:** `/dashboard/pending-approval`

#### Dashboard Registration Rejected Page

**File:** `src/app/dashboard/registration-rejected/page.js`

Shows when user logs in after rejection:

- Rejection reason
- Explanation of what went wrong
- Next steps (correct issues and reapply)
- Support information

**URL:** `/dashboard/registration-rejected`

#### Admin Registrations Dashboard

**File:** `src/app/admin/registrations/page.js`

Admin interface to:

- View all pending registrations with school logo
- See school details and student/teacher counts
- Approve registrations (sends approval email immediately)
- Reject registrations with reason (sends rejection email)
- Track approval history

**URL:** `/admin/registrations` (admin only)

---

### 5. **Protected Routes & Hooks**

#### Dashboard Access Hook

**File:** `src/hooks/useDashboardAccess.js`

Checks user's `approvalStatus`:

```javascript
- 'approved' → Full dashboard access
- 'pending' → Redirect to /dashboard/pending-approval
- 'rejected' → Redirect to /dashboard/registration-rejected
```

Usage:

```javascript
const isApproved = useDashboardAccess();

if (isApproved === null) {
  return <LoadingSpinner />;
}

if (!isApproved) {
  // User will be redirected by the hook
  return null;
}

return <DashboardContent />;
```

---

### 6. **Updated Registration Flow**

**Step 1: Registration Form** (`/register`)

- User fills 4-step form with school details
- Uploads school logo to Cloudinary
- Submits registration

**Step 2: OTP Verification** (`/register/verify-otp?email={email}`)

- User enters 6-digit OTP received in email
- 3 attempts allowed (resets on resend)
- 10-minute validity window
- Can resend after 60 seconds

**Step 3: Pending Approval Notice** (`/register/pending-approval?email={email}`)

- Shows confirmation of received application
- Indicates admin review in progress
- User cannot log in yet
- Can contact support

**Step 4: Admin Review** (`/admin/registrations`)

- Admin views pending registrations
- Reviews school details and logo
- Approves or rejects with reason
- Approval email sent immediately

**Step 5: User Notification** (via Email)

- Approved: "Welcome! Access your dashboard"
- Rejected: "Please review the reason and reapply"

**Step 6: Dashboard Access**

- **If Approved:** Full dashboard access after login
- **If Pending:** Shows "pending approval" message
- **If Rejected:** Shows rejection reason, can reapply

---

## 📊 User Flow Diagram

```
User Registration
    ↓
Fill 4-Step Form + Upload Logo
    ↓
Registration Saved (approvalStatus: 'pending')
OTP Generated & Sent
    ↓
User Enters OTP (verify-registration-otp)
    ↓
[Valid OTP] → [Invalid/Expired OTP]
    ↓         ↓
Admin         Resend OTP
Notified      (max 3 attempts)
Send Email
    ↓
User Sees Pending Approval
Page (register/pending-approval)
    ↓
Admin Reviews & Decides
    ↓
[APPROVED]          [REJECTED]
    ↓                   ↓
Send Approval       Send Rejection
Email               Email
    ↓                   ↓
User Logs In     User Sees Rejection
    ↓                   ↓
Full Dashboard   Can Reapply
Access           (new registration)
```

---

## 🔒 Security Features

1. **OTP Security:**
   - OTP hashed in database (not plaintext)
   - 10-minute expiration
   - 3-attempt limit per OTP
   - New OTP generated on resend

2. **Admin Authorization:**
   - Only `role: 'admin'` users can approve/reject
   - JWT token verification required
   - Admin ID recorded for audit trail

3. **Email Verification:**
   - Must verify email before admin notification
   - Dashboard access locked until approved
   - Token contains approval status

---

## 🧪 Testing Checklist

- [ ] User can complete 4-step registration
- [ ] OTP email arrives within 1 minute
- [ ] Entering valid OTP proceeds to pending page
- [ ] Entering invalid OTP shows error
- [ ] Resend OTP generates new 6-digit code
- [ ] Cooldown timer prevents spam
- [ ] Admin can see pending registrations
- [ ] Admin can approve registration
- [ ] Approval email sends to user
- [ ] User can log in after approval
- [ ] Dashboard access granted after approval
- [ ] Admin can reject with reason
- [ ] Rejection email sends to user
- [ ] Rejected user cannot access dashboard
- [ ] Rejected user can reapply

---

## 📝 Configuration Steps

### Step 1: Set Environment Variables

Add to `.env.local`:

```env
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_LOGIN=your-email@brevo.com
BREVO_SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@kiddiescheck.com
ADMIN_EMAIL=admin@kiddiescheck.com
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key
```

### Step 2: Create Admin User

Add to database via MongoDB:

```javascript
{
  email: "admin@kiddiescheck.com",
  firstName: "Admin",
  lastName: "User",
  password: "hashed_password",
  role: "admin"
}
```

### Step 3: Test the Flow

1. Navigate to `/register`
2. Complete all 4 steps
3. Check email for OTP
4. Enter OTP
5. Navigate to `/admin/registrations` as admin
6. Approve the registration
7. Check email for approval confirmation
8. Log in and verify dashboard access

---

## 📦 Files Created/Modified

### Created Files:

```
src/app/server/templates/emailTemplates.js
src/app/server/utils/emailService.js
src/app/api/auth/verify-registration-otp/route.js
src/app/api/auth/resend-otp/route.js
src/app/api/admin/registrations/route.js
src/app/register/verify-otp/page.js
src/app/register/pending-approval/page.js
src/app/dashboard/pending-approval/page.js
src/app/dashboard/registration-rejected/page.js
src/app/admin/registrations/page.js
src/hooks/useDashboardAccess.js
docs/REGISTRATION_APPROVAL_WORKFLOW.md
```

### Modified Files:

```
src/app/server/models/User.js           (Added OTP & approval fields/methods)
src/app/server/controllers/authController.js (Register: send OTP, Login: return approvalStatus)
src/app/register/page.js               (Redirect to verify-otp after registration)
```

---

## 🚀 Next Steps

1. **Verify Email Service:** Test Brevo SMTP connection
2. **Create Admin User:** Set up at least one admin account
3. **Update Dashboard:** Add useDashboardAccess hook to main dashboard
4. **Test Approval Flow:** Complete end-to-end testing
5. **Monitor Emails:** Check spam folders if emails don't arrive

---

## 💡 Key Implementation Details

### Why OTP Instead of Email Links?

- More secure (codes expire in 10 minutes vs 24 hours)
- Better user experience (no email clicking required)
- Simpler implementation (no token generation/storage)
- Mobile-friendly (easier to type codes)

### Why Separate Approval Step?

- Allows admin review before database queries
- Time for admin to verify school legitimacy
- Prevents unauthorized dashboard access
- Professional onboarding experience

### Why 6-Digit OTP?

- Balances security with usability
- 1 million possible combinations
- Prevents accidental matches
- Standard industry practice

---

## 🐛 Troubleshooting

**OTP email not arriving?**

- Check BREVO environment variables
- Verify ADMIN_EMAIL is correct
- Check spam/junk folders
- Use "Resend OTP" button

**Admin can't approve registrations?**

- Verify user has `role: 'admin'` in database
- Check JWT token is valid
- Ensure Authorization header is correct
- Check browser console for errors

**User can't access dashboard after approval?**

- User must log out and log back in
- Check `approvalStatus` in database (should be 'approved')
- Verify `approvedAt` and `approvedBy` are set
- Clear browser localStorage and retry

**OTP verification failing?**

- Ensure OTP is exactly 6 digits
- Check OTP hasn't expired (10 minutes)
- Verify no more than 3 attempts made
- Use "Resend OTP" if needed

---

## 📚 Documentation

Comprehensive documentation available at:

- `docs/REGISTRATION_APPROVAL_WORKFLOW.md` - Full workflow guide
- API Endpoint details with cURL examples
- Email template previews
- Testing instructions
- Troubleshooting section
