# Parent Assignment & Feedback System

## Overview

This comprehensive feature enables school leaders, admins, and teachers to assign parents/guardians to students, and allows parents to view their children's progress and engage with school staff through a feedback system.

## Features

### For School Staff (Admins, School Leaders, Teachers)

1. **Parent Assignment**
   - Assign/reassign parents to students from the All Students page
   - Search and select parents by name, email, or phone
   - View currently assigned parent for each student
   - Remove parent assignment when needed

2. **Student List Enhancement**
   - Display assigned parent in the student table
   - Parent information includes name and email
   - Color-coded parent avatars for easy identification
   - Responsive design (table on desktop, cards on mobile)

3. **Professional UI**
   - Beautiful modal for parent assignment with search functionality
   - Clean, intuitive interface with proper role-based permissions
   - Toast notifications for user feedback

### For Parents

1. **My Children Dashboard** (`/dashboard/my-children`)
   - View all assigned children
   - Display student information (class, enrollment number, gender)
   - See enrollment date and current status
   - Quick access to details and feedback

2. **Student Details Viewing**
   - Access comprehensive student information
   - Track attendance and progress
   - View academic assessments

3. **Feedback & Communication**
   - View feedback from teachers and school staff
   - Add comments and questions about child's progress
   - Reply to teacher feedback in threaded conversations
   - Categorized feedback (academic, behavior, attendance, health, etc.)
   - Star ratings from teachers when available

## Database Schema

### Student Model Updates

```javascript
{
  parent: ObjectId,              // Reference to parent user
  parentAssignedAt: Date,        // When parent was assigned
  parentAssignedBy: ObjectId,    // Who assigned the parent
}
```

**Indexes Added:**

- `{ parent: 1 }` - For parent to view their students
- `{ school: 1, parent: 1 }` - Combined for efficient queries

### New Feedback Model

```javascript
{
  student: ObjectId,             // Reference to student
  school: ObjectId,              // Reference to school
  author: ObjectId,              // User who created feedback
  authorRole: String,            // Role of author (teacher, parent, admin, etc.)
  category: String,              // Type of feedback (academic, behavior, etc.)
  title: String,                 // Feedback title
  comment: String,               // Main feedback content
  rating: Number,                // 1-5 star rating
  attachments: Array,            // File attachments
  replies: Array,                // Threaded replies
  isVisible: Boolean,            // Visibility control
  createdAt: Date,
  updatedAt: Date
}
```

## API Routes

### Parent Assignment

**GET** `/api/teacher/students/[id]/parent`

- Get currently assigned parent for a student

**PUT** `/api/teacher/students/[id]/parent`

- Assign or remove a parent from a student
- Request body: `{ parentId: ObjectId | null }`

### Parent Listing

**GET** `/api/teacher/parents`

- Search for parents by name, email, phone
- Query params: `schoolId`, `search`
- Returns active parents matching criteria

### Feedback Management

**GET** `/api/teacher/feedback`

- Get all feedback for a student or across school
- Query params: `schoolId`, `studentId`
- Role-based access control applied automatically

**POST** `/api/teacher/feedback`

- Create new feedback entry
- Body: `{ schoolId, studentId, title, comment, category, rating }`

**GET/PUT/DELETE** `/api/teacher/feedback/[id]`

- Get, update, or delete feedback
- Only author or admin can update/delete

**PATCH** `/api/teacher/feedback/[id]`

- Add replies to feedback
- Action: `"add-reply"`

### Parent Student Access

**GET** `/api/parent/students`

- Get all students assigned to the authenticated parent
- Query params: `schoolId`
- Only parents can access their own data

## Components

### ParentAssignmentModal

- Beautiful modal for assigning parents to students
- Search functionality with real-time filtering
- Current parent display
- Permission-based workflows

**Props:**

```javascript
{
  (studentData, // Student object to assign parent to
    schoolId, // Current school
    userId, // Current user ID
    onClose, // Close callback
    onAssign); // Assignment success callback
}
```

### StudentFeedbackPanel

- Display feedback from teachers and staff
- Add comments as parent
- Reply to feedback with threading
- Category badges and star ratings

**Props:**

```javascript
{
  (studentId,
    studentName,
    schoolId,
    userId,
    initialFeedback,
    feedbackLoading,
    onClose);
}
```

### ParentProfileModal

- View parent account details
- Edit parent information
- Account status display
- Professional UI for staff use

## Pages

### All Students Page (`/dashboard/all-students`)

**Changes:**

- Added "Parent" column in student table
- New "Assign Parent" button (UserPlus icon)
- Parent information displayed with avatar and email
- Mobile-optimized parent assignment button

### My Children Dashboard (`/dashboard/my-children`)

**New Page:**

- Cards showing each assigned student
- Quick access to student details
- Feedback view button for communications
- Enrollment date display
- Class information

## Permissions & Access Control

### Role-Based Access

**Admin & Learning Specialist:**

- Can assign/remove parents for any student in any school
- Can view all feedback
- Can see all students

**School Leader:**

- Can assign/remove parents for students in their school
- Can view all feedback in their school
- Can see all students in their school

**Teacher:**

- Can assign/remove parents for their students
- Can create feedback for students
- Can view feedback for students they teach

**Parent:**

- Can only view assigned children
- Can view feedback for their children
- Can add comments/replies to feedback
- Cannot access other parents' information

## Usage Examples

### Assigning a Parent (Teacher/Admin)

1. Go to Students Management page
2. Click the "Parent" button (UserPlus icon) for a student
3. Search for the parent by name/email/phone
4. Select the parent from the list
5. Click "Assign Parent"

### Viewing Child Progress (Parent)

1. Go to "My Children" from dashboard
2. Click on a student card
3. View details or click "Feedback" to see comments

### Adding Feedback (Teacher/Admin)

1. Create feedback through StudentFeedbackPanel
2. Set category, title, and comment
3. Optionally add star rating
4. Parents will see this immediately

### Replying to Feedback (Parent)

1. Open feedback item
2. Scroll to "Add a Reply" section
3. Type response
4. Click "Reply"
5. Teachers will be notified of reply

## Security Features

1. **Role-Based Access Control**
   - Every endpoint validates user role
   - Parents can only see their own children's data
   - Teachers can only manage students in their school

2. **Data Isolation**
   - School-level filtering on all queries
   - Students filtered by school
   - Feedback filtering by authorization level

3. **Timestamp Tracking**
   - Parent assignment tracks when and by whom
   - All feedback has creation timestamps
   - Activity audit trail maintained

## UI/UX Features

### Professional Design

- Gradient avatars with contrasting colors
- Smooth hover and transition effects
- Responsive layout (mobile, tablet, desktop)
- Intuitive icons from lucide-react

### Accessibility

- Semantic HTML structure
- Clear labels and instructions
- Toast notifications for feedback
- Error handling and user guidance

### Performance

- Pagination/limits on API queries
- Efficient database indexing
- Populated relationships to reduce N+1 queries
- Client-side search filtering

## Database Indexes for Performance

```javascript
// Student Model
studentSchema.index({ parent: 1 });
studentSchema.index({ school: 1, parent: 1 });

// Feedback Model
feedbackSchema.index({ student: 1, school: 1 });
feedbackSchema.index({ author: 1 });
feedbackSchema.index({ school: 1, createdAt: -1 });
feedbackSchema.index({ student: 1, authorRole: 1 });
```

## Future Enhancements

1. **Notifications**
   - Email notifications when parent is assigned
   - Alerts for new feedback
   - Comment reply notifications

2. **Advanced Reporting**
   - Parent engagement reports
   - Feedback analytics
   - Achievement tracking

3. **File Attachments**
   - Upload documents to feedback
   - File sharing between parents and staff
   - Assignment dropbox

4. **Multiple Parents**
   - Support for multiple parents per student
   - Role definitions (primary, secondary)
   - Permission levels per parent

5. **Parent-to-Parent Messaging**
   - Direct communication with other parents
   - Class group chat
   - Event coordination

## Troubleshooting

### Parent Not Appearing in Assignment List

- Verify parent user exists with role: "parent"
- Check parent isActive status is true
- Ensure search query uses correct name/email

### Feedback Not Showing for Parent

- Verify student is assigned to parent
- Check feedback isVisible flag
- Verify student belongs to correct school

### Performance Issues

- Ensure database indexes are created
- Check for N+1 query problems
- Monitor API response times

## Testing Checklist

- [ ] Create student and assign parent
- [ ] View student list with parent column
- [ ] Remove parent assignment
- [ ] Parent can view assigned children
- [ ] Teacher creates feedback
- [ ] Parent views feedback
- [ ] Parent adds comment to feedback
- [ ] Teacher replies to parent comment
- [ ] Permissions prevent unauthorized access
- [ ] Mobile responsive on all pages
