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
      // Admin can see EVERYTHING - use only fields that exist in Student model
      const [allStudents, allUsers] = await Promise.all([
        Student.find({})
          .select('firstName lastName email enrollmentNo class school parent isActive') 
          .populate('class', 'name gradeLevel').populate('school', 'name')
          .limit(200)
          .lean(),
        User.find({}).select('_id name role email school').lean(),
      ]);

      contextData.students = allStudents.map(s => ({
        id: s._id,
        name: `${s.firstName} ${s.lastName}`,
        gradeLevel: s.class?.gradeLevel,
        school: s.school?.name,
        enrollmentNo: s.enrollmentNo,
        isActive: s.isActive,
      }));
      
      const usersByRole = {
        teachers: allUsers.filter(u => u.role === 'teacher'),
        parents: allUsers.filter(u => u.role === 'parent'),
        schoolLeaders: allUsers.filter(u => u.role === 'school-leader'),
        admins: allUsers.filter(u => u.role === 'admin'),
      };

      contextData.teachers = usersByRole.teachers.slice(0, 50);
      contextData.parents = usersByRole.parents.slice(0, 50);
      contextData.schoolLeaders = usersByRole.schoolLeaders;
      contextData.summary = `Admin Dashboard - ${allStudents.length} students, ${usersByRole.teachers.length} teachers, ${usersByRole.parents.length} parents`;
    } 
    else if (user.role === 'teacher') {
      // Teachers can see their class students
      const teacherStudents = await Student.find({ class: { $exists: true } })
        .select('firstName lastName class school isActive')
        .populate('class', 'name gradeLevel teacher')
        .populate('school', 'name')
        .lean();

      // Filter to students in teacher's classes only
      const filteredStudents = teacherStudents.filter(s => 
        s.class?.teacher?.toString() === user._id.toString()
      );

      contextData.students = filteredStudents.map(s => ({
        id: s._id,
        name: `${s.firstName} ${s.lastName}`,
        gradeLevel: s.class?.gradeLevel,
        className: s.class?.name,
      }));
      
      contextData.school = user.school || {};
      contextData.summary = `Teaching ${filteredStudents.length} students`;
    } 
    else if (user.role === 'school-leader') {
      // School leaders can see all students in their school
      const allStudentsInSchool = await Student.find({ school: { $exists: true } })
        .select('firstName lastName class school isActive')
        .populate('class', 'name gradeLevel')
        .populate('school', 'name')
        .limit(150)
        .lean();

      // Filter to school leader's school
      const schoolStudents = allStudentsInSchool.filter(s => 
        s.school?._id?.toString() === user.schoolId?.toString() || s.school?.name === user.school
      );

      contextData.students = schoolStudents.map(s => ({
        id: s._id,
        name: `${s.firstName} ${s.lastName}`,
        gradeLevel: s.class?.gradeLevel,
        className: s.class?.name,
        isActive: s.isActive,
      }));

      const schoolUsers = await User.find({ school: user.school }).select('_id name role email').lean();
      contextData.teachers = schoolUsers.filter(u => u.role === 'teacher');
      contextData.parents = schoolUsers.filter(u => u.role === 'parent');
      contextData.school = { name: user.school };
      contextData.summary = `${user.school} - ${schoolStudents.length} students`;
    } 
    else if (user.role === 'parent') {
      // Parents can only see their own child's data
      const parentStudent = await Student.findOne({ parent: user._id })
        .select('firstName lastName class school email enrollmentNo')
        .populate('class', 'name gradeLevel')
        .populate('school', 'name')
        .lean();

      if (parentStudent) {
        contextData.students = [{
          id: parentStudent._id,
          name: `${parentStudent.firstName} ${parentStudent.lastName}`,
          gradeLevel: parentStudent.class?.gradeLevel,
          className: parentStudent.class?.name,
          enrollmentNo: parentStudent.enrollmentNo,
        }];
        contextData.summary = `Parent of ${parentStudent.firstName} ${parentStudent.lastName}`;
      } else {
        contextData.students = [];
        contextData.summary = 'No student assigned yet';
      }
    } 
    else if (user.role === 'learning-specialist') {
      // Learning specialists see all students (limited)
      const specialistStudents = await Student.find({})
        .select('firstName lastName class school isActive')
        .populate('class', 'name gradeLevel')
        .populate('school', 'name')
        .limit(100)
        .lean();

      contextData.students = specialistStudents.map(s => ({
        id: s._id,
        name: `${s.firstName} ${s.lastName}`,
        gradeLevel: s.class?.gradeLevel,
        className: s.class?.name,
      }));
      
      contextData.summary = `Supporting ${specialistStudents.length} students`;
    }

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
