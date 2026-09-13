# Kiddies Check

Kiddies Check is a full-stack school management and child-safety platform built with Next.js. It connects schools, teachers, parents, and students in one system for managing school operations, monitoring attendance and academic progress, communicating with families, and providing safety-focused tools.

## What the platform provides

### For schools and administrators

- Manage multiple schools and their members from a centralized system.
- Handle user registration, approvals, roles, invitations, profiles, and school access.
- Manage students, classes, subjects, academic calendars, examinations, promotions, and learning records.
- Configure school content such as blogs, projects, galleries, newsletters, FAQs, and team information.
- Review operational data and dashboards with charts and reports.

### For teachers and learning specialists

- Manage classes and student records.
- Record attendance, including QR-code attendance workflows.
- Create assessments, manage grades, and monitor academic performance.
- Share progress updates and feedback with parents.
- Use AI-assisted tools and contextual chat support where enabled.

### For parents and students

- Access a protected dashboard for personal school information.
- Allow parents to view their assigned children and related academic information.
- Review teacher feedback and reply to school communications.
- Access attendance, classes, assessments, and other permitted records.

### Child safety and platform experience

- Safety-focused resources and public content for parents and caregivers.
- Responsive web interfaces with installable Progressive Web App support.
- Media uploads through Cloudinary.
- Email notifications and newsletters through Brevo or SMTP.

## Technology

- [Next.js](https://nextjs.org/) 15 with the App Router
- React 19
- MongoDB with Mongoose
- JWT-based authentication and role-based authorization
- Tailwind CSS
- Cloudinary for media storage
- Brevo and Nodemailer for email delivery
- Google/Groq/OpenAI-compatible AI integrations used by selected features
- Tiptap for rich-text editing
- QR code scanning, PDF generation, charts, and PWA support

## Project structure

```text
kiddies-check/
├── src/
│   ├── app/              Pages, layouts, API route handlers, and server code
│   ├── components/       Shared UI, dashboards, AI, and PWA components
│   ├── context/          Authentication and other React context providers
│   ├── hooks/            Reusable client-side hooks
│   ├── lib/              Shared integrations
│   └── utils/            Authentication, database, API, and feature utilities
├── public/               Static assets, manifest, and service-worker files
├── docs/                 Feature guides and API documentation
└── package.json          Scripts and dependencies
```

The application uses the `@/*` import alias for `src/*` imports.

## Prerequisites

- Node.js 18.18 or newer
- npm
- A MongoDB database
- Cloudinary credentials if media upload features are used
- Brevo or SMTP credentials if email features are used
- An AI provider key if AI chat features are enabled

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file in the project root and provide the required service credentials.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

For a faster development build using Turbopack, run:

```bash
npm run dev:turbo
```

To run the production build locally:

```bash
npm run build
npm start
```

## Environment variables

The exact variables needed depend on the features enabled in a deployment. The core configuration is:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kiddies-check

# Application and authentication
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRE=7d

# Media uploads
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email and newsletters
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=sender@example.com
BREVO_SENDER_NAME=Kiddies Check Team
ADMIN_EMAIL=admin@example.com

# Optional SMTP configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# Optional AI configuration
GROQ_API_KEY=your-groq-api-key
# Add provider-specific keys when using the corresponding AI integration.
```

Do not commit `.env.local` or any other environment file. Secrets should remain server-side, and production deployments should use strong, unique values for `JWT_SECRET`.

## User roles

The platform supports role-based access. The main roles documented by the API are:

| Role | Typical access |
| --- | --- |
| `admin` | Full system and multi-school administration |
| `learning-specialist` | Oversight across schools and registration approvals |
| `school-leader` | Administration for an assigned school |
| `teacher` | Classes, attendance, assessments, and student feedback |
| `parent` | Assigned children's information and communication |
| `student` | The student's permitted academic information |

Access is also constrained by school membership and the specific operation being requested.

## Important routes

- `/` - Public landing page and platform information
- `/login` and `/register` - Authentication flows
- `/dashboard` - Protected role-based workspace
- `/dashboard/all-students` - Student management
- `/dashboard/my-children` - Parent view of assigned children
- `/dashboard/attendance` - Attendance management where enabled
- `/blog`, `/projects`, and `/gallery` - Public content sections
- `/api` - Next.js API route handlers for authentication, schools, students, attendance, academics, feedback, newsletters, and administration

The API uses JWT bearer tokens for normal client requests:

```http
Authorization: Bearer <jwt-token>
```

See [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for endpoint details and authentication examples.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run dev:turbo` | Start the development server with Turbopack |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `node test-brevo-connection.js` | Test Brevo configuration |
| `node test-admin-schools.js` | Test admin school access workflows |
| `node diagnose-attendance.js` | Run attendance diagnostics |
| `node findAdminId.js` | Run the admin lookup utility |

## Documentation guide

The `docs/` directory contains focused guides for implemented features, including:

- [API documentation](docs/API_DOCUMENTATION.md)
- [Parent assignment and feedback](docs/PARENT_ASSIGNMENT_FEEDBACK_SYSTEM.md)
- [Multi-school access](docs/MULTI_SCHOOL_ACCESS.md)
- [School and parent workflows](docs/SCHOOL_PARENTS_DOCUMENTATION.md)
- [AI integration](docs/AI_INTEGRATION_GUIDE.md)
- [PWA setup](docs/PWA_SETUP_GUIDE.md)
- [QR attendance planning](docs/TODO_QR_ATTENDANCE.md)

## Development notes

- API routes are implemented under `src/app/api`.
- Server-side models, controllers, middleware, jobs, and services are under `src/app/server`.
- Use a test account with the appropriate role when verifying dashboard features.
- Confirm both user role and school membership when investigating a `403 Forbidden` response.
- Before submitting changes, run `npm run lint` and `npm run build`.

## License

This is a private application. No open-source license is currently defined in the repository.