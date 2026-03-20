# School Member System Documentation

## Overview

This system allows schools to invite and manage members (teachers, parents, staff) with role-based access control. Each school's data is isolated and only accessible to members of that school.

## Key Features

- ✅ School-based member management
- ✅ Role-based access control (School Leader, Teacher, Parent, Staff)
- ✅ Email-based invitations
- ✅ Permission management per member
- ✅ Member activity tracking
- ✅ Data isolation per school

## Database Models

### 1. School Model (`src/app/server/models/School.js`)

Represents a school institution.

**Fields:**

- `name` - School name (required, unique)
- `email` - School email (required, unique)
- `phone` - Contact phone
- `location` - School location
- `model` - School model/type (e.g., public, private)
- `logo` - School logo URL
- `principal` - Reference to User (school principal)
- `approvalStatus` - Admin approval status (pending, approved, rejected)
- `numberOfTeachers` - Count of teachers
- `numberOfStudents` - Count of students
- `isActive` - Active/inactive status

### 2. SchoolMember Model (`src/app/server/models/SchoolMember.js`)

Represents membership of a user in a school.

**Key Fields:**

- `school` - Reference to School (required)
- `user` - Reference to User (required)
- `role` - Role in school: `school-leader`, `teacher`, `parent`, `staff`
- `status` - Membership status: `invited`, `active`, `inactive`, `removed`
- `permissions` - Array of granted permissions
- `invitationToken` - Token for new user invitations
- `invitedBy` - Reference to inviting user
- `acceptedAt` - When invitation was accepted
- `lastAccessAt` - Last access timestamp

**Unique Constraint:** One user can only have one membership per school

### 3. User Model (Updated)

Added `schoolId` field to reference the primary school.

```javascript
schoolId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'School',
  index: true,
}
```

## API Endpoints

### POST `/api/school/invite-member`

Invite a member to join the school.

**Request:**

```json
{
  "schoolId": "school-id-here",
  "email": "member@example.com",
  "role": "teacher",
  "permissions": ["view_students", "edit_students"]
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Invitation sent to member@example.com",
  "data": {
    "schoolMember": {
      "id": "member-id",
      "school": "school-id",
      "email": "member@example.com",
      "role": "teacher",
      "status": "invited",
      "invitationType": "new-user"
    }
  }
}
```

### GET `/api/school/invite-member?schoolId={schoolId}&status={status}`

Get members of a school.

**Query Parameters:**

- `schoolId` - School ID (required)
- `status` - Filter by status: `active`, `invited`, `inactive` (optional)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "members": [
      {
        "_id": "member-id",
        "school": "school-id",
        "user": {
          "_id": "user-id",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        },
        "role": "teacher",
        "status": "active",
        "permissions": ["view_students"],
        "createdAt": "2024-03-19T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "pages": 3
    }
  }
}
```

### PUT `/api/school/members/{id}`

Update a member (role, permissions, status).

**Request:**

```json
{
  "role": "school-leader",
  "permissions": ["view_students", "edit_students", "manage_members"],
  "status": "active"
}
```

### DELETE `/api/school/members/{id}`

Remove a member from school.

### POST `/api/school/invitation/accept`

Accept a school invitation.

**Request:**

```json
{
  "memberId": "member-id",
  "userId": "user-id"
}
```

## Frontend Components

### 1. Invite Member Page (`src/app/dashboard/invite-member/page.js`)

- Form to invite new members
- List of current members with filters (active, invited, inactive)
- Ability to edit roles and remove members
- Shows member status and join date

### 2. School Members Page (`src/app/dashboard/school-members/page.js`)

- Overview statistics (total, active, pending)
- Members grouped by role
- CSV export functionality
- Activity tracking

## Server Utilities

### School Access Control (`src/app/server/utils/schoolAccessControl.js`)

Helper functions to manage school access:

```javascript
// Check if user is member of school
await getUserSchoolMembership(userId, schoolId);

// Get all schools a user belongs to
await getUserSchools(userId);

// Get school members by role
await getSchoolMembersByRole(schoolId, role);

// Check if user has permission
await userHasSchoolPermission(userId, schoolId, permission);

// Verify school access (throws error if no access)
await verifySchoolAccess(userId, schoolId);

// Get user's primary school
await getUserPrimarySchool(userId);
```

## Client Utilities

### School Member API (`src/app/utils/schoolMemberApi.js`)

Client-side functions:

```javascript
// Invite member
await inviteSchoolMember(schoolId, email, role, permissions);

// Fetch members
await fetchSchoolMembers(schoolId, status, page, limit);

// Update member
await updateSchoolMember(memberId, updates);

// Remove member
await removeSchoolMember(memberId);
```

## Usage Examples

### Inviting a Teacher

```javascript
import { inviteSchoolMember } from "@/app/utils/schoolMemberApi";

await inviteSchoolMember(schoolId, "teacher@school.com", "teacher", [
  "view_students",
  "edit_students",
]);
```

### Checking School Access (Server-side)

```javascript
import { verifySchoolAccess } from "@/app/server/utils/schoolAccessControl";

try {
  await verifySchoolAccess(userId, schoolId);
  // User has access, proceed with data operation
} catch (error) {
  // User doesn't have access
}
```

### Protecting Routes (Example)

```javascript
// In an API route
export async function GET(request, { params }) {
  const { schoolId } = params;
  const userId = request.headers.get("x-user-id");

  try {
    await verifySchoolAccess(userId, schoolId);
    // Fetch and return school data
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
```

## Permission Types

Available permissions:

- `view_students` - View student information
- `edit_students` - Modify student data
- `view_reports` - Access reports
- `manage_members` - Invite/remove members
- `edit_school_info` - Update school information
- `view_analytics` - Access analytics

## Default Permissions by Role

| Role          | Default Permissions         |
| ------------- | --------------------------- |
| school-leader | All permissions             |
| teacher       | view_students, view_reports |
| parent        | view_students (own child)   |
| staff         | view_students, view_reports |

## Email Notifications

Members receive invitation emails when:

1. Invited to join a school
2. Email includes action link to:
   - **New users:** Create account page with school context
   - **Existing users:** Direct to dashboard

## Data Isolation

All data operations must verify school membership:

```javascript
// Before returning student data
const members = await getUserSchools(userId);
if (!members.some((s) => s._id.equals(schoolId))) {
  throw new Error("Access denied");
}
```

## Security Considerations

1. ✅ Unique school-user membership constraint prevents duplicates
2. ✅ Status field controls active membership
3. ✅ Permission array allows granular access control
4. ✅ Invitation tokens are required for new users
5. ✅ All operations verify school access before proceeding

## Implementation Checklist

- [x] Create School model
- [x] Create SchoolMember model
- [x] Update User model with schoolId
- [x] Create invite member API endpoint
- [x] Create member management API endpoints
- [x] Create school access control utilities
- [x] Create member management frontend page
- [x] Create school members overview page
- [x] Add email invitation system
- [x] Set up permission checks

## Next Steps

1. **Dashboard Integration:** Update dashboard to filter data by school
2. **Student Management:** Implement student data isolation per school
3. **Reporting:** Create school-specific reports
4. **Analytics:** Track member activity per school
5. **Admin Panel:** Create admin controls for managing schools
