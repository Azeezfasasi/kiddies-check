# Student Notebook Upload Feature - Implementation Guide

## Overview

This feature allows teachers/admins to upload pictures of student notebooks, and parents can view them through their child's dashboard. This enables better communication between teachers and parents about student progress and work quality.

## Features

✅ **Teachers/Admins Can:**
- Upload multiple notebook images for each student
- Add captions to images
- View all uploaded images
- Delete images when no longer needed

✅ **Parents Can:**
- View all notebook images uploaded by teachers
- See image captions and upload dates
- View images in fullscreen/lightbox mode
- See who uploaded the image

## Database Schema

### Student Model Updates

Added a new field to the Student model:

```javascript
notebookImages: [
  {
    _id: ObjectId,
    url: String,                 // Cloudinary image URL
    publicId: String,            // Cloudinary public ID
    caption: String,             // Optional caption
    uploadedAt: Date,            // When uploaded
    uploadedBy: ObjectId,        // Reference to User (teacher/admin)
  },
]
```

## API Endpoints

### GET /api/teacher/students/[studentId]/notebook-images
Fetch all notebook images for a student.

**Headers:**
- `x-user-id`: User ID (required)

**Response:**
```json
{
  "success": true,
  "notebookImages": [
    {
      "_id": "...",
      "url": "https://res.cloudinary.com/...",
      "publicId": "student-notebooks/...",
      "caption": "Math assignment",
      "uploadedAt": "2024-05-16T10:00:00Z",
      "uploadedBy": {
        "_id": "...",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ]
}
```

### POST /api/teacher/students/[studentId]/notebook-images
Upload notebook images for a student.

**Headers:**
- `x-user-id`: User ID (required)

**Body:**
FormData with:
- `files`: Multiple image files
- `captions`: Corresponding captions (optional, one per file)

**Response:**
```json
{
  "success": true,
  "message": "2 notebook image(s) uploaded successfully",
  "uploadedImages": [
    {
      "_id": "...",
      "url": "https://res.cloudinary.com/...",
      "publicId": "student-notebooks/...",
      "caption": "Math assignment",
      "uploadedAt": "2024-05-16T10:00:00Z",
      "uploadedBy": "..."
    }
  ]
}
```

### DELETE /api/teacher/students/[studentId]/notebook-images
Delete a notebook image.

**Headers:**
- `x-user-id`: User ID (required)
- `Content-Type`: application/json

**Body:**
```json
{
  "imageId": "..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notebook image deleted successfully"
}
```

## Components

### NotebookUploadModal (`src/app/components/NotebookUploadModal.js`)

Modal component for uploading notebook images.

**Props:**
- `studentId`: ID of the student
- `studentName`: Name of the student (for display)
- `schoolId`: School ID
- `userId`: Current user ID
- `onClose`: Callback when modal closes
- `onUploadSuccess`: Callback after successful upload

**Usage:**
```jsx
import NotebookUploadModal from '@/app/components/NotebookUploadModal';

<NotebookUploadModal
  studentId={studentId}
  studentName={studentName}
  schoolId={activeSchoolId}
  userId={userId}
  onClose={() => setShowNotebookModal(false)}
  onUploadSuccess={() => console.log('Uploaded!')}
/>
```

### StudentNotebookGallery (`src/app/components/StudentNotebookGallery.js`)

Gallery component for viewing notebook images (for parents).

**Props:**
- `studentId`: ID of the student
- `studentName`: Name of the student
- `userId`: Current user ID

**Usage:**
```jsx
import StudentNotebookGallery from '@/app/components/StudentNotebookGallery';

<StudentNotebookGallery
  studentId={studentId}
  studentName={studentName}
  userId={userId}
/>
```

## Integration Points

### Teachers/Admins - All Students Page

File: `src/app/dashboard/all-students/page.js`

- Added "Notebook" button (BookOpen icon) to student action buttons
- Opens `NotebookUploadModal` when clicked
- Available in both desktop and mobile views

### Parents - My Children Page

File: `src/app/dashboard/my-children/page.js`

- Added `StudentNotebookGallery` component to each child's card
- Displays notebook images directly on the parent's dashboard
- Shows image count and provides fullscreen preview

### Student Details Modal

File: `src/app/components/StudentDetailsModal.js`

- Integrated `StudentNotebookGallery` in the details view
- Parents can see images when viewing student details

## Usage Workflow

### For Teachers/Admins:

1. Navigate to Dashboard → All Students
2. Find the student and click the "Notebook" button (📖)
3. In the modal:
   - Click "Choose Images" to select notebook pictures
   - Optionally add captions for each image
   - Click "Upload" to save
   - View/manage existing images in the gallery
   - Delete images by clicking the trash icon

### For Parents:

1. Navigate to Dashboard → My Children
2. View your child's card
3. See "Notebook Gallery" section at the bottom
4. Click any image to view in fullscreen
5. Images show:
   - Caption (if added)
   - Upload date
   - Who uploaded it

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── teacher/
│   │       └── students/
│   │           └── [id]/
│   │               └── notebook-images/
│   │                   └── route.js          ← NEW API endpoint
│   ├── components/
│   │   ├── NotebookUploadModal.js           ← NEW component
│   │   ├── StudentNotebookGallery.js        ← NEW component
│   │   └── StudentDetailsModal.js           ← UPDATED
│   ├── dashboard/
│   │   ├── all-students/
│   │   │   └── page.js                      ← UPDATED
│   │   └── my-children/
│   │       └── page.js                      ← UPDATED
│   └── server/
│       └── models/
│           └── Student.js                   ← UPDATED (added notebookImages field)
```

## Dependencies

The feature uses:
- `next/image` - For image display
- `lucide-react` - For icons
- `react-hot-toast` - For notifications
- Cloudinary - For image storage (existing)

No new dependencies need to be installed.

## Cloudinary Configuration

Images are stored in Cloudinary under the `student-notebooks` folder.

Make sure your `.env` file has:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Error Handling

The implementation includes:
- File type validation (images only)
- Cloudinary upload error handling
- Graceful fallback if image can't load
- User-friendly error messages via toast notifications

## Performance Considerations

- Images are stored in Cloudinary (not in database)
- Only metadata (URL, caption, date) is stored in MongoDB
- Images are lazy-loaded and optimized
- Lightbox preview only loads full-resolution on demand

## Future Enhancements

Possible improvements:
- Bulk image upload with progress tracking
- Image sorting/filtering (by date, by subject, etc.)
- Comments on images
- Sharing images with specific parents
- Organizing images into folders/subjects
- Image annotations or drawing tools
- Integration with student assessments

## Testing

To test the feature:

1. **Upload as Teacher:**
   - Log in as a teacher/admin
   - Go to All Students
   - Click notebook icon for a student
   - Upload test images with captions

2. **View as Parent:**
   - Log in as a parent with an assigned student
   - Go to My Children
   - Should see the uploaded images
   - Click to preview in fullscreen

3. **Delete:**
   - Open the notebook modal again
   - Click delete on an image
   - Confirm deletion

## Troubleshooting

**Images not showing:**
- Check Cloudinary credentials in `.env`
- Verify `NEXT_PUBLIC_APP_URL` if using relative paths
- Check browser console for errors

**Upload fails:**
- Ensure file is actually an image
- Check file size (very large files might timeout)
- Check Cloudinary storage limits

**Parent can't see images:**
- Verify parent is assigned to the student
- Check student ID is correct
- Ensure images were uploaded for that specific student
