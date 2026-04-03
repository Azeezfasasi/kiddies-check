# AI Context Integration Guide

## Overview

The KiddiesCheck AI assistant now has **real-time access to your database** through role-based context integration. This allows the AI to provide informed, specific answers about students, teachers, and school data.

## How It Works

### The Flow

1. **Chat Component Loads** → FloatingAIChat fetches `/api/ai/context`
2. **Context Data Retrieved** → API returns role-filtered data from MongoDB
3. **Context Embedded in Prompt** → System prompt includes current data
4. **AI Responds Informed** → AI can now reference actual students and data

### Role-Based Access Control

| Role                    | Can Access        | Example Data                                             |
| ----------------------- | ----------------- | -------------------------------------------------------- |
| **Admin**               | Everything        | All students, all teachers, all parents, aggregate stats |
| **Teacher**             | Their students    | Only students assigned to them, their school             |
| **School Leader**       | School data       | All users + students in their school                     |
| **Parent**              | Own children      | Only their child's data                                  |
| **Learning Specialist** | Assigned students | Students they're supporting                              |

## What Changed in Your App

### Updated Files

1. **FloatingAIChat Component**
   - Now fetches context on mount
   - Shows context loading state
   - Passes data to chat API
   - Displays context summary in button

2. **Chat API Route**
   - Accepts `contextData` parameter
   - Passes to system prompt

3. **System Prompts**
   - Include "CURRENT DATA CONTEXT" section
   - List available students, teachers, etc.
   - Instruct AI to use this data

### New Context API Endpoint

```
GET /api/ai/context
```

**Headers Required:**

- Cookie: `token=<jwt-token>` (automatic)

**Response Example (Admin):**

```json
{
  "user": {
    "id": "...",
    "name": "Admin User",
    "role": "admin"
  },
  "school": {},
  "students": [...],
  "teachers": [
    { "name": "John Doe", "_id": "..." }
  ],
  "parents": [...],
  "summary": "Admin Dashboard - 150 students, 25 teachers, 120 parents, 5 school leaders"
}
```

## Testing the Integration

### Test as Different Roles

**Test 1: Parent View**

1. Log in as a parent
2. Open the chat (bottom-right ribbon)
3. Ask: "What are my children's current grades?"
4. ✅ Expected: AI should know the parent's child names and provide specific info

**Test 2: Teacher View**

1. Log in as a teacher
2. Open chat
3. Ask: "How many students do I have?"
4. ✅ Expected: AI should say exact number and maybe list names

**Test 3: Admin View**

1. Log in as admin
2. Open chat
3. Ask: "How many students and teachers do we have?"
4. ✅ Expected: AI should provide aggregate statistics

**Test 4: School Leader View**

1. Log in as school leader
2. Open chat
3. Ask: "What schools are in our system?"
4. ✅ Expected: AI should mention their school but not other schools' data

### What to Look For

✅ **Good Signs:**

- Chat shows actual student/teacher names from your database
- AI provides specific numbers and data
- AI doesn't share inappropriate data (parents don't see other kids)
- Ribbon button shows context summary

❌ **Problems to Report:**

- Chat still asks for info instead of using data
- AI shows wrong students or teachers
- Context loading takes too long
- API errors in browser console

## Troubleshooting

### Chat Still Asking for Information

**Problem:** AI asks "Which students do you teach?" instead of listing them
**Solution:** Check browser console for `/api/ai/context` errors

- Open DevTools (F12) → Network tab
- Send a chat message
- Check if context request succeeds

### Missing Student Data

**Problem:** Context summary is empty
**Solution:** Verify database has students assigned to user

- Check User model has `assignedTeachers`, `students`, etc.
- Verify Student model has `parentIds`, `assignedTeachers`, `assignedSpecialists`

### Role Not Recognized

**Problem:** AI using wrong prompt (not matching user role)
**Solution:** Check JWT token includes `role` field

- Token verified in `/api/ai/context` endpoint
- Role checked in context fetching logic

## Security Notes

✅ **What's Protected:**

- JWT token required for context endpoint
- Database queries filtered by user role
- AI prompts explicitly instruct role restrictions
- Parents can't see other kids' data
- Teachers can't see other teachers' students

⚠️ **Important:**

- Context passed to AI is visible in browser (DevTools)
- Don't store sensitive data in student profiles for non-admins
- AI still operates under system prompt guidelines

## Technical Details

### Context API Schema (Admin Response)

```javascript
{
  user: {
    id: ObjectId,
    name: String,
    role: 'admin' | 'teacher' | 'parent' | 'school-leader' | 'learning-specialist',
    email: String
  },
  school: { name?: String },
  students: Student[],      // Filtered by role
  teachers: User[],         // Filtered by role
  parents: User[],          // Filtered by role (admin only)
  summary: String           // Human-readable summary
}
```

### System Prompt with Context

The AI's system prompt now includes:

```
CURRENT DATA CONTEXT:
Admin Dashboard - 150 students, 25 teachers, 120 parents, 5 school leaders

Students you can discuss: John Smith, Jane Doe, ...
Teachers: Ms. Johnson, Mr. Williams, ...
School: Rayob Engineering Academy

INSTRUCTION: Use this context data to provide specific, informed answers. Reference actual students, teachers, and school information when relevant to the conversation.
```

## Monitoring Performance

### Check Context Load Time

Open DevTools → Network tab → Look for `/api/ai/context`

- Good: < 500ms
- Acceptable: < 2000ms
- Slow: > 2000ms (check database indexes)

### Monitor API Errors

Check browser console for:

```javascript
// Good log
"AI context fetched: Admin Dashboard - 150 students...";

// Error log
"Failed to fetch AI context: [error message]";
```

## Next Steps

1. **Test with real user data** - Verify each role type sees correct data
2. **Monitor performance** - Check if context queries are fast enough
3. **Refine prompts** - Adjust system prompts based on teacher/parent feedback
4. **Add more context** - Consider adding assessment data, recent grades, etc.

## Questions or Issues?

Check the implementation in:

- `/src/components/FloatingAIChat.js` - Context fetching
- `/src/app/api/ai/context/route.js` - Role-based filtering
- `/src/utils/ai-prompts.js` - System prompt structure
