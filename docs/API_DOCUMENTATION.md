# Kiddies Check API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Authentication](#authentication)
4. [Request & Response Format](#request--response-format)
5. [Error Handling](#error-handling)
6. [API Endpoints](#api-endpoints)
7. [Code Examples](#code-examples)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Kiddies Check API is a RESTful API built with Next.js and MongoDB that manages:
- **User Management**: Authentication, roles, profiles
- **School Management**: Multi-school support with members
- **Educational Operations**: Classes, subjects, attendance, assessments, feedback
- **Parent Portal**: Student information and communication
- **Admin Functions**: Registrations, academic calendars, promotions
- **AI Integration**: Smart chat assistance with contextual learning

### Base URLs
- **Development**: `http://localhost:3000/api`
- **Production**: `https://kiddiescheck.org/api`

### API Version
- Current: `v1` (not versioned in URL, use header if needed)

---

## Quick Start

### 1. Authenticate
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 2. Use Token for Subsequent Requests
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <your token>"
```

### 3. Start Using Endpoints
```bash
# Get list of schools (admin only)
curl -X GET "http://localhost:3000/api/schools?page=1&pageSize=10" \
  -H "Authorization: Bearer <your_token>"
```

---

## Authentication

### Authentication Methods

#### Method 1: JWT Bearer Token (Recommended)
```
Authorization: Bearer <JWT_TOKEN>
```

```javascript
// JavaScript Fetch Example
const response = await fetch('http://localhost:3000/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### Method 2: User ID Header (Server-to-Server)
```
x-user-id: <user-id>
```
Use this for internal microservice calls.

#### Method 3: Cookie
```
Cookie: token=<JWT_TOKEN>
```

### Getting a Token

**Login Endpoint** — `POST /api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "token": "<your brearer token>",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "teacher",
    "schoolId": "507f1f77bcf86cd799439012"
  }
}
```

### Token Expiration & Refresh

- Tokens are long-lived JWT tokens
- If a password is changed, existing tokens become invalid
- Users must log in again after password change
- No separate refresh token mechanism currently

### User Roles & Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| **admin** | System administrator | Full access to all features |
| **learning-specialist** | Multi-school overseer | Access to multiple schools, registration approvals |
| **school-leader** | School administrator | School-specific management |
| **teacher** | Classroom instructor | Create classes, manage attendance, grade students |
| **parent** | Guardian | View own children's information |
| **student** | Learner | View own academic information |

---

## Request & Response Format

### Request Headers

```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

### Standard Response Format

**Successful Response (2xx)**:
```json
{
  "success": true,
  "data": {},  // or "message", "user", etc.
  "timestamp": "2024-06-21T10:30:00Z"
}
```

**Paginated Response**:
```json
{
  "success": true,
  "data": [...],
  "page": 1,
  "pageSize": 10,
  "totalCount": 50,
  "totalPages": 5
}
```

**Error Response (4xx, 5xx)**:
```json
{
  "success": false,
  "error": "Descriptive error message",
  "status": 400,
  "timestamp": "2024-06-21T10:30:00Z"
}
```

### Query Parameters

#### Pagination
```
?page=1&pageSize=10
```
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 10)

#### Search & Filter
```
?search=john&status=active&schoolType=private
```
- `search`: Full-text search across multiple fields
- Various filter parameters depending on endpoint
- All filters are optional

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| **200** | OK | Request successful |
| **201** | Created | Resource created successfully |
| **400** | Bad Request | Invalid input or validation error |
| **401** | Unauthorized | Missing or invalid token |
| **403** | Forbidden | Authenticated but insufficient permissions |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Resource already exists or duplicate |
| **500** | Server Error | Unexpected server error |

### Common Error Responses

**Missing Authentication**:
```json
{
  "success": false,
  "message": "No token provided",
  "status": 401
}
```

**Invalid Token**:
```json
{
  "success": false,
  "message": "Invalid token",
  "status": 401
}
```

**Insufficient Permissions**:
```json
{
  "success": false,
  "error": "Access denied",
  "status": 403
}
```

**Validation Error**:
```json
{
  "success": false,
  "error": "Email is required",
  "details": {
    "field": "email",
    "message": "Required field missing"
  },
  "status": 400
}
```

### Error Handling Best Practices

```javascript
// JavaScript/Node.js
try {
  const response = await fetch('http://localhost:3000/api/endpoint', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('API Error:', errorData);
    // Handle specific error codes
    if (response.status === 401) {
      // Redirect to login
    } else if (response.status === 403) {
      // Show permission denied
    }
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error('Network error:', error);
}
```

---

## API Endpoints

### 1. Authentication Endpoints

#### Register New User
```
POST /api/auth/register
```

**Request**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "teacher",
  "schoolId": "507f1f77bcf86cd799439012",
  "phone": "+234801234567"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "userId": "507f1f77bcf86cd799439013"
}
```

---

#### Login
```
POST /api/auth/login
```

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "teacher"
  }
}
```

---

#### Get Current User
```
GET /api/auth/me
```

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Response** (200):
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "teacher",
    "schoolId": "507f1f77bcf86cd799439012",
    "isActive": true
  }
}
```

---

#### Update Profile
```
PUT /api/auth/profile
```

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Request**:
```json
{
  "firstName": "Jonathan",
  "lastName": "Doe",
  "phone": "+234802345678",
  "bio": "Passionate educator"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { /* updated user object */ }
}
```

---

#### Change Password
```
POST /api/auth/change-password
```

**Request**:
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password changed successfully. Please log in again."
}
```

---

#### Forgot Password
```
POST /api/auth/forgot-password
```

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Reset email sent. Check your email for further instructions."
}
```

---

#### Reset Password
```
POST /api/auth/reset-password
```

**Request**:
```json
{
  "token": "reset-token-from-email",
  "newPassword": "newPassword123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password reset successfully. Please log in."
}
```

---

#### Verify Email
```
POST /api/auth/verify-email
```

**Request**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

### 2. Schools API

#### List Schools (Admin/Learning-Specialist)
```
GET /api/schools
```

**Query Parameters**:
```
?page=1&pageSize=10&search=myschool&isActive=true&approvalStatus=approved&schoolType=private
```

**Response** (200):
```json
{
  "success": true,
  "schools": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Pinnacle Academy",
      "email": "contact@pinnacle.com",
      "phone": "+234801234567",
      "location": "Lagos, Nigeria",
      "schoolType": "private",
      "logo": "https://cloudinary.com/...",
      "approvalStatus": "approved",
      "isActive": true,
      "numberOfStudents": 450,
      "numberOfTeachers": 25,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "totalCount": 50,
  "totalPages": 5
}
```

---

#### Get School Details
```
GET /api/schools/[schoolId]
```

**Response** (200):
```json
{
  "success": true,
  "school": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Pinnacle Academy",
    "email": "contact@pinnacle.com",
    "phone": "+234801234567",
    "location": "Lagos, Nigeria",
    "website": "https://pinnacle.com",
    "description": "Premier educational institution...",
    "schoolType": "private",
    "model": "day-school",
    "logo": "https://cloudinary.com/...",
    "numberOfStudents": 450,
    "numberOfTeachers": 25,
    "principal": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "Sarah",
      "lastName": "Johnson"
    },
    "approvalStatus": "approved",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

#### Create School (Admin Only)
```
POST /api/schools
```

**Request**:
```json
{
  "name": "New Academy",
  "email": "contact@newacademy.com",
  "phone": "+234801234567",
  "location": "Abuja, Nigeria",
  "website": "https://newacademy.com",
  "description": "A modern school...",
  "schoolType": "private",
  "model": "day-school",
  "numberOfStudents": 300,
  "numberOfTeachers": 20
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "School created successfully",
  "school": { /* school object */ }
}
```

---

#### Update School
```
PUT /api/schools/[schoolId]
```

**Request**:
```json
{
  "name": "Updated Academy",
  "description": "Updated description",
  "numberOfStudents": 350
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "School updated successfully",
  "school": { /* updated school object */ }
}
```

---

#### Get School Members
```
GET /api/school/members
```

**Query Parameters**:
```
?schoolId=507f1f77bcf86cd799439012
```

**Response** (200):
```json
{
  "success": true,
  "members": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "teacher",
      "status": "active",
      "joinedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### 3. Users API

#### List All Users (Admin Only)
```
GET /api/users
```

**Query Parameters**:
```
?page=1&pageSize=10&search=john&role=teacher&isActive=true
```

**Response** (200):
```json
{
  "success": true,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "teacher",
      "schoolId": "507f1f77bcf86cd799439012",
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "totalCount": 150,
  "totalPages": 15
}
```

---

#### Create User with Role (Admin Only)
```
POST /api/users
```

**Request**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "password": "TempPassword123!",
  "role": "teacher",
  "schoolId": "507f1f77bcf86cd799439012"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "User created successfully",
  "user": { /* user object */ }
}
```

---

#### Get User Details
```
GET /api/users/[userId]
```

**Response** (200):
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "teacher",
    "schoolId": "507f1f77bcf86cd799439012",
    "phone": "+234801234567",
    "bio": "Educator",
    "isActive": true
  }
}
```

---

#### Update User
```
PUT /api/users/[userId]
```

**Request**:
```json
{
  "firstName": "Jonathan",
  "role": "learning-specialist",
  "phone": "+234802345678"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": { /* updated user object */ }
}
```

---

#### Delete User (Admin Only)
```
DELETE /api/users/[userId]
```

**Response** (200):
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### 4. Teacher Endpoints

#### List Student Classes
```
GET /api/teacher/classes
```

**Query Parameters**:
```
?schoolId=507f1f77bcf86cd799439012
```

**Response** (200):
```json
{
  "success": true,
  "classes": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Primary 4A",
      "form": "P4",
      "streamLetter": "A",
      "numberOfStudents": 45,
      "teacher": "507f1f77bcf86cd799439011",
      "academicYear": "2023/2024"
    }
  ]
}
```

---

#### List Students in Class
```
GET /api/teacher/students
```

**Query Parameters**:
```
?classId=507f1f77bcf86cd799439020&schoolId=507f1f77bcf86cd799439012
```

**Response** (200):
```json
{
  "success": true,
  "students": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "firstName": "Chisom",
      "lastName": "Okafor",
      "admissionNumber": "PS4A001",
      "classId": "507f1f77bcf86cd799439020",
      "dateOfBirth": "2015-05-12",
      "parent": "507f1f77bcf86cd799439019"
    }
  ]
}
```

---

#### Mark Attendance
```
POST /api/teacher/attendance
```

**Request**:
```json
{
  "classId": "507f1f77bcf86cd799439020",
  "date": "2024-06-21",
  "records": [
    {
      "studentId": "507f1f77bcf86cd799439030",
      "status": "present"
    },
    {
      "studentId": "507f1f77bcf86cd799439031",
      "status": "absent"
    }
  ]
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "attendanceId": "507f1f77bcf86cd799439040"
}
```

---

#### Get Attendance Records
```
GET /api/teacher/attendance
```

**Query Parameters**:
```
?classId=507f1f77bcf86cd799439020&startDate=2024-06-01&endDate=2024-06-30
```

**Response** (200):
```json
{
  "success": true,
  "attendance": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "classId": "507f1f77bcf86cd799439020",
      "date": "2024-06-21",
      "records": [
        {
          "studentId": "507f1f77bcf86cd799439030",
          "studentName": "Chisom Okafor",
          "status": "present"
        }
      ]
    }
  ]
}
```

---

#### Create Subject
```
POST /api/teacher/subjects
```

**Headers**:
```
x-user-id: 507f1f77bcf86cd799439011
```

**Request**:
```json
{
  "schoolId": "507f1f77bcf86cd799439012",
  "name": "Mathematics",
  "code": "MATH101",
  "description": "Core mathematics subject",
  "creditHours": 3,
  "curriculum": "Nigerian Curriculum"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Subject created successfully",
  "subject": {
    "_id": "507f1f77bcf86cd799439050",
    "name": "Mathematics",
    "code": "MATH101",
    "school": "507f1f77bcf86cd799439012"
  }
}
```

---

#### Submit Assessment/Grade
```
POST /api/teacher/assessments
```

**Request**:
```json
{
  "schoolId": "507f1f77bcf86cd799439012",
  "classId": "507f1f77bcf86cd799439020",
  "subjectId": "507f1f77bcf86cd799439050",
  "studentId": "507f1f77bcf86cd799439030",
  "type": "exam",
  "score": 85,
  "totalScore": 100,
  "assessmentDate": "2024-06-21",
  "comments": "Excellent performance"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Assessment recorded successfully",
  "assessment": { /* assessment object */ }
}
```

---

#### Provide Feedback to Student
```
POST /api/teacher/feedback
```

**Request**:
```json
{
  "schoolId": "507f1f77bcf86cd799439012",
  "studentId": "507f1f77bcf86cd799439030",
  "classId": "507f1f77bcf86cd799439020",
  "type": "academic",
  "message": "Great progress in mathematics. Keep it up!",
  "rating": 4
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "feedbackId": "507f1f77bcf86cd799439060"
}
```

---

### 5. Parent Portal Endpoints

#### Get My Children
```
GET /api/parent/students
```

**Response** (200):
```json
{
  "success": true,
  "students": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "firstName": "Chisom",
      "lastName": "Okafor",
      "admissionNumber": "PS4A001",
      "classId": "507f1f77bcf86cd799439020",
      "className": "Primary 4A",
      "schoolId": "507f1f77bcf86cd799439012",
      "dateOfBirth": "2015-05-12",
      "currentCGPA": 3.8
    }
  ]
}
```

---

#### Get Child's Assessments
```
GET /api/parent/students/[studentId]/assessments
```

**Query Parameters**:
```
?term=first&academicYear=2023/2024
```

**Response** (200):
```json
{
  "success": true,
  "assessments": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "subject": "Mathematics",
      "type": "exam",
      "score": 85,
      "totalScore": 100,
      "date": "2024-06-21",
      "grade": "A",
      "teacher": "Mr. John Doe"
    }
  ]
}
```

---

#### Get Child's Attendance
```
GET /api/parent/students/[studentId]/attendance
```

**Query Parameters**:
```
?startDate=2024-06-01&endDate=2024-06-30
```

**Response** (200):
```json
{
  "success": true,
  "attendance": {
    "presentDays": 20,
    "absentDays": 2,
    "lateArrivals": 1,
    "attendancePercentage": 95.2,
    "records": [
      {
        "date": "2024-06-21",
        "status": "present"
      }
    ]
  }
}
```

---

#### Get Child's Feedback
```
GET /api/parent/students/[studentId]/feedback
```

**Response** (200):
```json
{
  "success": true,
  "feedback": [
    {
      "_id": "507f1f77bcf86cd799439060",
      "type": "academic",
      "message": "Great progress in mathematics",
      "rating": 4,
      "teacher": "Mr. John Doe",
      "date": "2024-06-21"
    }
  ]
}
```

---

### 6. Admin Dashboard Endpoints

#### Get Dashboard Statistics
```
GET /api/dashboard/stats
```

**Response** (200):
```json
{
  "success": true,
  "stats": {
    "totalUsers": 1250,
    "schoolLeaders": 50,
    "learningSpecialists": 20,
    "teachers": 300,
    "parents": 800,
    "admins": 5,
    "students": 5000,
    "blogs": 45,
    "contacts": 120,
    "requests": 15,
    "pendingContacts": 8,
    "pendingQuotes": 7
  },
  "timestamp": "2024-06-21T10:30:00Z"
}
```

---

#### Get Pending Registrations
```
GET /api/admin/registrations
```

**Query Parameters**:
```
?status=pending&page=1&pageSize=10
```

**Response** (200):
```json
{
  "success": true,
  "registrations": [
    {
      "_id": "507f1f77bcf86cd799439070",
      "firstName": "Adekunle",
      "lastName": "Akin",
      "email": "adekunle@example.com",
      "role": "teacher",
      "schoolId": "507f1f77bcf86cd799439012",
      "status": "pending",
      "submittedAt": "2024-06-20T15:30:00Z"
    }
  ],
  "page": 1,
  "totalCount": 8,
  "totalPages": 1
}
```

---

#### Approve/Reject Registration
```
POST /api/admin/registrations
```

**Request**:
```json
{
  "registrationId": "507f1f77bcf86cd799439070",
  "action": "approve",
  "notes": "Registration approved"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Registration approved successfully"
}
```

---

#### Create Academic Calendar
```
POST /api/admin/academic-calendar
```

**Request**:
```json
{
  "schoolId": "507f1f77bcf86cd799439012",
  "academicYear": "2024/2025",
  "sessions": [
    {
      "name": "First Term",
      "startDate": "2024-09-01",
      "endDate": "2024-11-30"
    },
    {
      "name": "Second Term",
      "startDate": "2025-01-06",
      "endDate": "2025-03-30"
    }
  ]
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Academic calendar created successfully",
  "calendar": { /* calendar object */ }
}
```

---

### 7. Blog & Content Management

#### Create Blog Post (Admin)
```
POST /api/blog
```

**Request**:
```json
{
  "title": "Getting Started with Kiddies Check",
  "slug": "getting-started-kiddies-check",
  "content": "## Introduction...",
  "excerpt": "Learn how to use Kiddies Check effectively",
  "author": "507f1f77bcf86cd799439011",
  "status": "published",
  "featuredImage": "https://cloudinary.com/..."
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Blog post created successfully",
  "blog": { /* blog object */ }
}
```

---

#### Get Published Blogs
```
GET /api/blog
```

**Query Parameters**:
```
?page=1&pageSize=10&status=published&search=education
```

**Response** (200):
```json
{
  "success": true,
  "blogs": [
    {
      "_id": "507f1f77bcf86cd799439080",
      "title": "Getting Started with Kiddies Check",
      "slug": "getting-started-kiddies-check",
      "excerpt": "Learn how to use Kiddies Check effectively",
      "author": {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "lastName": "Doe"
      },
      "createdAt": "2024-06-21T10:00:00Z",
      "readTime": 5
    }
  ],
  "page": 1,
  "totalCount": 45,
  "totalPages": 5
}
```

---

#### Submit Contact Form
```
POST /api/contact
```

**Request**:
```json
{
  "firstName": "Chioma",
  "lastName": "Nwankwo",
  "email": "chioma@example.com",
  "phone": "+234801234567",
  "subject": "Product Inquiry",
  "message": "I would like to know more about your services"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "Thank you for contacting us. We will get back to you soon."
}
```

---

### 8. AI Chat API

#### Send Chat Message
```
POST /api/ai/chat
```

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Request**:
```json
{
  "message": "How is Chisom performing in mathematics?",
  "context": {
    "studentId": "507f1f77bcf86cd799439030",
    "role": "parent"
  }
}
```

**Response** (200):
```json
{
  "success": true,
  "response": "Based on Chisom's recent assessments, he scored 85/100 in the last mathematics exam. This shows good understanding of the subject. His teacher noted...",
  "context": {
    "studentId": "507f1f77bcf86cd799439030",
    "conversationId": "507f1f77bcf86cd799439090"
  }
}
```

---

### 9. File Upload & Media

#### Upload File
```
POST /api/upload
```

**Request** (Form Data):
```
file: <binary file data>
type: "school-logo" | "student-photo" | "gallery"
schoolId: "507f1f77bcf86cd799439012"
```

**Response** (201):
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "url": "https://cloudinary.com/...",
    "publicId": "kiddies-check/school-logo-12345",
    "size": 245678,
    "type": "image/png"
  }
}
```

---

## Code Examples

### JavaScript/Node.js - Axios

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// Create axios instance with auth
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (error) {
    console.error('Login failed:', error.response?.data);
    throw error;
  }
};

// Get schools
export const getSchools = async (page = 1, pageSize = 10) => {
  try {
    const response = await api.get('/schools', {
      params: { page, pageSize }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch schools:', error.response?.data);
    throw error;
  }
};

// Mark attendance
export const markAttendance = async (classId, records) => {
  try {
    const response = await api.post('/teacher/attendance', {
      classId,
      date: new Date().toISOString().split('T')[0],
      records
    });
    return response.data;
  } catch (error) {
    console.error('Failed to mark attendance:', error.response?.data);
    throw error;
  }
};

// Logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
```

---

### React - Using the API

```jsx
import React, { useState, useEffect } from 'react';
import { api, markAttendance } from './services/api';

function AttendanceForm({ classId }) {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [classId]);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/teacher/students', {
        params: { classId }
      });
      setStudents(response.data.students);
      // Initialize attendance
      const initialAttendance = {};
      response.data.students.forEach(student => {
        initialAttendance[student._id] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status
      }));

      await markAttendance(classId, records);
      alert('Attendance marked successfully');
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <table>
        <tbody>
          {students.map(student => (
            <tr key={student._id}>
              <td>{student.firstName} {student.lastName}</td>
              <td>
                <select
                  value={attendance[student._id] || 'present'}
                  onChange={(e) => setAttendance({
                    ...attendance,
                    [student._id]: e.target.value
                  })}
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Attendance'}
      </button>
    </form>
  );
}

export default AttendanceForm;
```

---

### Python - Using Requests

```python
import requests
import json
from datetime import datetime

API_BASE = "http://localhost:3000/api"

class KiddiesCheckAPI:
    def __init__(self):
        self.base_url = API_BASE
        self.token = None
        self.session = requests.Session()

    def login(self, email, password):
        """Login and get JWT token"""
        response = self.session.post(
            f"{self.base_url}/auth/login",
            json={"email": email, "password": password}
        )
        data = response.json()
        self.token = data['token']
        self.session.headers.update({
            'Authorization': f'Bearer {self.token}'
        })
        return data['user']

    def get_schools(self, page=1, page_size=10):
        """Get list of schools"""
        response = self.session.get(
            f"{self.base_url}/schools",
            params={"page": page, "pageSize": page_size}
        )
        return response.json()

    def get_students(self, class_id):
        """Get students in a class"""
        response = self.session.get(
            f"{self.base_url}/teacher/students",
            params={"classId": class_id}
        )
        return response.json()

    def mark_attendance(self, class_id, records):
        """Mark attendance for a class"""
        response = self.session.post(
            f"{self.base_url}/teacher/attendance",
            json={
                "classId": class_id,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "records": records
            }
        )
        return response.json()

# Usage
api = KiddiesCheckAPI()
user = api.login("teacher@example.com", "password123")
print(f"Logged in as: {user['firstName']} {user['lastName']}")

# Get schools
schools = api.get_schools()
print(f"Total schools: {schools['totalCount']}")

# Mark attendance
records = [
    {"studentId": "507f1f77bcf86cd799439030", "status": "present"},
    {"studentId": "507f1f77bcf86cd799439031", "status": "absent"}
]
result = api.mark_attendance("507f1f77bcf86cd799439020", records)
print(result)
```

---

### cURL Examples

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

#### Get Schools
```bash
curl -X GET "http://localhost:3000/api/schools?page=1&pageSize=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Mark Attendance
```bash
curl -X POST http://localhost:3000/api/teacher/attendance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "classId": "507f1f77bcf86cd799439020",
    "date": "2024-06-21",
    "records": [
      {"studentId": "507f1f77bcf86cd799439030", "status": "present"}
    ]
  }'
```

---

## Environment Variables

Create a `.env.local` file with the following:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kiddies-check

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

# Email Service (Brevo)
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@kiddies-check.com
BREVO_SENDER_NAME=Kiddies Check

# AI Service (Groq)
GROQ_API_KEY=your-groq-api-key

# File Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# API Configuration
API_URL=http://localhost:3000
NODE_ENV=development
```

---

## Troubleshooting

### Common Issues

#### 1. "No token provided" (401 Error)

**Problem**: API returns 401 Unauthorized

**Solutions**:
- Ensure you're including the Authorization header
- Check that the token hasn't expired (re-login if needed)
- Verify the token format: `Bearer <token>` (with space)

```javascript
// Correct
headers: { Authorization: `Bearer ${token}` }

// Incorrect
headers: { Authorization: token } // Missing "Bearer "
```

---

#### 2. "Invalid token" (401 Error)

**Problem**: Token is invalid or corrupted

**Solutions**:
- Verify token is complete (not truncated)
- Check if password was changed (requires re-login)
- Ensure JWT_SECRET matches in production

```javascript
// Verify token before sending
const token = localStorage.getItem('token');
if (!token || token === 'undefined') {
  // Token missing, redirect to login
}
```

---

#### 3. "Access denied" (403 Error)

**Problem**: User lacks permissions

**Solutions**:
- Check user role matches endpoint requirements
- Verify user is active (isActive: true)
- Ensure schoolId matches if required

**Role Requirements**:
- Schools endpoints: admin or learning-specialist
- User management: admin only
- Teacher endpoints: teacher (own school), admin, learning-specialist
- Parent endpoints: parent only (own children)

---

#### 4. "User not found" (404 Error)

**Problem**: User associated with token doesn't exist

**Solutions**:
- Ensure user account exists in database
- Check if user was deleted
- Try re-login

---

#### 5. Timeout Errors

**Problem**: Requests timing out

**Solutions**:
- Check network connectivity
- Verify API server is running
- Increase timeout value (default: 5000ms)

```javascript
const response = await fetch(url, {
  timeout: 10000, // 10 seconds
  signal: AbortSignal.timeout(10000)
});
```

---

#### 6. CORS Errors

**Problem**: "No 'Access-Control-Allow-Origin' header"

**Solutions**:
- API should have CORS enabled in Next.js
- Check allowed origins in production
- Use same domain or configure CORS headers

**Next.js Configuration**:
```javascript
// next.config.mjs
export default {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' }
        ]
      }
    ]
  }
}
```

---

#### 7. "School ID not found" or "Access denied to school"

**Problem**: User doesn't have access to requested school

**Solutions**:
- Verify schoolId is valid
- Ensure user is member of school (for teachers, parents)
- Check if user has multi-school access (admin, learning-specialist)
- For parents: ensure child is enrolled in that school

---

## Rate Limiting & Best Practices

### Rate Limiting (Recommended Implementation)

Currently not enforced, but recommended:

```javascript
// Implement rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);
```

---

### Best Practices

#### 1. Token Storage
```javascript
// Good: Use httpOnly cookies (most secure)
// Server sets: Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict

// Acceptable: sessionStorage (secure in HTTPS)
sessionStorage.setItem('token', token);

// Avoid: localStorage (vulnerable to XSS)
// localStorage.setItem('token', token); // ❌
```

#### 2. Error Handling
```javascript
try {
  const response = await api.get('/endpoint');
  // Use response
} catch (error) {
  if (error.response?.status === 401) {
    // Redirect to login
  } else if (error.response?.status === 403) {
    // Show permission denied
  } else if (!error.response) {
    // Network error
  }
}
```

#### 3. Request Timeouts
```javascript
// Always set timeouts
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

try {
  await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timeout);
}
```

#### 4. Pagination
```javascript
// Always paginate large result sets
const fetchAllRecords = async (endpoint) => {
  let allRecords = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await api.get(endpoint, { params: { page } });
    allRecords = [...allRecords, ...response.data.data];
    hasMore = page < response.data.totalPages;
    page++;
  }

  return allRecords;
};
```

---

## Support & Contact

For API support:
- **Email**: support@kiddies-check.com
- **Documentation**: https://docs.kiddies-check.com
- **Issue Tracker**: https://github.com/kiddies-check/issues

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-06-21 | Initial API documentation |

---

## License

This API documentation is part of the Kiddies Check project and is provided as-is for authorized users.

Last Updated: 2024-06-21
