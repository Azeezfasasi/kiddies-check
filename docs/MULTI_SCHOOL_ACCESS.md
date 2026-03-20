# Multi-School Access System for Admins & Learning Specialists

## Overview

This system allows **admin** and **learning-specialist** users to manage and access multiple schools, while regular users (teacher, parent, staff) remain restricted to their assigned school.

## How It Works

### User Model Changes

Each user now has:

```javascript
schoolId: ObjectId; // Primary/home school (all users)
managedSchools: [ObjectId]; // Schools they can manage (admins only)
```

**For Regular Users:**

- `schoolId` = their only accessible school
- `managedSchools` = empty array

**For Admins/Learning-Specialists:**

- `schoolId` = optional (their primary school, if registered as one)
- `managedSchools` = array of school IDs they manage

### Access Check Methods

```javascript
// User model method
user.canAccessSchool(schoolId); // Returns boolean

// Utility function
canUserAccessSchool(user, schoolId); // Returns boolean

// With membership check
canUserAccessSchoolWithMembership(userId, schoolId, userRole, managedSchools);
```

## API Endpoints

### Switch School Endpoint

**POST `/api/school/switch`**

Allows admin/learning-specialist to switch their active school context.

**Request:**

```javascript
{
  schoolId: "507f1f77bcf86cd799439011";
}
```

**Response:**

```javascript
{
  success: true,
  message: "Switched to School Name",
  data: {
    activeSchoolId: "507f1f77bcf86cd799439011",
    school: {
      id: "507f1f77bcf86cd799439011",
      name: "School Name",
      email: "admin@school.com",
      location: "City, State"
    }
  }
}
```

### Get Accessible Schools

**GET `/api/school/switch`**

Get list of all schools the user can access.

**Response:**

```javascript
{
  success: true,
  data: {
    schools: [
      {
        _id: "507f1f77bcf86cd799439011",
        name: "School 1",
        email: "admin@school1.com",
        location: "City 1"
      },
      {
        _id: "507f1f77bcf86cd799439012",
        name: "School 2",
        email: "admin@school2.com",
        location: "City 2"
      }
    ],
    currentRole: "admin",
    primarySchoolId: "507f1f77bcf86cd799439011"
  }
}
```

## UI Components

### School Switcher Component

**Location:** `src/app/components/SchoolSwitcher.js`

Use in dashboard header for admins/learning-specialists:

```javascript
import { SchoolSwitcher } from "@/app/components/SchoolSwitcher";

export default function Dashboard() {
  const [currentSchoolId, setCurrentSchoolId] = useState("");
  const [userRole, setUserRole] = useState("");

  return (
    <nav>
      <SchoolSwitcher
        currentSchoolId={currentSchoolId}
        isAdmin={["admin", "learning-specialist"].includes(userRole)}
        onSchoolSwitch={(newSchoolId) => {
          setCurrentSchoolId(newSchoolId);
        }}
      />
    </nav>
  );
}
```

## Setup Instructions

### For Admins Managing Multiple Schools

1. **Create Admin User:**

   ```javascript
   const admin = new User({
     firstName: "John",
     lastName: "Admin",
     email: "john@admin.com",
     password: "...",
     role: "admin",
     // schoolId is optional
     managedSchools: [schoolId1, schoolId2, schoolId3],
   });
   ```

2. **For Existing Admins:**
   Update their record to add schools:

   ```javascript
   await User.updateOne(
     { _id: adminId },
     { $set: { managedSchools: [schoolId1, schoolId2, schoolId3] } },
   );
   ```

3. **Admin Can Switch:**
   - Click "School Switcher" component in dashboard
   - Select a school from the list
   - System updates `localStorage.activeSchoolId`
   - Page reloads with new school's data

### For Regular Users (No Changes)

Regular users continue to work as before:

- Their `schoolId` is their only accessible school
- No school switching capability
- All API calls use their primary schoolId

## Data Isolation

When implementing data endpoints, use the updated access control:

```javascript
import { canUserAccessSchoolWithMembership } from "@/app/server/utils/schoolAccessControl";

export async function GET(request) {
  const userId = request.headers.get("x-user-id");
  const schoolId = request.nextUrl.searchParams.get("schoolId");

  // Fetch user to get their role and managedSchools
  const user = await User.findById(userId);

  // Verify access using new hybrid method
  const hasAccess = await canUserAccessSchoolWithMembership(
    userId,
    schoolId,
    user.role,
    user.managedSchools,
  );

  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Fetch and return school data
  const data = await Model.find({ school: schoolId });
  return NextResponse.json({ data });
}
```

## Frontend Integration

### Update Invite Member Page

Already supported - admins can invite members to any school they manage.

### Update School Members Page

Already supported - when viewing school members, it uses `currentSchoolId` from localStorage or URL params.

## Security Considerations

1. **Always verify** user has access to requested school
2. **Use `managedSchools`** for admin access, not unlimited access
3. **Validate schoolId** in all API requests
4. **Never trust client selectedSchoolId** - always verify server-side
5. **Log school switches** for audit trail

## Troubleshooting

| Issue                             | Solution                                        |
| --------------------------------- | ----------------------------------------------- |
| Admin can't see school switcher   | Check `managedSchools` array is populated       |
| Switch fails with "Access denied" | Verify schoolId is in `managedSchools` array    |
| Wrong school data loading         | Check localStorage.activeSchoolId is being used |
| Old data showing                  | Clear browser cache and reload                  |

## Database Queries

### Find all admins managing a school:

```javascript
User.find({
  role: "admin",
  managedSchools: schoolId,
});
```

### Find all schools an admin manages:

```javascript
const admin = await User.findById(adminId).populate("managedSchools");
console.log(admin.managedSchools);
```

### Add school to admin's managed list:

```javascript
User.updateOne({ _id: adminId }, { $push: { managedSchools: schoolId } });
```

### Remove school from admin's managed list:

```javascript
User.updateOne({ _id: adminId }, { $pull: { managedSchools: schoolId } });
```
