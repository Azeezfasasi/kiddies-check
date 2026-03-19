# KiddiesCheck Registration Approval Workflow

## Overview

The KiddiesCheck registration approval workflow ensures that only legitimate schools can access the platform. New users complete a registration process with email verification and OTP confirmation, then await admin approval before gaining access to the dashboard.

## System Components

### 1. User Database Schema

**File:** `src/app/server/models/User.js`

New approval-related fields added to User model:

```javascript
// Approval Status
approvalStatus: {
  type: String,
  enum: ['pending', 'approved', 'rejected'],
  default: 'pending'
},
approvedAt: Date,
approvedBy: ObjectId (references admin User),
rejectionReason: String,

// OTP Fields
registrationOTP: String (hashed),
registrationOTPExpires: Date,
registrationOTPAttempts: Number (0-3),
registrationOTPVerified: Boolean
```

**Key Methods:**

- `generateRegistrationOTP()` - Generates 6-digit OTP with 10-minute expiry
- `verifyRegistrationOTP(otp)` - Validates OTP, checks expiry, tracks attempts

### 2. Email Templates

**File:** `src/app/server/templates/emailTemplates.js`

Four HTML email templates included:

1. **registrationOTP** - Sends 6-digit OTP to user's email
2. **adminPendingApproval** - Notifies admin of new registration
3. **registrationApproved** - Confirms approval to user
4. **registrationRejected** - Explains rejection reason to user

### 3. Email Service

**File:** `src/app/server/utils/emailService.js`

Uses Brevo SMTP relay for sending emails:

- `sendOtpEmail()` - Send OTP code
- `sendAdminPendingNotification()` - Alert admin of registration
- `sendApprovalEmail()` - Confirm approval to user
- `sendRejectionEmail()` - Notify user of rejection

**Configuration Required:**

```env
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_LOGIN=your_brevo_email
BREVO_SMTP_PASSWORD=your_brevo_password
EMAIL_FROM=noreply@kiddiescheck.com
ADMIN_EMAIL=admin@kiddiescheck.com
FRONTEND_URL=https://your-frontend-url.com
```

### 4. API Endpoints

#### Registration Endpoint

**POST** `/api/auth/register`

**Flow:**

1. Validates all 12 registration fields
2. Checks email isn't already registered
3. Creates user with `approvalStatus: 'pending'`
4. Generates 6-digit OTP using `generateRegistrationOTP()`
5. Sends OTP email via Brevo
6. Returns success without login token

**Response:**

```json
{
  "success": true,
  "message": "Registration successful. OTP has been sent to your email.",
  "email": "user@example.com",
  "requiresOtpVerification": true
}
```

#### OTP Verification Endpoint

**POST** `/api/auth/verify-registration-otp`

**Payload:**

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Flow:**

1. Finds user by email
2. Verifies OTP using `verifyRegistrationOTP()`
3. Sets `registrationOTPVerified: true`
4. Sets `approvalStatus: 'pending'`
5. Sends admin notification email
6. Redirects user to pending approval page

**Response:**

```json
{
  "success": true,
  "message": "OTP verified successfully. Your registration is now pending admin approval.",
  "registrationOTPVerified": true
}
```

#### Resend OTP Endpoint

**POST** `/api/auth/resend-otp`

**Payload:**

```json
{
  "email": "user@example.com"
}
```

Generates new OTP and resends email. Prevents spam with cooldown timer.

#### Login Endpoint

**POST** `/api/auth/login`

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

**Important:** User can log in even if not approved, but `approvalStatus` determines dashboard access.

#### Admin Registrations Endpoint

**GET/PUT** `/api/admin/registrations`

**GET** - List all pending registrations

```bash
curl -H "Authorization: Bearer {admin_token}" \
  https://api.example.com/api/admin/registrations
```

**Response:**

```json
{
  "success": true,
  "count": 5,
  "registrations": [
    {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@school.com",
      "school": "DLC School",
      "model": "Montessori",
      "location": "Lagos",
      "numberOfStudents": 150,
      "numberOfTeachers": 8,
      "schoolLogo": "https://cloudinary.com/...",
      "approvalStatus": "pending"
    }
  ]
}
```

**PUT** - Approve or reject registration

```bash
curl -X PUT \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id",
    "action": "approve"
  }' \
  https://api.example.com/api/admin/registrations
```

**For Rejection:**

```json
{
  "userId": "user_id",
  "action": "reject",
  "rejectionReason": "School location verification failed"
}
```

## User Flow

### 1. Registration (4 Steps)

**Page:** `/register`

User fills 4-step form:

1. Personal info (name, email, phone)
2. Password setup
3. School info (name, model, location, student/teacher counts)
4. Logo upload and terms agreement

**On Submit:**

- Uploads logo to Cloudinary
- Creates user with `approvalStatus: 'pending'`
- Generates and sends OTP email
- Redirects to OTP verification page

### 2. OTP Verification

**Page:** `/register/verify-otp?email={email}`

User enters 6-digit code received in email:

- 3 attempts allowed (resets on resend)
- 10-minute validity window
- Resend available after 60-second cooldown

**On Success:**

- Marks OTP as verified
- Sets `registrationOTPVerified: true`
- Notifies admin via email
- Redirects to pending approval page

### 3. Pending Approval

**Page:** `/register/pending-approval?email={email}`

Shows user their application status:

- School details confirmation
- Timeline of approval process
- Message: "Usually takes 24-48 hours"
- Unable to access dashboard yet
- Link to support if needed

### 4. Admin Review

**Page:** `/admin/registrations`

Admin dashboard showing:

- List of pending registrations
- School details and logo
- Approve button (sends approval email immediately)
- Reject button (requires reason, sends rejection email)

### 5. After Approval

**Page:** `/dashboard` or `/dashboard/pending-approval` or `/dashboard/registration-rejected`

#### If Approved:

- User receives "Registration Approved" email
- Can now log in and access full dashboard

#### If Pending:

- Shows pending approval page
- Cannot access dashboard
- Message indicates admin review in progress

#### If Rejected:

- User receives rejection email with reason
- Cannot log in to dashboard
- Can submit new registration from rejection page

## Frontend Components

### OTP Verification Component

**File:** `src/app/register/verify-otp/page.js`

Features:

- Numeric input with auto-formatting
- Real-time 6-digit validation
- Attempt counter display
- Resend button with cooldown timer
- Error messaging specific to state

### Pending Approval Component

**File:** `src/app/register/pending-approval/page.js`

Features:

- Confirmation of received application
- Timeline showing progress steps
- Expected approval timeline
- Frequent support links

### Dashboard Access Control Hook

**File:** `src/hooks/useDashboardAccess.js`

Checks user's `approvalStatus`:

- `'approved'` → Allow dashboard access
- `'pending'` → Redirect to `/dashboard/pending-approval`
- `'rejected'` → Redirect to `/dashboard/registration-rejected`

### Dashboard Status Pages

**Files:**

- `src/app/dashboard/pending-approval/page.js` - Pending state
- `src/app/dashboard/registration-rejected/page.js` - Rejected state

## Error Handling

### OTP Errors

| Error                           | Cause                      | User Action           |
| ------------------------------- | -------------------------- | --------------------- |
| "Invalid or expired OTP"        | Wrong code or >10 mins old | Re-enter or resend    |
| "Maximum OTP attempts exceeded" | 3 failed attempts          | Resend to get new OTP |
| "OTP already verified"          | Trying to verify again     | Proceed to next step  |

### Approval Errors

| Error                           | Cause                       | Solution          |
| ------------------------------- | --------------------------- | ----------------- |
| "Registration already approved" | Admin already processed     | Refresh page      |
| "User not found"                | Invalid registration ID     | Contact admin     |
| "Admin access required"         | Non-admin attempting action | Use admin account |

## Email Environment Variables

Required in `.env.local`:

```env
# Brevo Configuration
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_LOGIN=your-brevo-email@example.com
BREVO_SMTP_PASSWORD=your-api-password
EMAIL_FROM=noreply@kiddiescheck.com
ADMIN_EMAIL=admin@kiddiescheck.com

# Frontend URLs
FRONTEND_URL=http://localhost:3000  # or production URL
```

## Security Considerations

1. **OTP Security:**
   - OTP hashed in database (not stored in plaintext)
   - 10-minute expiration
   - 3-attempt limit per OTP
   - Different OTP generated on resend

2. **Approval Authorization:**
   - Only users with `role: 'admin'` can approve/reject
   - Admin ID stored with approval
   - Token verification required for all admin endpoints

3. **Email Verification:**
   - User must verify email via OTP before admin approval
   - Admin notified only after OTP verification
   - Dashboard access requires approval, not just email verification

## Testing the Workflow

### Step 1: Test Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "1234567890",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "school": "Test School",
    "location": "Test City",
    "model": "Traditional",
    "numberOfTeachers": 10,
    "numberOfStudents": 100,
    "schoolLogo": "https://example.com/logo.png"
  }'
```

### Step 2: Verify OTP

```bash
curl -X POST http://localhost:3000/api/auth/verify-registration-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"  # Use actual OTP from email
  }'
```

### Step 3: Login (Before Approval)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
# Returns: approvalStatus: 'pending', canAccessDashboard: false
```

### Step 4: Get Pending Registrations (as Admin)

```bash
curl http://localhost:3000/api/admin/registrations \
  -H "Authorization: Bearer {admin_token}"
```

### Step 5: Approve Registration (as Admin)

```bash
curl -X PUT http://localhost:3000/api/admin/registrations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {admin_token}" \
  -d '{
    "userId": "user_id",
    "action": "approve"
  }'
```

## Troubleshooting

### OTP Email Not Received

1. Check BREVO\_\* environment variables are set
2. Verify ADMIN_EMAIL is correct
3. Check email spam folder
4. Use "Resend OTP" button to retry

### User Cannot Access Dashboard After Approval

1. User must log out and log back in
2. Check user's `approvalStatus` in database (should be 'approved')
3. Verify `approvedAt` and `approvedBy` are set

### Admin Cannot View Registrations

1. Verify user has `role: 'admin'`
2. Check JWT token is valid and not expired
3. Verify Authorization header format: `Bearer {token}`

## Future Enhancements

1. SMS OTP delivery as alternative to email
2. Bulk approval actions for multiple registrations
3. Registration status dashboard showing approval metrics
4. Auto-approval for known school domains
5. Appeals process for rejected registrations
6. Registration form data auto-save
