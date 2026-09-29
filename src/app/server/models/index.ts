// Registers every Mongoose model. Imported by the DB connection helpers so
// populate() can always resolve refs (e.g. Student.class -> "Class").
//
// Without this, a route that imports a model only for populate() breaks: the
// import looks unused, the compiler drops it, the model never registers, and
// Mongoose throws "Schema hasn't been registered for model" on cold instances.
//
// Add new model files here.
import "./AcademicCalendar";
import "./AcademicObjectiveRating";
import "./ActivityLog";
import "./Assessment";
import "./AssessmentTrend";
import "./Attendance";
import "./Blog";
import "./Class";
import "./Client";
import "./CompanyOverview";
import "./Contact";
import "./Exam";
import "./ExamAttempt";
import "./ExamQuestion";
import "./FeeStructure";
import "./Feedback";
import "./Gallery";
import "./Hero";
import "./HomeAbout";
import "./IssueReport";
import "./LessonObjectiveRating";
import "./LessonTemplate";
import "./LoginLog";
import "./Milestone";
import "./Newsletter";
import "./Project";
import "./PromotionRecord";
import "./ProspectiveStudent";
import "./PupilEffort";
import "./Quote";
import "./ReportCard";
import "./School";
import "./SchoolMember";
import "./Services";
import "./SliderMessage";
import "./Student";
import "./StudentBill";
import "./Subject";
import "./TeacherRating";
import "./Team";
import "./Testimonial";
import "./User";
import "./WhyRayob";
