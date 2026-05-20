# Student Access Card Implementation

## Overview
The Access Card feature allows teachers to view, generate, and download professional student ID cards with QR codes. These cards can be printed and given to students for school attendance tracking.

## Features

### 1. **Beautiful Card Design**
- Professional layout inspired by the reference image
- Clean blue gradient header with student icon
- Organized information fields
- High-quality QR code for attendance scanning
- Professional branding with school name

### 2. **Card Information Displayed**
- Student Name
- Student ID Number (studentNo)
- Date of Birth (formatted as DD/MM/YYYY)
- Grade/Class Level
- Email Address
- QR Code for attendance scanning
- School Name
- "Test Your Impact" tagline

### 3. **Modal Popup View**
- Full-screen modal overlay with card preview
- Easy-to-read card preview
- Close button to exit

### 4. **Download Functionality**
- Download card as PNG image
- Filename includes student name for easy organization
- High-quality output (2x scale for better resolution)
- Fallback print method if download fails

## Components

### AccessCard Component
**File:** `src/app/components/AccessCard.js`

This is the main component that renders the access card modal and handles downloads.

**Props:**
- `student` (object): Student data including:
  - `_id`: Student ID
  - `name`: Full student name
  - `studentNo`: Student ID number
  - `dateOfBirth`: Date of birth
  - `gradeLevel`: Grade/class level
  - `className`: Class name
  - `email`: Student email
  - `schoolId`: School identifier
- `schoolName` (string): Name of the school
- `onClose` (function): Callback to close the modal

**QR Code Data:**
The QR code encodes the following JSON data:
```json
{
  "studentId": "student_id",
  "name": "Student Name",
  "studentNo": "student_number",
  "schoolId": "school_id",
  "timestamp": "ISO_timestamp"
}
```

## Integration

### Updated File: `src/app/dashboard/all-students/page.js`

The access card feature has been integrated into the Students Management dashboard with:

1. **New States:**
   - `showAccessCardModal`: Boolean to control modal visibility
   - `selectedStudentForAccessCard`: Student data for the card
   - `schoolName`: School name fetched from localStorage

2. **New Buttons:**
   - Desktop view: Card icon button in the actions column
   - Mobile view: "Card" button in the actions section

3. **Event Handlers:**
   - Click to view access card opens the modal
   - Close button closes the modal
   - Download button saves the card as PNG

## Usage

### For Teachers/Admins:

1. Navigate to the Students Management page
2. Find the student you want to create an access card for
3. Click the **Card icon** (desktop) or **Card button** (mobile)
4. A modal will appear showing the professional access card
5. Click **Download Card** to save the card as an image
6. Print the downloaded image and give it to the student

### QR Code Scanning:
- Teachers can scan the QR code on the access card to mark attendance
- The QR code contains the student ID and school information
- Teachers need a QR scanner app or tool to read and process attendance

## Technical Details

### QR Code Generation:
- Uses the `qrcode` library (already installed in package.json)
- High error correction level (H) for reliable scanning
- 200x200px size
- Data URL format for embedding in HTML

### Download Implementation:
- Primary method: Canvas-based SVG to PNG conversion
- Fallback method: Browser print dialog
- Works across all modern browsers
- Handles edge cases gracefully

### Styling:
- TailwindCSS for responsive design
- Blue gradient color scheme matching your branding
- Professional typography and spacing
- Mobile-responsive card preview

## Data Fields Mapping

The component expects the following student data structure:

```javascript
{
  _id: "student_id",
  firstName: "John",
  lastName: "Doe",
  name: "John Doe", // Combined name
  studentNo: "STU001",
  email: "john@example.com",
  dateOfBirth: "2015-05-15",
  gradeLevel: "Class 4A",
  className: "Class 4A",
  class: {
    _id: "class_id",
    name: "Class 4A"
  },
  schoolId: "school_id"
}
```

## Customization

### Modify Card Design:
Edit `src/app/components/AccessCard.js` to customize:
- Colors: Change gradient values in `bg-gradient-to-*` classes
- Layout: Adjust grid and spacing with Tailwind classes
- Information fields: Add/remove sections in the card body
- Logo: Replace the emoji icon with custom image

### Update School Name:
The school name is automatically fetched from `localStorage.getItem("schoolName")`. 
Ensure your login process sets this value.

### Add More Card Fields:
Add new fields to the card body section:
```jsx
<div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
  <p className="text-gray-600 font-semibold text-xs uppercase tracking-wider mb-1">
    FIELD NAME
  </p>
  <p className="text-gray-800 font-bold text-lg">
    {student.fieldName || "N/A"}
  </p>
</div>
```

## Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support (tested on iOS and Android)

## Future Enhancements
- [ ] Bulk download multiple cards at once
- [ ] Print directly from modal
- [ ] Customize card design template
- [ ] Add photo/avatar support
- [ ] Multi-language support
- [ ] Export as PDF
- [ ] Add watermark or security features
- [ ] Integration with attendance scanning system

## Troubleshooting

### Download not working:
1. Check browser console for errors
2. Ensure cookies and local storage are enabled
3. Try the fallback print method
4. Test in a different browser

### QR Code not scanning:
1. Ensure QR code is fully visible and not obscured
2. Try with a different QR scanner app
3. Check that the downloaded image has sufficient resolution
4. Print at appropriate size (not too small)

### Student data showing "N/A":
1. Verify student record has all required fields
2. Check field names match component expectations
3. Ensure data is properly saved in database

## API Dependencies
None - This is a client-side component. It uses:
- Student data passed from the page component
- localStorage for school name
- Browser Canvas API for image generation
- qrcode library for QR code generation

## Security Considerations
- QR code contains student ID and school ID (non-sensitive identifiers)
- No sensitive data (passwords, tokens) encoded in QR
- Download happens client-side, no server transmission
- School name from localStorage assumed to be trusted

