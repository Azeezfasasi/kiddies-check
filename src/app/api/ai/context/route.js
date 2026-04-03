import { connectDB } from '@/app/server/db/connect';
import User from '@/app/server/models/User';
import Student from '@/app/server/models/Student';
import Class from '@/app/server/models/Class';
import School from '@/app/server/models/School';
import Assessment from '@/app/server/models/Assessment';
import AssessmentTrend from '@/app/server/models/AssessmentTrend';
import jwt from 'jsonwebtoken';

/**
 * Fetches role-based context data for AI chat
 * Returns different data based on user role to maintain access control
 */
export async function GET(req) {
  try {
    // Get token from cookies or Authorization header
    let token = req.cookies.get('token')?.value;
    
    if (!token) {
      // Try to get from Authorization header (Bearer token)
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
    }
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify token and get user
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return new Response(
        JSON.stringify({ error: 'Invalid token', details: error.message }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await connectDB();

    const user = await User.findById(decoded.id).lean();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let contextData = {
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
      school: {},
      students: [],
      teachers: [],
      parents: [],
      summary: '',
    };

    // Helper function to get student performance data
    const getStudentPerformance = async (studentId) => {
      try {
        const assessments = await Assessment.find({ student: studentId })
          .select('score percentage gradeLevel subject assessmentType remarks date')
          .limit(20)
          .sort({ date: -1 })
          .lean();

        console.log(`Assessments for student ${studentId}: ${assessments.length} records found`);

        // Return basic structure even if no assessments
        const avgScore = assessments.length > 0 
          ? (assessments.reduce((sum, a) => sum + (a.score || 0), 0) / assessments.length).toFixed(2)
          : 0;
        const avgPercentage = assessments.length > 0
          ? (assessments.reduce((sum, a) => sum + (parseFloat(a.percentage) || 0), 0) / assessments.length).toFixed(2)
          : 0;

        return {
          totalAssessments: assessments.length,
          averageScore: parseFloat(avgScore),
          averagePercentage: parseFloat(avgPercentage),
          recentScore: assessments[0]?.score || 'No data',
          recentPercentage: assessments[0]?.percentage || 'No data',
          recentGrade: assessments[0]?.gradeLevel || 'N/A',
          assessments: assessments.length > 0
            ? assessments.map(a => ({
                score: a.score,
                percentage: a.percentage,
                grade: a.gradeLevel,
                type: a.assessmentType,
                remarks: a.remarks,
                date: a.date,
              }))
            : [],
        };
      } catch (error) {
        console.error('Error fetching performance for student:', error);
        return {
          totalAssessments: 0,
          averageScore: 0,
          averagePercentage: 0,
          recentScore: 'Error',
          assessments: [],
        };
      }
    };

    // Fetch data based on role
    if (user.role === 'admin') {
      // Admin can see EVERYTHING with performance data
      const allStudents = await Student.find({})
        .select('firstName lastName email enrollmentNo class school parent isActive') 
        .limit(100)
        .lean();

      console.log(`Found ${allStudents.length} students for admin`);

      // Fetch performance data for each student with timeout protection
      const studentsWithPerformance = await Promise.all(
        allStudents.map(async (s) => {
          const perf = await getStudentPerformance(s._id);
          return {
            id: s._id,
            name: `${s.firstName} ${s.lastName}`,
            email: s.email,
            enrollmentNo: s.enrollmentNo,
            isActive: s.isActive,
            performance: perf,
          };
        })
      );

      const allUsers = await User.find({}).select('_id name role email school').lean();
      console.log(`Found ${allUsers.length} total users`);

      contextData.students = studentsWithPerformance;
      
      const usersByRole = {
        teachers: allUsers.filter(u => u.role === 'teacher'),
        parents: allUsers.filter(u => u.role === 'parent'),
        schoolLeaders: allUsers.filter(u => u.role === 'school-leader'),
        admins: allUsers.filter(u => u.role === 'admin'),
      };

      console.log(`Teachers: ${usersByRole.teachers.length}, Parents: ${usersByRole.parents.length}`);

      contextData.teachers = usersByRole.teachers.slice(0, 50);
      contextData.parents = usersByRole.parents.slice(0, 50);
      contextData.schoolLeaders = usersByRole.schoolLeaders;
      contextData.summary = `Admin Dashboard - ${allStudents.length} students, ${usersByRole.teachers.length} teachers, ${usersByRole.parents.length} parents`;
    } 
    else if (user.role === 'teacher') {
      // Teachers can see all students with their performance
      const allStudents = await Student.find({})
        .select('firstName lastName class school isActive')
        .limit(100)
        .lean();

      const studentsWithPerformance = await Promise.all(
        allStudents.map(async (s) => ({
          id: s._id,
          name: `${s.firstName} ${s.lastName}`,
          performance: await getStudentPerformance(s._id),
        }))
      );

      contextData.students = studentsWithPerformance;
      contextData.school = user.school || {};
      contextData.summary = `${allStudents.length} students with performance data available`;
    } 
    else if (user.role === 'school-leader') {
      // School leaders can see all students with performance
      const allStudents = await Student.find({})
        .select('firstName lastName class school isActive')
        .limit(150)
        .lean();

      const studentsWithPerformance = await Promise.all(
        allStudents.map(async (s) => ({
          id: s._id,
          name: `${s.firstName} ${s.lastName}`,
          performance: await getStudentPerformance(s._id),
        }))
      );

      contextData.students = studentsWithPerformance;

      const schoolUsers = await User.find({ school: user.school }).select('_id name role email').lean();
      contextData.teachers = schoolUsers.filter(u => u.role === 'teacher');
      contextData.parents = schoolUsers.filter(u => u.role === 'parent');
      contextData.school = { name: user.school };
      contextData.summary = `${user.school} - ${allStudents.length} students with performance tracking`;
    } 
    else if (user.role === 'parent') {
      // Parents can see all students but AI will filter to their child
      const allStudents = await Student.find({})
        .select('firstName lastName class school email enrollmentNo')
        .limit(100)
        .lean();

      const studentsWithPerformance = await Promise.all(
        allStudents.map(async (s) => ({
          id: s._id,
          name: `${s.firstName} ${s.lastName}`,
          email: s.email,
          enrollmentNo: s.enrollmentNo,
          performance: await getStudentPerformance(s._id),
        }))
      );
      
      contextData.students = studentsWithPerformance;
      contextData.summary = 'Student performance records available';
    } 
    else if (user.role === 'learning-specialist') {
      // Learning specialists see all students with detailed performance
      const allStudents = await Student.find({})
        .select('firstName lastName class school isActive')
        .limit(100)
        .lean();

      const studentsWithPerformance = await Promise.all(
        allStudents.map(async (s) => ({
          id: s._id,
          name: `${s.firstName} ${s.lastName}`,
          performance: await getStudentPerformance(s._id),
        }))
      );
      
      contextData.students = studentsWithPerformance;
      contextData.summary = `${allStudents.length} students with performance analytics available`;
    }

    console.log('Context data prepared:', {
      studentsCount: contextData.students?.length || 0,
      teachersCount: contextData.teachers?.length || 0,
      parentCount: contextData.parents?.length || 0,
      studentNames: contextData.students?.map(s => s.name) || [],
      studentPerformance: contextData.students?.map(s => ({
        name: s.name,
        totalAssessments: s.performance?.totalAssessments || 0,
        averageScore: s.performance?.averageScore || 0,
      })) || [],
    });

    return new Response(
      JSON.stringify(contextData),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
        } 
      }
    );
  } catch (error) {
    console.error('Context API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch context',
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
