# School Parents Management Component - Documentation

## Overview

This is a beautiful, professional component for managing school parents with full CRUD operations and additional features like viewing children, messaging, and account status management.

## Features Implemented

### 1. **Display Parents List**

- Beautiful grid/list view with responsive design
- Display parent information: name, email, phone, avatar
- Show number of children assigned to each parent
- Display parent status (Active/Disabled)

### 2. **View Parent Details**

- Modal popup with comprehensive parent information
- Display contact information (email, phone)
- Show professional information (company, department, position)
- Display account information (member since, last login)
- Clean, organized layout with icon indicators

### 3. **View Children**

- Modal showing all students assigned to a parent
- Display child information: name, class, gender, email, date of birth
- Show child status (Active/Inactive)
- Beautiful card layout for each child
- Total count of children

### 4. **Edit/Update Parent Details**

- Form modal for updating parent information
- Fields: first name, last name, email, phone, company, department, position
- Form validation with error messages
- API integration for updating parent data
- Success/error toast notifications

### 5. **Message Parents**

- Dedicated modal for sending messages
- Subject and message fields with validation
- Quick message templates for common scenarios:
  - Attendance Reminder
  - Academic Progress Update
  - Behavior Notice
  - Meeting Request
- Character and word count tracking
- Ready for actual email/messaging API integration

### 6. **Disable Parents**

- Toggle parent account status (active/disabled)
- Confirmation modal before disabling
- Disabled parents cannot access their accounts
- Real-time status updates in the list

### 7. **Delete Parents**

- Permanently remove parent accounts
- Destructive action confirmation with warning modal
- Non-recoverable action
- Real-time list refresh after deletion

### 8. **Search & Filter**

- Search by name, email, or phone number
- Filter by status: All, Active, Disabled
- Sort by: Name or Date
- Real-time filtering and sorting

### 9. **Responsive Design**

- Mobile-friendly with collapsible action menu
- Desktop view with action buttons
- Works seamlessly on all screen sizes
- Tailwind CSS with custom styling

### 10. **Authorization**

- Protected route - only accessible to admin, school-leader, and learning-specialist
- School leaders only see parents from their school
- Header-based user identification

## File Structure

```
src/
├── app/
│   ├── dashboard/
│   │   └── school-parents/
│   │       └── page.js                 # Main component
│   └── components/
│       ├── ParentDetailsModal.js        # View parent details
│       ├── EditParentModal.js           # Edit parent form
│       ├── ParentChildrenModal.js       # View children list
│       ├── MessageParentModal.js        # Send message
│       └── ConfirmActionModal.js        # Confirmation dialog
```

## Component Files Details

### 1. **page.js** (Main Component)

- Manages overall state and data flow
- Fetches parents list with children count
- Implements search, filter, and sort functionality
- Handles all modal state management
- Coordinates API calls for all operations

### 2. **ParentDetailsModal.js**

- Read-only view of parent information
- Displays formatted dates
- Shows contact and professional information
- Clean UI with section headers

### 3. **EditParentModal.js**

- Form for editing parent details
- Field validation before submission
- Error message display
- Loading state during API call
- Calls onSave callback on success

### 4. **ParentChildrenModal.js**

- Fetches children for specific parent
- Loading and error states
- Card-based layout for each child
- Displays child details with status
- Shows total count of children

### 5. **MessageParentModal.js**

- Subject and message form
- Quick template buttons
- Form validation
- Character/word counter
- Ready for API integration

### 6. **ConfirmActionModal.js**

- Generic confirmation dialog
- Supports destructive and non-destructive actions
- Loading state during action
- Clear messaging for user

## API Endpoints Used

### Existing Endpoints

1. **GET /api/teacher/parents**
   - Fetch list of parents in a school
   - Query: `schoolId`, `search` (optional)
   - Header: `x-user-id`
   - Response: `{ parents: [...] }`

2. **GET /api/teacher/students** (UPDATED)
   - Fetch students by parent (new feature)
   - Query: `schoolId`, `parentId`, `classId` (optional)
   - Header: `x-user-id`
   - Response: `{ data: [...] }`

3. **PUT /api/users/[userId]**
   - Update user information
   - Method: PUT
   - Header: `x-user-id`
   - Body: `{ firstName, lastName, email, phone, company, department, position }`

4. **PUT /api/users/[userId]/status**
   - Toggle user status (disable/enable)
   - Method: PUT
   - Header: `x-user-id`
   - Body: `{ isActive: boolean }`

5. **DELETE /api/users/[userId]**
   - Delete user account
   - Method: DELETE
   - Header: `x-user-id`

## Data Flow

```
Page Load
  ↓
Fetch Parents List (from /api/teacher/parents)
  ↓
For each parent: Fetch children count (from /api/teacher/students?parentId=)
  ↓
Enrich parents data with children count
  ↓
Display in list with search/filter/sort
  ↓
User Actions (View, Edit, Message, Disable, Delete)
  ↓
Update local state and refresh display
```

## Usage Example

```jsx
// The component is already set up at:
// /dashboard/school-parents

// Usage:
import SchoolParentList from "@/app/dashboard/school-parents/page";

// Then navigate to /dashboard/school-parents in your app
```

## Authentication & Authorization

The component uses:

- **localStorage**: Stores `activeSchoolId`, `userId`, `userRole`
- **ProtectedRoute**: Restricts access to admin, school-leader, and learning-specialist roles
- **x-user-id Header**: For all API requests
- **Bearer Token**: Available from localStorage if needed

## Styling

- **Framework**: Tailwind CSS
- **Colors**: Blue (primary), Green (success), Orange (warning), Red (danger)
- **Icons**: Lucide React
- **Responsive**: Mobile-first approach with md: and lg: breakpoints

## State Management

Local state includes:

- `parents`: Full list of parents with children count
- `filteredParents`: Filtered and sorted parents for display
- `selectedParent`: Currently selected parent for modals
- Modal visibility states: `showDetailsModal`, `showEditModal`, etc.
- UI states: `loading`, `expandedRows`, `searchQuery`, `filterStatus`, `sortBy`

## Future Enhancements

1. **Messaging Integration**: Connect to actual email/SMS API
   - Implement `/api/mail/send-to-parent` endpoint
   - Add delivery status tracking

2. **Bulk Operations**:
   - Select multiple parents for bulk messaging
   - Bulk status updates
   - Bulk export to CSV

3. **Advanced Filtering**:
   - Filter by children count
   - Filter by registration date range
   - Filter by children class

4. **Communication History**:
   - View past messages sent to parents
   - Message templates management
   - Scheduled message sending

5. **Analytics**:
   - Parent engagement metrics
   - Message delivery rates
   - Response rates tracking

6. **Notifications**:
   - Real-time parent alerts
   - Push notifications integration
   - Email notification preferences

## Common Issues & Solutions

### Issue: "School information not found"

**Solution**: Ensure `activeSchoolId` is stored in localStorage when switching schools

### Issue: Parents list is empty

**Solution**: Check if parents exist in database and are assigned to the school

### Issue: Cannot edit parent details

**Solution**: Verify user has admin or school-leader role

### Issue: Message not sending

**Solution**: Implement actual messaging API endpoint in `/api/mail/send-to-parent`

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design supported

## Performance Considerations

- Uses async/await for API calls
- Parallel fetching of children count
- Client-side filtering and sorting (performant for typical list sizes)
- Modals are rendered conditionally to minimize DOM bloat

## Security Notes

- All API calls require `x-user-id` header
- User role is verified server-side
- School access is validated server-side
- Delete operations are irreversible - use with caution

## Testing Checklist

- [ ] Display parents list
- [ ] Search by name
- [ ] Search by email
- [ ] Filter by status
- [ ] Sort by name
- [ ] Sort by date
- [ ] View parent details
- [ ] View parent children
- [ ] Edit parent information
- [ ] Send message to parent
- [ ] Disable parent account
- [ ] Delete parent account
- [ ] Mobile responsiveness
- [ ] Error handling

## Support & Troubleshooting

For issues or questions:

1. Check browser console for errors
2. Verify API endpoints are responding correctly
3. Check localStorage for required data
4. Verify user has appropriate role and school access
5. Check network tab in browser DevTools for failed requests
