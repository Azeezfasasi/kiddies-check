# Parent Assignment & Feedback System - Setup Guide

## Quick Start

### 1. Database Migration

Ensure your MongoDB database includes the new models and fields:

```javascript
// Make sure these models are imported in your app
import Student from "@/app/server/models/Student";
import Feedback from "@/app/server/models/Feedback";
```

The Student model has been updated with:

- `parent`: ObjectId reference to parent user
- `parentAssignedAt`: Assignment timestamp
- `parentAssignedBy`: User who assigned the parent

### 2. Environment Setup

No additional environment variables needed. The feature uses existing authentication.

### 3. File Structure

Created/Updated files:

```
kiddies-check/
├── src/app/
│   ├── api/
│   │   ├── teacher/
│   │   │   ├── students/[id]/parent/route.js        [NEW]
│   │   │   ├── parents/route.js                     [NEW]
│   │   │   └── feedback/                            [NEW]
│   │   │       ├── route.js
│   │   │       └── [id]/route.js
│   │   └── parent/
│   │       └── students/route.js                    [NEW]
│   ├── server/models/
│   │   ├── Student.js                               [UPDATED]
│   │   └── Feedback.js                              [NEW]
│   ├── components/
│   │   ├── ParentAssignmentModal.js                 [NEW]
│   │   ├── StudentFeedbackPanel.js                  [NEW]
│   │   ├── ParentProfileModal.js                    [NEW]
│   │   └── StudentModal.js                          [UNCHANGED]
│   └── dashboard/
│       ├── all-students/page.js                     [UPDATED]
│       └── my-children/page.js                      [NEW]
└── docs/
    └── PARENT_ASSIGNMENT_FEEDBACK_SYSTEM.md         [NEW]
```

### 4. Database Indexes

The following indexes are automatically created by Mongoose:

```javascript
// Student indexes
studentSchema.index({ parent: 1 });
studentSchema.index({ school: 1, parent: 1 });

// Feedback indexes
feedbackSchema.index({ student: 1, school: 1 });
feedbackSchema.index({ author: 1 });
feedbackSchema.index({ school: 1, createdAt: -1 });
feedbackSchema.index({ student: 1, authorRole: 1 });
```

### 5. Role Configuration

The feature works with these roles:

```javascript
// Staff who can assign parents:
-admin -
  learning -
  specialist -
  school -
  leader -
  teacher -
  // Parents (new role already supported):
  parent;
```

Ensure your User registration/creation supports the `parent` role.

### 6. Testing Workflow

#### For Teachers/Admins:

1. Navigate to `/dashboard/all-students`
2. Click the "Parent" button (UserPlus icon) on any student
3. Search for a parent user
4. Select and assign
5. Parent will immediately appear in the student row

#### For Parents:

1. Login as parent user (ensure role is set to "parent")
2. Navigate to `/dashboard/my-children`
3. View assigned students
4. Click "Feedback" to see teacher comments
5. Add replies to engage with teachers

### 7. API Usage Examples

#### Assign Parent to Student

```bash
curl -X PUT http://localhost:3000/api/teacher/students/[studentId]/parent?schoolId=[schoolId] \
  -H "Content-Type: application/json" \
  -H "x-user-id: [userId]" \
  -d '{
    "parentId": "[parentUserId]"
  }'
```

#### Get Student Feedback

```bash
curl http://localhost:3000/api/teacher/feedback?studentId=[studentId]&schoolId=[schoolId] \
  -H "x-user-id: [userId]"
```

#### Add Feedback Comment

```bash
curl -X POST http://localhost:3000/api/teacher/feedback \
  -H "Content-Type: application/json" \
  -H "x-user-id: [userId]" \
  -d '{
    "schoolId": "[schoolId]",
    "studentId": "[studentId]",
    "title": "Progress Update",
    "comment": "Great work this week!",
    "category": "academic",
    "rating": 5
  }'
```

#### Get Parent's Students

```bash
curl http://localhost:3000/api/parent/students?schoolId=[schoolId] \
  -H "x-user-id: [parentUserId]"
```

### 8. Frontend Integration

All components are ready to use. Just import them:

```javascript
import ParentAssignmentModal from "@/app/components/ParentAssignmentModal";
import StudentFeedbackPanel from "@/app/components/StudentFeedbackPanel";
import ParentProfileModal from "@/app/components/ParentProfileModal";
```

### 9. Styling

The feature uses:

- Tailwind CSS for styling
- Lucide React for icons
- React Hot Toast for notifications

All styling is production-ready and professional.

### 10. Permissions Reference

| Action               | Admin        | Learning Specialist | School Leader | Teacher      | Parent       |
| -------------------- | ------------ | ------------------- | ------------- | ------------ | ------------ |
| Assign Parent        | ✅           | ✅                  | ✅            | ✅           | ❌           |
| View All Students    | ✅           | ✅                  | ✅            | ✅           | ❌           |
| View Own Children    | ❌           | ❌                  | ❌            | ❌           | ✅           |
| Create Feedback      | ✅           | ✅                  | ✅            | ✅           | ✅           |
| View Feedback        | ✅           | ✅                  | ✅            | ✅           | Own Children |
| Reply to Feedback    | ✅           | ✅                  | ✅            | ✅           | ✅           |
| Edit/Delete Feedback | Author/Admin | Author/Admin        | Author/Admin  | Author/Admin | Author/Admin |

### 11. Common Issues & Solutions

**Issue: Parent not showing in assignment modal**

- Solution: Verify parent user exists with `role: "parent"` and `isActive: true`

**Issue: Parent can't see their children**

- Solution: Verify child is properly assigned to parent and `isActive: true`

**Issue: Feedback not appearing**

- Solution: Check that student is assigned to parent, and verify school/student relationship

**Issue: API returns 403 Forbidden**

- Solution: Check user role and school access permissions

### 12. Next Steps

1. Test all user workflows
2. Customize styling if needed
3. Add email notifications (optional)
4. Set up analytics tracking (optional)
5. Configure backup/disaster recovery

### 13. Performance Considerations

- API endpoints are optimized with proper indexing
- Population queries only include necessary fields
- Large result sets are limited (max 100 feedback items)
- Search queries use regex with case-insensitive matching

### 14. Customization Options

You can customize:

**Parent Search Fields** (in `/api/teacher/parents`):

```javascript
searchQuery = {
  $or: [
    { firstName: { $regex: search, $options: "i" } },
    { lastName: { $regex: search, $options: "i" } },
    { email: { $regex: search, $options: "i" } },
    { phone: { $regex: search, $options: "i" } },
  ],
};
```

**Feedback Categories** (in Feedback model):

```javascript
enum: ["academic", "behavior", "attendance", "personal", "health", "general"];
```

**Rating System** (1-5 stars, optional):

```javascript
rating: {
  type: Number,
  min: 1,
  max: 5,
}
```

## Support & Documentation

For more detailed information, see:

- `PARENT_ASSIGNMENT_FEEDBACK_SYSTEM.md` - Full feature documentation
- API endpoint comments in route files
- Component prop documentation in JSDoc comments

---

**Version**: 1.0
**Last Updated**: March 2026
**Status**: Production Ready
