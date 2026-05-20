# School Parents Component - Quick Start Guide

## Installation & Setup

### 1. Prerequisites

Make sure you have the following installed in your project:

- ✅ react-hot-toast
- ✅ lucide-react
- ✅ Next.js 13+
- ✅ Tailwind CSS

If not installed, run:

```bash
npm install react-hot-toast lucide-react
```

### 2. Files Created/Modified

The following files were created or modified:

#### New Files Created:

1. `src/app/components/ParentDetailsModal.js` - View parent details
2. `src/app/components/EditParentModal.js` - Edit parent information
3. `src/app/components/ParentChildrenModal.js` - View children assigned to parent
4. `src/app/components/MessageParentModal.js` - Send messages to parent
5. `src/app/components/ConfirmActionModal.js` - Generic confirmation dialog

#### Files Modified:

1. `src/app/dashboard/school-parents/page.js` - Main component
2. `src/app/api/teacher/students/route.js` - Added parentId filtering support

### 3. Quick Setup Checklist

```
✅ Copy all component files to src/app/components/
✅ Update page.js in src/app/dashboard/school-parents/
✅ Update students API route to support parentId parameter
✅ Ensure react-hot-toast is available in your project
✅ Ensure Tailwind CSS is configured
✅ Verify ProtectedRoute component exists
```

## How to Use

### Access the Component

1. **Navigate to School Parents Page**

   ```
   URL: http://localhost:3000/dashboard/school-parents
   ```

2. **Requirements**
   - Must be logged in as: admin, school-leader, or learning-specialist
   - Must have selected a school
   - School ID must be stored in localStorage as `activeSchoolId`

### Features Overview

#### 1. View Parents List

- Displays all parents in the selected school
- Shows: Name, Email, Phone, Children Count, Status
- Mobile-friendly collapsible actions

#### 2. Search Parents

```
Search by:
- First or Last Name (e.g., "John Smith")
- Email (e.g., "john@example.com")
- Phone number (e.g., "+1234567890")
```

#### 3. Filter & Sort

```
Filters:
- All Parents
- Active Parents Only
- Disabled Parents Only

Sorting:
- Sort by Name (A-Z)
- Sort by Date (Newest first)
```

#### 4. View Parent Details

```
Click: Eye Icon (📍 icon on desktop, View button on mobile)
Shows:
- Full name and avatar
- Contact information
- Professional details
- Account information
```

#### 5. View Children

```
Click: Users Icon (👥)
Shows:
- All children assigned to this parent
- Child name, class, gender, email, DOB
- Status (Active/Inactive)
- Total children count
```

#### 6. Edit Parent Information

```
Click: Edit Icon (✏️)
Can edit:
- First name, last name
- Email, phone number
- Company, department, position
- Form validation included
```

#### 7. Send Message

```
Click: Mail Icon (✉️)
Features:
- Subject line
- Message body (10+ characters)
- Quick templates for common scenarios
- Character and word count
- Ready for email API integration
```

#### 8. Disable Parent

```
Click: Lock Icon (🔒)
Action:
- Disables parent account
- Parent cannot login
- Confirmation required
- Status changes to "Disabled"
```

#### 9. Delete Parent

```
Click: Trash Icon (🗑️)
Action:
- Permanently deletes parent
- Confirmation required
- Status shows destructive warning
- Cannot be undone
```

## Testing Scenarios

### Scenario 1: Basic Navigation

1. ✅ Login as school-leader
2. ✅ Navigate to /dashboard/school-parents
3. ✅ Verify parents list loads
4. ✅ Verify page is responsive on mobile

### Scenario 2: Search & Filter

1. ✅ Type parent name in search
2. ✅ Verify list filters in real-time
3. ✅ Select "Active" in status filter
4. ✅ Select different sort options
5. ✅ Clear search and verify all parents return

### Scenario 3: View Operations

1. ✅ Click View Details icon on a parent
2. ✅ Verify details modal shows all information
3. ✅ Close modal and try another parent
4. ✅ Click View Children icon
5. ✅ Verify children list displays correctly

### Scenario 4: Edit Parent

1. ✅ Click Edit icon
2. ✅ Change email to invalid format
3. ✅ Verify validation error shows
4. ✅ Fix email
5. ✅ Update a field (e.g., phone)
6. ✅ Click Update Parent
7. ✅ Verify success toast appears
8. ✅ Verify change reflects in list

### Scenario 5: Message Parent

1. ✅ Click Message icon
2. ✅ Verify recipient shows correctly
3. ✅ Try clicking template button
4. ✅ Verify template populates subject/message
5. ✅ Type message and check character count
6. ✅ Click Send Message
7. ✅ Verify success toast

### Scenario 6: Disable Parent

1. ✅ Click Lock icon on active parent
2. ✅ Verify confirmation dialog shows
3. ✅ Click Disable button
4. ✅ Verify status changes to "Disabled" in list
5. ✅ Verify UI updates (button/status colors)

### Scenario 7: Delete Parent

1. ✅ Click Trash icon
2. ✅ Verify confirmation shows destructive warning
3. ✅ Click Delete button
4. ✅ Verify parent disappears from list
5. ✅ Verify success toast
6. ✅ Refresh page and verify parent is gone from database

### Scenario 8: Responsive Design

1. ✅ Test on desktop (1920px)
2. ✅ Test on tablet (768px)
3. ✅ Test on mobile (375px)
4. ✅ Verify collapsible menu works on mobile
5. ✅ Verify all modals are readable on small screens

## Sample Data for Testing

### Test Parent 1

```
Name: John Smith
Email: john.smith@example.com
Phone: +1 234-567-8900
Company: Tech Corp
Department: Engineering
Position: Senior Manager
Children: 2 (assigned students)
```

### Test Parent 2

```
Name: Sarah Johnson
Email: sarah.j@example.com
Phone: +1 987-654-3210
Company: Education Ltd
Department: Operations
Position: Coordinator
Children: 1 (assigned student)
```

## Environment Variables

Ensure these are in your `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Common Testing Issues

### Issue: No parents showing in list

**Solution**:

- Verify parents exist in database
- Check if parents are assigned to the selected school
- Verify activeSchoolId in localStorage
- Check browser console for API errors

### Issue: Modals not appearing

**Solution**:

- Verify modal component imports are correct
- Check for CSS conflicts with z-index
- Clear browser cache

### Issue: Edit not saving

**Solution**:

- Check if user has admin/school-leader role
- Verify x-user-id header is being sent
- Check API response in Network tab
- Verify form validation passes

### Issue: Children not loading

**Solution**:

- Verify students exist and are assigned to this parent
- Check API endpoint response format
- Verify schoolId and userId are correct

## Debugging Tips

### Enable console logging

Add to page.js:

```javascript
console.log("Parents:", parents);
console.log("Filtered Parents:", filteredParents);
console.log("Selected Parent:", selectedParent);
```

### Check localStorage

Open DevTools Console and run:

```javascript
console.log("School ID:", localStorage.getItem("activeSchoolId"));
console.log("User ID:", localStorage.getItem("userId"));
console.log("User Role:", localStorage.getItem("userRole"));
```

### Check API responses

Open DevTools Network tab and:

1. Look for calls to `/api/teacher/parents`
2. Check response status (should be 200)
3. Verify response body has parents array
4. Check `/api/teacher/students` calls for children count

## Performance Notes

- Initial page load fetches parents list
- For each parent, children count is fetched (parallel requests)
- Search, filter, sort happen client-side (no API calls)
- Modals load data on open (lazy loading)
- List can handle 100+ parents without issues

## Next Steps

1. ✅ Test all features with sample data
2. ✅ Integrate actual email/messaging API for sending messages
3. ✅ Add export to CSV functionality
4. ✅ Implement bulk operations (select multiple parents)
5. ✅ Add parent activity/engagement metrics
6. ✅ Create audit logs for all actions

## Support

If you encounter issues:

1. Check browser console for errors
2. Check Network tab in DevTools
3. Verify user role and permissions
4. Verify data exists in database
5. Check component imports and file paths
