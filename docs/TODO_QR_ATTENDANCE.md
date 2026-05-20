# QR Code & Attendance Implementation Plan

## Steps
1. [x] Install dependencies (`qrcode`, `html5-qrcode`)
2. [x] Update `Student` model — add `qrCode` field
3. [x] Create `Attendance` model
4. [x] Update `POST /api/teacher/students` — auto-generate QR code on creation
5. [x] Create `GET /api/teacher/students/[id]/qrcode` — get/regenerate QR code
6. [x] Create `POST /api/teacher/attendance` — mark attendance (via QR or manual)
7. [x] Create `GET /api/teacher/attendance` — fetch attendance records
8. [ ] Create `GET /api/teacher/attendance/student/[id]` — student attendance history (deferred)
9. [x] Create `QRCodeDisplay` component
10. [x] Create `AttendanceScanner` component
11. [x] Create `src/app/dashboard/mark-attendance/page.js`
12. [x] Update `src/app/dashboard/all-students/page.js` — add QR code display actions
13. [x] Update `src/components/dashboard-component/DashboardMenu.js` — add "Mark Attendance" navigation item

**Status: COMPLETE**

