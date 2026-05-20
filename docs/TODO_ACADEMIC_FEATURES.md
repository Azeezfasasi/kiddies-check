# Academic Calendar & Grade Promotion Implementation Plan

## Feature 1: Academic Year Calendar

### Model: AcademicCalendar
- session (String): e.g., "2026/2027"
- term (String): "first", "second", "third"
- startDate (Date)
- endDate (Date)
- isActive (Boolean)
- isCurrent (Boolean) - only one term current at a time per school
- holidays: Array of { name, startDate, endDate, type }
- school (ObjectId)
- createdBy, createdAt, updatedAt

### API: /api/academic-calendar
- GET ?schoolId= - list all terms
- POST - create term
- PUT - update term
- DELETE ?termId=&schoolId= - delete term
- PATCH - set current term

### Dashboard: /dashboard/academic-calendar
- Beautiful timeline/calendar view
- Current term highlighted
- Holiday management within term
- Mobile responsive

## Feature 2: Grade Promotion

### Model: PromotionRecord
- student (ObjectId)
- fromClass (ObjectId)
- toClass (ObjectId)
- academicSession (String)
- promotionDate (Date)
- promotedBy (ObjectId)
- status: "promoted", "retained", "graduated"
- remarks (String)
- school (ObjectId)

### API: /api/promotions
- GET ?schoolId=&classId= - list eligible students / history
- POST - run promotion (single or bulk)
- PUT - update promotion record

### Dashboard: /dashboard/grade-promotion
- Select academic session
- View students by current class
- Bulk promote with confirmation
- Promotion history view
- Mobile responsive

## Navigation Updates
- Add "Academic Calendar" to admin menu
- Add "Grade Promotion" to admin menu

