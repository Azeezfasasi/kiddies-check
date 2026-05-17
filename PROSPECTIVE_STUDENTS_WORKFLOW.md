# Prospective Students Workflow Documentation

## Overview
This document outlines the complete workflow for student registration and approval in the Kiddies Check system. The system implements a **two-step approval process** where parent-submitted student data goes to a prospective students list first, then admin/school-leader/learning-specialist personnel can approve or reject each student.

---

## Workflow Steps

### Step 1: Parent Registration with Children Data
**File**: `src/app/register/page.js`

When a parent registers on the platform, they follow a multi-step registration form:

1. **Step 1**: Personal Information (name, email, phone, school selection)
2. **Step 2**: School/Role Selection (select their school and school type)
3. **Step 3**: Children Information (add children details - name, class, grade)
4. **Step 4**: Password (set account password)

#### Children Data Collection
Parents can add multiple children with:
- **Child's Full Name** (required)
- **Class** (required - dropdown selection from school's available classes)
- **Grade/Age Range** (e.g., 5-6 years)

```javascript
// Format of child data in form
{
  name: "John Doe",
  className: "JK-A",
  grade: "5-6 years"
}
```

---

### Step 2: Account Registration & OTP Verification
**Files**: 
- `src/context/AuthContext.js` - Client-side registration
- `src/app/api/auth/register/route.js` - Server-side registration
- `src/app/api/auth/verify-registration-otp/route.js` - OTP verification

#### Registration Process:
1. Parent submits registration form with children data
2. Children data is stored in localStorage: `pendingChildren`
3. User account is created with `approvalStatus: 'pending'`
4. OTP is generated and sent to parent's email

#### OTP Verification:
1. Parent receives OTP email
2. Parent enters 6-digit OTP on verification page
3. **Children data is retrieved from localStorage and sent with OTP verification**
4. Upon successful OTP verification:
   - User's `registrationOTPVerified` flag is set to `true`
   - For each child, a **ProspectiveStudent** record is created
   - Parent is redirected to pending approval page

---

### Step 3: ProspectiveStudent Records Created

**File**: `src/app/server/models/ProspectiveStudent.js`

When OTP is verified, the system automatically creates ProspectiveStudent records:

```javascript
{
  firstName: "John",
  lastName: "Doe",
  dateOfBirth: null,
  gender: null,
  gradeLevel: "5-6 years",
  className: "JK-A",
  classId: null,
  school: ObjectId("school_id"),
  schoolType: "my-childs-school",
  picture: null,
  phone: null,
  email: "parent@example.com",
  registeredBy: ObjectId("parent_user_id"),
  parentId: ObjectId("parent_user_id"),
  parentName: "Parent Name",
  parentEmail: "parent@example.com",
  parentPhone: "08012345678",
  status: "pending",
  approvalNotes: null,
  approvedBy: null,
  approvedAt: null,
  rejectionReason: null,
  rejectedAt: null,
  approvedStudentId: null,
  createdAt: Date
}
```

---

### Step 4: Admin/School-Leader/Learning-Specialist Review

**File**: `src/app/dashboard/prospective-students/page.js`

#### Access Control:
Only the following roles can view and manage prospective students:
- ✅ **Admin** - Can view all prospective students across all schools
- ✅ **School-Leader** - Can view prospective students for their school only
- ✅ **Learning-Specialist** - Can view prospective students for their school only
- ❌ Parents, Teachers cannot access this page

#### Dashboard Features:

**Statistics Dashboard**
- Pending Review count
- Approved count
- Rejected count

**Search & Filter**
- Search by student name, email, or parent name
- Filter by status: Pending, Approved, Rejected

**Student Cards Display**
- Student name with avatar
- Status badge (color-coded)
- Email, date of birth, parent name, class
- Action buttons: View Details, Approve, Reject

**Detailed View Modal**
- Complete student information
- Parent information and submission date
- Class assignment details
- Approval/Rejection history (if applicable)

---

### Step 5: Approval Process

**File**: `src/app/api/prospective-students/route.js`

#### Approval Actions:

**1. Approve Student**
- Admin/School-Leader/Learning-Specialist clicks "Approve" button
- Opens approval modal with optional notes field
- Upon confirmation:
  - Generates enrollment number: `KIDSTU-000001` (incremental)
  - Creates actual **Student** record in the system
  - Links Student to parent
  - Links Student to class
  - Student becomes active: `isActive: true`
  - ProspectiveStudent status updated to "approved"
  - Approval timestamp and approver recorded

**2. Reject Student**
- Admin/School-Leader/Learning-Specialist clicks "Reject" button
- Opens rejection modal with required reason field
- Upon confirmation:
  - ProspectiveStudent status updated to "rejected"
  - Rejection reason recorded
  - Rejection timestamp recorded
  - No Student record is created

#### Approval Response:
```javascript
{
  success: true,
  message: "Student approved and added to school",
  student: {
    // New Student document created
    firstName: "John",
    lastName: "Doe",
    enrollmentNo: "KIDSTU-000001",
    school: ObjectId("school_id"),
    class: ObjectId("class_id"),
    parent: ObjectId("parent_user_id"),
    isActive: true,
    // ... other fields
  },
  prospectiveStudent: {
    // Updated ProspectiveStudent document
    status: "approved",
    approvedBy: ObjectId("admin_user_id"),
    approvedAt: Date,
    approvedStudentId: ObjectId("student_id"),
    // ... other fields
  }
}
```

---

## Technical Implementation Details

### Data Flow Diagram

```
Parent Registration Form
        ↓
[Children Data + User Data]
        ↓
localStorage.setItem('pendingChildren')
        ↓
API: /api/auth/register
        ↓
User Document Created (approvalStatus: 'pending')
OTP Generated & Sent
        ↓
[OTP Verification Page]
        ↓
Retrieve pendingChildren from localStorage
        ↓
API: /api/auth/verify-registration-otp (with children)
        ↓
[For each child] → Create ProspectiveStudent
        ↓
ProspectiveStudent Records (status: 'pending')
        ↓
[Admin/School-Leader/Learning-Specialist Views]
        ↓
Prospective Students Dashboard
        ↓
[Decision: Approve or Reject]
        ↓
If APPROVED:
  → Generate Enrollment Number
  → Create Student Document
  → Update ProspectiveStudent (status: 'approved')
  ↓
If REJECTED:
  → Update ProspectiveStudent (status: 'rejected')
  ↓
Student Added to Class & School
Enrollment Number Generated
```

---

## API Endpoints

### 1. Get Prospective Students
**Endpoint**: `GET /api/prospective-students`

**Query Parameters**:
- `schoolId` (required) - School ID
- `status` (optional) - Filter by status: "pending", "approved", "rejected"
- `search` (optional) - Search query for name/email/parent

**Headers**:
- `x-user-id` (required) - Current user ID

**Response**:
```javascript
{
  prospectiveStudents: [
    { /* ProspectiveStudent documents */ }
  ],
  stats: {
    pending: 5,
    approved: 12,
    rejected: 2
  }
}
```

### 2. Create Prospective Student
**Endpoint**: `POST /api/prospective-students`

**Body**:
```javascript
{
  firstName: string,
  lastName: string,
  dateOfBirth: Date (optional),
  gender: string (optional),
  gradeLevel: string,
  classId: ObjectId (optional),
  schoolId: ObjectId,
  schoolType: string,
  picture: string (optional),
  parentId: ObjectId,
  parentName: string,
  parentEmail: string,
  parentPhone: string
}
```

### 3. Approve/Reject Prospective Student
**Endpoint**: `PUT /api/prospective-students`

**Body**:
```javascript
{
  prospectiveStudentId: ObjectId,
  action: "approve" | "reject",
  notes: string (optional, for approval),
  rejectionReason: string (for rejection)
}
```

---

## UI/UX Features

### Professional Design Elements
✅ **Color-Coded Status Badges**
- 🟨 Pending: Yellow (#fbbf24)
- 🟩 Approved: Green (#10b981)
- 🟥 Rejected: Red (#ef5350)

✅ **Responsive Layout**
- Works on mobile, tablet, and desktop
- Grid-based statistics
- Scrollable table on small screens

✅ **Interactive Modals**
- Beautiful gradient headers
- Smooth animations
- Confirmation dialogs before actions

✅ **Visual Feedback**
- Loading states with spinners
- Toast notifications for success/error
- Disabled states during processing
- Hover effects on interactive elements

✅ **Accessibility**
- Clear labels and instructions
- Proper color contrast
- Icon indicators for status
- Keyboard navigation support

---

## Student Approval Workflow Example

### Example Scenario:
1. **Parent (Sarah) registers** with two children:
   - Child 1: "Ahmed Ali" (Class: KG-A, Grade: 5-6 years)
   - Child 2: "Zainab Ali" (Class: KG-A, Grade: 5-6 years)

2. **OTP Verification**:
   - Sarah enters OTP
   - Two ProspectiveStudent records created automatically

3. **School Leader views dashboard**:
   - Sees 2 pending students under "Pending Review" (statistics: 2)
   - Filters by "Pending" status
   - Views detailed information for each student

4. **Approval Process**:
   - School Leader clicks "Approve" for Ahmed Ali
   - Adds optional note: "Good fit for the school"
   - System generates: Enrollment No. `KIDSTU-000001`
   - Ahmed Ali becomes active student in the system
   - School Leader clicks "Reject" for Zainab Ali
   - Adds reason: "Age group does not match class requirement"
   - Zainab Ali remains in prospective list

5. **Result**:
   - Ahmed Ali: Active student with enrollment number
   - Zainab Ali: Rejected status with reason recorded

---

## Error Handling

### Registration Errors:
- ❌ Email already registered
- ❌ Passwords do not match
- ❌ Invalid school selection for teacher/parent
- ❌ Missing required fields

### OTP Verification Errors:
- ❌ Invalid OTP format
- ❌ Expired OTP
- ❌ Maximum attempts exceeded
- ❌ OTP already verified

### Prospective Student Errors:
- ❌ Access denied (wrong role)
- ❌ Invalid prospective student ID
- ❌ Prospective student not found
- ❌ Enrollment number generation failed

---

## Environment Variables Required

```bash
# Email Configuration
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=info@kiddiescheck.org
BREVO_SENDER_NAME=Kiddies Check Team

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# Admin Email
ADMIN_EMAIL=admin@kiddiescheck.org
```

---

## Summary

This professional prospective students workflow ensures:

✅ **Quality Control**: All student registrations are reviewed before acceptance
✅ **Admin Oversight**: Admin/School-Leader/Learning-Specialist have complete control
✅ **Enrollment Management**: Automatic enrollment number generation
✅ **Professional UI**: Beautiful, responsive interface
✅ **Data Integrity**: Proper validation at each step
✅ **User Experience**: Clear communication and confirmation dialogs
✅ **Audit Trail**: All approvals/rejections are recorded

The system is production-ready and provides a seamless experience for both parents registering students and administrators managing approvals.
