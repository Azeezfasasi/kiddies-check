# Academic Calendar & Grade Promotion Implementation TODO

## Step 1: Database Models
- [x] Create `src/app/server/models/AcademicCalendar.js`
- [x] Create `src/app/server/models/PromotionRecord.js`

## Step 2: API Routes
- [x] Create `src/app/api/admin/academic-calendar/route.js` (GET, POST)
- [x] Create `src/app/api/admin/academic-calendar/[id]/route.js` (PUT, DELETE, PATCH)
- [x] Create `src/app/api/admin/promotions/route.js` (GET, POST)
- [x] Create `src/app/api/admin/promotions/history/route.js` (GET)

## Step 3: Dashboard Pages
- [x] Create `src/app/dashboard/academic-calendar/page.js`
- [x] Create `src/app/dashboard/grade-promotion/page.js`

## Step 4: Navigation
- [x] Update `src/components/dashboard-component/DashboardMenu.js`

## Step 5: Testing & Validation
- [x] Verify all routes compile — Build succeeded, all new pages and APIs compiled
- [x] Check navigation renders correctly — Menu items added to DashboardMenu.js

## Implementation Summary

### Feature 1: Academic Calendar (Global)
- **Model**: `AcademicCalendar` — session, term, startDate, endDate, isCurrent, holidays[]
- **API**: `/api/admin/academic-calendar` — full CRUD + set current term
- **Page**: `/dashboard/academic-calendar` — manage terms and holidays
- **Scope**: Global (no school reference), applies to all schools

### Feature 2: Grade Promotion
- **Model**: `PromotionRecord` — student, fromClass, toClass, academicSession, status, etc.
- **API**: `/api/admin/promotions` — get eligible students, run bulk promotion
- **API**: `/api/admin/promotions/history` — view promotion records
- **Page**: `/dashboard/grade-promotion` — configure promotions by school/session
- **Scope**: Per-school, promotes students to next class or graduates them

### Navigation
- Added "Academic Calendar" and "Grade Promotion" to admin/learning-specialist menu

