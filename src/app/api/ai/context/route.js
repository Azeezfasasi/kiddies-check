import { connectDB } from '@/app/server/db/connect';
import User from '@/app/server/models/User';
import Student from '@/app/server/models/Student';
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

    // Fetch data based on role
    if (user.role === 'admin') {
      // Admin can see EVERYTHING with comprehensive details
      const [allStudents, allUsers] = await Promise.all([
        Student.find({})
          .select('name gradeLevel subjects assessments performance attendance parentIds assignedTeachers')
          .lean(),
        User.find({}).select('_id name role email school').lean(),
      ]);

      const usersByRole = {
        teachers: allUsers.filter(u => u.role === 'teacher'),
        parents: allUsers.filter(u => u.role === 'parent'),
        schoolLeaders: allUsers.filter(u => u.role === 'school-leader'),
        admins: allUsers.filter(u => u.role === 'admin'),
      };

      // Enrich student data with teacher/parent names
      const enrichedStudents = allStudents.map(s => ({
        ...s,
        teacherNames: s.assignedTeachers?.map(tid => allUsers.find(u => u._id.toString() === tid.toString())?.name).filter(Boolean) || [],
        parentNames: s.parentIds?.map(pid => allUsers.find(u => u._id.toString() === pid.toString())?.name).filter(Boolean) || [],
      }));

      contextData.students = enrichedStudents;
      contextData.teachers = usersByRole.teachers;
      contextData.parents = usersByRole.parents;
      contextData.schoolLeaders = usersByRole.schoolLeaders;
      contextData.summary = `Admin Dashboard - ${allStudents.length} students, ${usersByRole.teachers.length} teachers, ${usersByRole.parents.length} parents, ${usersByRole.schoolLeaders.length} school leaders`;
    } 
    else if (user.role === 'teacher') {
      // Teachers can see their assigned students with detailed performance data
      const [teacherStudents, allUsers] = await Promise.all([
        Student.find({ 
          assignedTeachers: user._id 
        }).select('name gradeLevel subjects assessments performance attendance assignedTeachers parentIds').lean(),
        User.find({ role: 'parent' }).select('_id name email').lean(),
      ]);

      const enrichedStudents = teacherStudents.map(s => ({
        ...s,
        parentNames: s.parentIds?.map(pid => allUsers.find(u => u._id.toString() === pid.toString())?.name).filter(Boolean) || [],
      }));

      contextData.students = enrichedStudents;
      contextData.school = user.school || {};
      contextData.summary = `Teaching ${teacherStudents.length} students in ${user.school || 'your school'}`;
    } 
    else if (user.role === 'school-leader') {
      // School leaders can see all students and staff in their school with detailed data
      const [schoolStudents, schoolUsers] = await Promise.all([
        Student.find({ school: user.school })
          .select('name gradeLevel subjects assessments performance attendance assignedTeachers parentIds')
          .lean(),
        User.find({ school: user.school }).select('_id name role email').lean(),
      ]);

      const teachersInSchool = schoolUsers.filter(u => u.role === 'teacher');
      const parentsInSchool = schoolUsers.filter(u => u.role === 'parent');

      // Enrich student data
      const enrichedStudents = schoolStudents.map(s => ({
        ...s,
        teacherNames: s.assignedTeachers?.map(tid => schoolUsers.find(u => u._id.toString() === tid.toString())?.name).filter(Boolean) || [],
        parentNames: s.parentIds?.map(pid => schoolUsers.find(u => u._id.toString() === pid.toString())?.name).filter(Boolean) || [],
      }));

      contextData.students = enrichedStudents;
      contextData.teachers = teachersInSchool;
      contextData.parents = parentsInSchool;
      contextData.school = { name: user.school };
      contextData.summary = `${user.school} - ${schoolStudents.length} students, ${teachersInSchool.length} teachers, ${parentsInSchool.length} parents`;
    } 
    else if (user.role === 'parent') {
      // Parents can only see their own child's data with comprehensive details
      const [parentStudents, allUsers] = await Promise.all([
        Student.find({ 
          parentIds: user._id 
        }).select('name gradeLevel subjects assessments performance attendance parentIds assignedTeachers').lean(),
        User.find({ role: 'teacher' }).select('_id name email').lean(),
      ]);

      const enrichedStudents = parentStudents.map(s => ({
        ...s,
        teacherNames: s.assignedTeachers?.map(tid => allUsers.find(u => u._id.toString() === tid.toString())?.name).filter(Boolean) || [],
      }));

      contextData.students = enrichedStudents;
      contextData.summary = parentStudents.length > 0 
        ? `Parent of ${parentStudents.map(s => s.name).join(', ')}` 
        : 'No students assigned yet';
    } 
    else if (user.role === 'learning-specialist') {
      // Learning specialists can see their assigned students with detailed needs assessment
      const [specialistStudents, allUsers] = await Promise.all([
        Student.find({ 
          assignedSpecialists: user._id 
        }).select('name gradeLevel subjects assessments performance attendance specialNeeds assignedTeachers parentIds assignedSpecialists').lean(),
        User.find({ $or: [{ role: 'teacher' }, { role: 'parent' }] }).select('_id name role email').lean(),
      ]);

      const enrichedStudents = specialistStudents.map(s => ({
        ...s,
        teacherNames: s.assignedTeachers?.map(tid => allUsers.find(u => u._id.toString() === tid.toString() && u.role === 'teacher')?.name).filter(Boolean) || [],
        parentNames: s.parentIds?.map(pid => allUsers.find(u => u._id.toString() === pid.toString() && u.role === 'parent')?.name).filter(Boolean) || [],
      }));

      contextData.students = enrichedStudents;
      contextData.summary = `Supporting ${specialistStudents.length} students with specialized learning needs`;
    }

    return new Response(
      JSON.stringify(contextData),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
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
