# AI Integration Setup Guide

## Overview

KiddiesCheck now includes AI-powered learning assistance integrated with Google Gemini API using the Vercel AI SDK. This allows parents, teachers, school leaders, and learning specialists to interact with AI about student performance, reports, and other educational data.

## Architecture

### Components

1. **API Route**: `/api/ai/chat` - Handles AI requests with streaming responses
2. **AI Prompts**: Role-based system prompts ensuring appropriate, safe responses
3. **Chat Component**: `AIChat.js` - Reusable React component for chat interface
4. **Integration Points**: Dashboard pages and student views

### Supported Roles

- **Parent/Guardian** - Empathetic, parent-friendly insights and strategies
- **Teacher/Educator** - Professionally-focused analysis and differentiation strategies
- **School Leader/Principal** - Aggregate data analysis and strategic insights
- **Learning Specialist** - Detailed support planning and intervention strategies

## Setup Instructions

### 1. Get a Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API Key" → "Create API key in new project"
3. Copy your API key

### 2. Configure Environment Variables

Add to your `.env.local` file:

```
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

**⚠️ Security Note:** Never commit `.env.local` to version control. Ensure it's in `.gitignore`.

### 3. Verify Installation

The following packages should be installed:

- `ai` - Vercel AI SDK
- `@ai-sdk/google` - Google AI provider

Check in `package.json`:

```json
{
  "dependencies": {
    "ai": "latest",
    "@ai-sdk/google": "latest"
  }
}
```

## Usage Examples

### Basic Integration in Dashboard Page

```javascript
import AIChat from "@/components/AIChat";

export default function StudentDashboard() {
  const studentData = {
    name: "John Doe",
    gradeLevel: "Grade 5",
    subjects: ["Mathematics", "English", "Science"],
    recentPerformance: "Strong in reading, needs support in fractions",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Other dashboard content */}

      <div className="lg:col-span-1">
        <AIChat
          userRole="parent"
          studentData={studentData}
          title="Ask about your child's learning"
          placeholder="E.g., 'How can I help with math at home?'"
        />
      </div>
    </div>
  );
}
```

### For Teachers

```javascript
<AIChat
  userRole="teacher"
  studentData={{
    name: "Jane Smith",
    gradeLevel: "Grade 3",
    subjects: ["Mathematics", "English", "Physical Education"],
    recentPerformance:
      "Excellent participation, needs support with written work",
  }}
  title="Teaching Strategy Assistant"
  placeholder="Ask for differentiation strategies, classroom techniques, etc."
/>
```

### For School Leaders

```javascript
<AIChat
  userRole="schoolleader"
  schoolContext={{
    schoolName: "Bright Future Primary School",
    district: "North District",
  }}
  title="School Analytics Assistant"
  placeholder="Analyze trends, get improvement insights..."
/>
```

### For Learning Specialists

```javascript
<AIChat
  userRole="learningspecialist"
  studentData={{
    name: "Alex Johnson",
    gradeLevel: "Grade 4",
    subjects: ["Mathematics", "English", "Science"],
    recentPerformance:
      "Assessed for learning support - strong visual learning, needs auditory support",
  }}
  title="Specialist Support Planning"
  placeholder="Plan interventions, document observations, track progress..."
/>
```

## Component Props

```javascript
<AIChat
  userRole="parent"              // Required: 'parent', 'teacher', 'schoolleader', 'learningspecialist'
  studentData={{                 // Optional: Student context
    name: string,
    gradeLevel: string,
    subjects: string[],
    recentPerformance: string
  }}
  schoolContext={{               // Optional: School context
    schoolName: string,
    district: string
  }}
  placeholder="..."              // Optional: Input placeholder text
  title="..."                    // Optional: Component title
  maxHeight="h-96"               // Optional: Chat container height (Tailwind class)
/>
```

## Safety Features

### Built-in Safeguards

1. **Role-based prompts** - Each user type has a specific system prompt ensuring appropriate responses
2. **Clear boundaries** - AI declines to provide medical, psychological, or therapeutic advice
3. **Privacy first** - Recommendations to escalate to professionals when appropriate
4. **Contextual awareness** - Understands student needs and school environment

### What the AI Won't Do

- ❌ Diagnose medical or psychological conditions
- ❌ Provide therapeutic or clinical advice
- ❌ Compare students or provide rankings
- ❌ Share private student data inappropriately
- ❌ Make decisions for educators or parents

### What You Should Do

- ✅ Use AI insights as ONE input in decision-making
- ✅ Involve parents in important discussions about their child
- ✅ Follow school protocols for assessments and interventions
- ✅ Escalate concerns through appropriate channels
- ✅ Document decisions and follow-ups

## Rate Limits & Costs

### Google Gemini Free Tier

- **Free up to**: 15 requests per minute
- **Current cost**: $0 (Public API free tier)
- **For production scale**: See [Google AI Pricing](https://ai.google.dev/pricing)

### Upgrading

If you exceed free tier limits, enable billing in Google Cloud Console. Costs are minimal (~$0.075 per million input tokens).

## Troubleshooting

### API Key Not Found

```
Error: Google AI API key not configured
```

**Solution**: Ensure `GOOGLE_GENERATIVE_AI_API_KEY` is in `.env.local` and the development server was restarted after adding it.

### Streaming Not Working

If chat messages don't appear in real-time, check:

- Browser console for errors (F12)
- Network tab to verify API calls reach `/api/ai/chat`
- Verify Node.js version is 16+ (for streaming support)

### Slow Responses

- Check your internet connection
- Verify API key quota hasn't been exceeded
- Consider using `gemini-1.5-flash` (faster, cheaper) vs `gemini-1.5-pro` (more capable)

## Integration Checklist

- [ ] Added API key to `.env.local`
- [ ] Installed `ai` and `@ai-sdk/google` packages
- [ ] Created `/api/ai/chat` route
- [ ] Created `ai-prompts.js` utility
- [ ] Created `AIChat.js` component
- [ ] Integrated AIChat into at least one dashboard page
- [ ] Tested with sample student data
- [ ] Reviewed role-based prompts with stakeholders
- [ ] Added safety disclaimers in relevant pages
- [ ] Documented for team members

## Next Steps

1. **Integrate into Parent Dashboard** - Add AI chat to parent student view
2. **Teacher Integration** - Add to teacher class/student analysis pages
3. **Admin Dashboard** - Add analytics insights for school leaders
4. **Create Presets** - Add common questions as quick-start suggestions
5. **Analytics** - Track which roles use AI most and what questions they ask
6. **Custom Prompts** - Fine-tune prompts based on school feedback

## Support & Feedback

- For bugs: Check browser console and API logs
- For feature requests: Document use cases and user feedback
- For concerns: Review system prompts and adjust as needed

---

**Last Updated**: April 2, 2026
