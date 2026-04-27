# Learning Impact Data Implementation - TODO

## Completed

### 1. Database Models (src/app/server/models/)
- [x] LessonTemplate.js - Lesson rating templates with criteria
- [x] LessonObjectiveRating.js - Lesson objective ratings by teacher/class/subject
- [x] AcademicObjectiveRating.js - Academic objective ratings by student
- [x] PupilEffort.js - Pupil effort submissions across categories
- [x] TeacherRating.js - Teacher ratings across dimensions

### 2. API Routes (src/app/api/learning-impact/)
- [x] lesson-templates/route.js - CRUD for lesson templates
- [x] lesson-objectives/route.js - CRUD for lesson objective ratings
- [x] academic-objectives/route.js - CRUD for academic objective ratings
- [x] pupil-efforts/route.js - CRUD for pupil effort submissions
- [x] teacher-ratings/route.js - CRUD for teacher ratings
- [x] summary/route.js - Aggregated summary stats for dashboard

### 3. Dashboard UI Components (src/app/dashboard/learning-impact/components/)
- [x] FormInputs.js - Reusable form input components
- [x] TemplateForm.js - Lesson template form
- [x] LessonObjectiveForm.js - Lesson objective rating form
- [x] AcademicObjectiveForm.js - Academic objective rating form
- [x] PupilEffortForm.js - Pupil effort submission form
- [x] TeacherRatingForm.js - Teacher rating form
- [x] DataTable.js - Reusable data table with edit/delete

### 4. Main Dashboard Page
- [x] src/app/dashboard/learning-impact/page.js - Complete dashboard with tabs, forms, tables, AI chat

### 5. Navigation
- [x] DashboardMenu.js - Added "Learning Impact Data" menu item under Learning Specialist (admin/learning-specialist only)

### 6. AI Integration
- [x] src/app/api/ai/context/route.js - Includes learning impact summary in AI context for admin/learning-specialist
- [x] src/utils/ai-prompts.js - AI instructed to use learning impact data for improvement plan suggestions

## Features Implemented

1. **Lesson Templates** - Create rating templates with customizable criteria for teacher evaluation
2. **Lesson Objective Ratings** - Rate lesson objectives by teacher, class, subject with overall ratings
3. **Academic Objective Ratings** - Track student academic progress with objectives, target/achieved levels
4. **Pupil Efforts** - Submit effort ratings across 10 categories (participation, homework, behavior, etc.)
5. **Teacher Ratings** - Rate teachers across 12 dimensions with action plans
6. **AI Improvement Assistant** - AI chat sidebar that uses learning impact data to suggest improvement plans
7. **Summary Dashboard** - Visual summary cards showing averages across all rating types

## Access Control
- Only `admin` and `learning-specialist` roles can access the Learning Impact Data page
- All API routes enforce school-based access control via x-user-id header
- AI context only includes learning impact data for authorized roles

## Next Steps (Optional Enhancements)
- [ ] Add export to PDF/Excel functionality
- [ ] Add filtering by date range, class, subject
- [ ] Add trend charts over time
- [ ] Email notifications for low ratings
- [ ] Integration with existing Assessment model for combined reporting

