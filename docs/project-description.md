# Project Description — M.I.A System

## Executive Summary

**M.I.A (Metropolitan Information Agent)** is a comprehensive web-based university management system designed to centralise academic operations for students, professors, and administrators on a single platform. The system's standout feature is an AI-powered academic adviser integrated exclusively into the student portal, providing instant personalised answers to academic questions without requiring appointments with human advisers. Beyond student support, the platform gives professors a unified workspace for course management, grade recording, attendance tracking, and assignment handling, while administrators gain complete oversight of user accounts, roles, institutional data, and financial operations. The target audience is staff and students at Metropolitan University of Tirana, accessible via web browser (desktop-first, responsive design) with role-based authentication.

---

## Problem Statement

### Current State (Fragmentation)
Metropolitan University currently operates with disconnected systems that create friction for all stakeholders:

**For Students:**
- No self-service way to get academic guidance — requires booking appointments with human advisers
- Cannot access real-time GPA, transcript, or graduation progress tracking
- Assignment submission is fragmented across email and disconnected portals
- No single place to view all courses, grades, attendance, and financial obligations
- Waiting times for adviser appointments (often days) hinder academic planning

**For Professors:**
- Multiple tools required: email, spreadsheets, separate portals for grades and attendance
- No unified interface to manage course materials, record grades, and track attendance
- Manual data entry prone to errors
- Limited visibility into student progress and engagement
- Enrollment management is tedious and error-prone

**For Administrators:**
- No unified user management dashboard (must manage students and professors separately)
- No central reporting on academic operations
- Financial operations (tuition, payments, scholarships) managed externally
- Limited audit trail for compliance and record-keeping
- Difficult to enforce policies across disconnected systems

### Desired State (M.I.A Solution)
One unified platform that eliminates fragmentation:
- **Students** get instant AI-powered academic guidance and self-service progress tracking
- **Professors** have one place to manage everything related to their courses
- **Administrators** have complete visibility and control over institutional data

---

## Solution Overview

### Core Value Propositions

**For Students:**
- **Instant Academic Guidance** — M.I.A AI adviser answers questions in natural language (e.g., "When do I graduate?" "What electives should I take?") without waiting for adviser appointments
- **Self-Service Progress Tracking** — Real-time access to grades, GPA, attendance, and graduation credit hours
- **Unified Academic Hub** — All courses, assignments, and financial information in one dashboard
- **Personalized Experience** — System remembers preferences and context across conversations

**For Professors:**
- **Single Workspace** — Courses, grades, attendance, assignments, and materials in one interface
- **Efficient Workflow** — Bulk operations (upload grades for entire class at once)
- **Clear Class Visibility** — Roster, attendance patterns, grade distribution at a glance
- **Streamlined Communication** — Unified feedback on student submissions

**For Administrators:**
- **Complete Control** — User management, role assignment, and institutional oversight
- **Financial Management** — Configure tuition fees, track payments, manage installment plans
- **Reporting & Analytics** — System reports for enrollment, academic performance, and financial status
- **Audit Trail** — All operations logged for compliance and policy enforcement

---

## System Architecture

### Technology Stack

| Layer | Technology | Purpose | Rationale |
|-------|-----------|---------|-----------|
| **Frontend** | React 18 + TypeScript | Web UI for all 3 dashboards | Modern, component-based, large ecosystem |
| **Frontend Styling** | Tailwind CSS | Responsive utility-first styling | Fast iteration, consistent design system |
| **Frontend Build** | Vite | Module bundling and dev server | Fast HMR, optimized production builds |
| **Backend API** | Python 3.11 + FastAPI | REST API server | Fast development, async I/O, auto OpenAPI docs |
| **Authentication** | JWT + Supabase Auth | Session management | Stateless, scalable, secure |
| **Database** | PostgreSQL | Relational data persistence | Reliable ACID transactions, rich data types |
| **Database Hosting** | Supabase | Managed PostgreSQL | Eliminates DevOps overhead, built-in auth |
| **File Storage** | Supabase Storage (S3-compatible) | Course materials, assignment submissions | Scalable, integrated with auth |
| **AI/LLM** | Groq API or Gemini API | M.I.A conversational AI | Low latency (<50ms), cost-effective inference |
| **Deployment** | Docker + Railway/Render | Containerized deployment | Portable, scalable, CI/CD friendly |
| **Version Control** | GitHub | Source control + collaboration | Industry standard, issue tracking, PR workflow |

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Web Browser                              │
│  (Role-Based Dashboards: Admin / Professor / Student)            │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP/HTTPS
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                     Frontend (React + Vite)                      │
│  - Admin Dashboard      - Professor Dashboard   - Student Portal │
│  - Authentication Flow  - Data Visualization   - M.I.A Chat UI  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ REST API
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│               FastAPI Backend (Python)                           │
│  Routes:  /api/auth  /api/users  /api/courses  /api/grades      │
│           /api/attendance  /api/assignments  /api/chat           │
│  - Request validation (Pydantic)                                 │
│  - Business logic + database queries                             │
│  - Error handling + logging                                      │
└──────┬──────────────────────┬──────────────────────┬────────────┘
       │                      │                      │
       │                      │                      │
   ┌───▼──┐          ┌────────▼────────┐      ┌─────▼──────┐
   │      │          │                 │      │            │
┌──▼──────▼────┐  ┌──▼──────────────────▼─┐  │  Groq API  │
│ PostgreSQL   │  │  Supabase Storage     │  │  / Gemini  │
│ (Supabase)   │  │  (Course materials,   │  │            │
│              │  │   Submissions, Files) │  │ (LLM        │
│ Tables:      │  │                       │  │  Inference)│
│ - Users      │  └───────────────────────┘  │            │
│ - Students   │                             │            │
│ - Professors │                             │            │
│ - Courses    │                             │            │
│ - Grades     │                             │            │
│ - Attendance │                             │            │
│ - etc.       │                             │            │
└──────────────┘                             └────────────┘
```

---

## Features & Scope

### Phase 1: MVP (Core Features)

#### Public Pages
- **Home Page** — Landing page introducing M.I.A, enrollment information, login links
- **Login Page** — Unified login with role-based redirect to correct dashboard

#### Administrator Portal
- **User Management** — Create/update/delete student and professor accounts, bulk import via CSV
- **Role Assignment** — Assign and modify user roles across the system
- **System Overview** — Dashboard showing total users, courses, enrollments, active sessions
- **User Reports** — List all students (searchable/filterable), list all professors by department

#### Professor Portal
- **Course Management** — Create courses, edit course details (code, title, credits, description)
- **Enrollment Management** — View enrolled students, add/remove students from courses
- **Grade Recording** — Record grades per student per course, support for multiple grade components (midterm, final, assignment)
- **Attendance Tracking** — Record attendance per student per class session
- **Assignment Management** — Create assignments, set due dates, view submissions, provide feedback
- **Course Materials** — Upload and organize course materials (PDFs, slides, documents)

#### Student Portal
- **Dashboard** — Overview of current semester (enrolled courses, upcoming assignments, GPA)
- **Course View** — Detailed view per course (description, materials, enrolled peers, professor info)
- **Grades** — View grades per course, calculate GPA, filter by semester/department
- **Attendance** — View attendance record per course (present, absent, late), total hours attended
- **Transcript** — Download academic transcript (GPA, all completed courses, grades)
- **Assignments** — View assignments, submit files/text, view submission status and feedback
- **M.I.A AI Adviser** — Chat interface to ask academic questions (e.g., "What's my graduation timeline?", "What electives should I take?")

#### M.I.A AI Agent (Student Portal Only)
- **Natural Language Q&A** — Answer student questions about their academic progress, course selection, graduation requirements
- **Course Recommendations** — Suggest courses based on student's major, progress, preferences
- **Graduation Timeline** — Calculate remaining credits needed, recommend courses to graduate on time
- **Preference Memory** — Remember student preferences across conversations (e.g., preferred class times, interests)
- **Chat History** — Full conversation history per student, persistent across sessions

### Phase 2: Enhanced Features (Beyond Original Scope)

#### Finance Module
- **Tuition Management** — Administrators configure tuition fees per major/program
- **Auto-Assign Fees** — Automatically assign fee records to new students based on major
- **Installment Plans** — Create payment plans (e.g., 3 monthly installments) and auto-assign
- **Payment Recording** — Track payments received (online, cash, bank transfer)
- **Student Finance Dashboard** — Students see tuition balance, installment schedule, payment history
- **Payment Tracking** — View which installments are paid/overdue, record new payments

#### Scholarship System (Planned)
- **Scholarship Management** — Create scholarship records, set eligibility criteria
- **Student Scholarships** — View eligible scholarships, apply for scholarships
- **Scholarship Awards** — Approve/reject applications, track scholarship amounts

---

## User Personas & Workflows

### Persona 1: Artan (Student)
**Background:** 2nd-year student in Computer Science, wants to graduate on time, needs academic guidance

**Goals:**
- Know which courses to take next semester
- Understand what electives fit his major
- Track progress toward graduation (credit hours needed, GPA requirements)
- View grades and see where he needs improvement
- Download transcript for job applications

**Workflow:**
1. Logs in to student portal
2. Checks dashboard: GPA 3.1, 45 credits completed, 75 remaining (120 total needed)
3. Opens M.I.A: "What electives should I take to graduate on time?"
4. M.I.A recommends courses based on major + remaining requirements
5. Views transcript, downloads for job application
6. Checks assignment submission status for current courses

### Persona 2: Prof. Drita (Professor)
**Background:** Teaches 2 courses (Algorithms, Data Structures), 80 total students, grades manually

**Goals:**
- Manage 2 courses in one place
- Record grades efficiently (currently uses spreadsheets)
- Track attendance to identify at-risk students
- Share course materials with students
- Provide feedback on assignments

**Workflow:**
1. Logs in to professor portal
2. Views class roster for "Algorithms" (30 students)
3. Records attendance for today's class
4. Inputs grades for Assignment 1 (30 students at once via upload or individual entry)
5. Uploads today's lecture slides to course materials
6. Reviews student submissions and adds feedback

### Persona 3: Admin Besnik (Administrator)
**Background:** Registrar managing all academic operations (users, enrollments, fees)

**Goals:**
- Create and manage user accounts (students, professors)
- Enroll students in courses
- Assign roles (student, professor, admin)
- Track financial operations (tuition, payments, scholarships)
- Generate reports for management

**Workflow:**
1. Logs in to admin portal
2. Bulk imports new student cohort (1000 students via CSV)
3. Views system dashboard: 5000 students, 300 professors, 800 courses
4. Configures tuition fees per major (Engineering: $500/semester, Arts: $400)
5. Reviews payment status: 80% of students paid, 20% overdue
6. Generates enrollment report for dean meeting

---

## Functional Requirements

### Authentication & Authorization
- [ ] User login with email and password
- [ ] Passwords hashed and securely stored
- [ ] JWT-based session management
- [ ] Role-based access control (RBAC): Admin, Professor, Student
- [ ] Login redirects to correct dashboard based on role
- [ ] Logout clears session token
- [ ] Password reset via email link
- [ ] Account lockout after 5 failed login attempts

### Student Features
- [ ] View enrolled courses (course code, title, professor, credits, semester)
- [ ] View detailed course page (description, materials, enrollment roster)
- [ ] Download course materials (PDFs, documents)
- [ ] Check grades per course and per semester
- [ ] Calculate and display GPA (weighted by credits)
- [ ] View attendance record per course (presence, absence, late)
- [ ] Submit assignments (file upload or text input)
- [ ] View assignment feedback and grades
- [ ] Download academic transcript (all courses, grades, GPA)
- [ ] Chat with M.I.A (ask questions, get recommendations)
- [ ] View chat history and previous conversations

### Professor Features
- [ ] Create and edit courses (code, title, credits, description, syllabus)
- [ ] Upload course materials (files organized by type: slides, readings, etc.)
- [ ] View enrolled students and class roster
- [ ] Add/remove students from courses (bulk and individual)
- [ ] Record grades (support multiple grade components: midterm, final, assignment)
- [ ] Grade distribution (histogram of grades)
- [ ] Record attendance (per student, per session)
- [ ] Attendance report (who attended what sessions, absence patterns)
- [ ] Create assignments (title, description, due date, file upload)
- [ ] View student submissions (file or text)
- [ ] Provide feedback and grade on submissions
- [ ] View all student submissions for an assignment

### Administrator Features
- [ ] Create user accounts (student, professor, admin)
- [ ] Bulk import users (CSV upload with email, name, role, department)
- [ ] Update user details (name, email, department, status)
- [ ] Delete user accounts (soft delete with audit trail)
- [ ] Assign and change user roles
- [ ] View system overview dashboard (total users, active courses, enrollments)
- [ ] Generate reports (enrollment by major, grade distribution, payment status)
- [ ] Manage tuition fees (set fees per major/program)
- [ ] Track student payments (view payment history, mark payments as received)
- [ ] Manage installment plans (auto-assign to new students)
- [ ] View audit logs (all user actions with timestamps and details)

### M.I.A AI Agent Features
- [ ] Accept student questions in natural language
- [ ] Provide contextual answers about student's academic progress
- [ ] Recommend courses based on major, credits completed, graduation requirements
- [ ] Calculate graduation timeline (credits needed, courses to take)
- [ ] Store conversation history per student
- [ ] Remember student preferences (class time preferences, interests)
- [ ] Handle multi-turn conversations (maintain context across messages)
- [ ] Gracefully handle out-of-scope questions

---

## Non-Functional Requirements

### Performance
- Page load time <3 seconds (optimized assets, caching)
- API response time <500ms for 95th percentile
- Database queries optimized (indexes on frequently queried columns)
- Support up to 1000 concurrent users without degradation
- LLM inference latency <2 seconds (for M.I.A responses)

### Security
- All passwords hashed (bcrypt, minimum 12 rounds)
- HTTPS for all communications
- SQL injection prevention (parameterized queries)
- XSS prevention (input validation, output encoding)
- CSRF protection on state-changing operations
- Rate limiting on login attempts
- No sensitive data in URLs or logs
- Secure session management (HTTPOnly cookies, CSRF tokens)

### Reliability
- Database backups daily (automated)
- 99.5% uptime SLA
- Graceful error handling (user-friendly error messages)
- Logging and monitoring of critical operations
- Automated rollback of failed deployments

### Scalability
- Horizontal scaling of API servers (behind load balancer)
- Database connection pooling
- Caching strategy for frequently accessed data
- Asynchronous job processing for heavy operations (bulk imports, report generation)

### Usability
- Responsive design (mobile, tablet, desktop)
- Accessible (WCAG 2.1 AA compliance)
- Intuitive navigation across all 3 portals
- Clear error messages that suggest fixes
- Consistent design language (colors, typography, spacing)

---

## Project Timeline & Milestones

| Phase | Milestone | Duration | Target Date | Deliverables |
|-------|-----------|----------|-------------|-------------|
| **Discovery** | Technology Research & POC | 2 weeks | 2026-04-12 | Tech stack validated, architecture documented |
| **Design** | UI/UX Design & Architecture | 2 weeks | 2026-04-26 | Wireframes, data model, API contracts |
| **Development Sprint 1** | Auth + Core API | 2 weeks | 2026-05-10 | Login working, basic CRUD endpoints |
| **Development Sprint 2** | Admin + Professor Features | 2 weeks | 2026-05-24 | User management, grade recording, attendance |
| **Development Sprint 3** | Student + M.I.A Integration | 2 weeks | 2026-06-07 | Student dashboard, assignment submission, chat |
| **Testing & Polish** | QA, bug fixes, documentation | 2 weeks | 2026-06-21 | <1% critical bugs, full docs, user guides |
| **Deployment** | Production setup, launch | 1 week | 2026-06-28 | Live system, monitoring, support |

---

## Success Criteria

### Functional Success
- [ ] All core features implemented and working
- [ ] M.I.A AI agent responds to academic questions with >80% accuracy
- [ ] Zero critical bugs in production
- [ ] All user workflows completed without errors

### Performance Success
- [ ] Page load time <3 seconds
- [ ] API response time <500ms (p95)
- [ ] LLM inference <2 seconds
- [ ] System supports 1000+ concurrent users

### Team Success
- [ ] All milestones met on schedule
- [ ] Codebase is clean and well-documented
- [ ] Team morale remains high
- [ ] Knowledge shared across all team members

### Client Success
- [ ] Client approves all features
- [ ] System is used by students and professors in beta
- [ ] Positive feedback on M.I.A AI adviser
- [ ] Ready for full campus rollout

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| LLM API latency too high | Medium | High | Evaluate multiple APIs early (Groq + Gemini), implement fallback responses |
| Database performance issues at scale | Medium | High | Load testing early, connection pooling, query optimization |
| Team member unavailable | Low | Medium | Knowledge sharing sessions, documentation, cross-training |
| Scope creep (additional features requested) | High | Medium | Strict scope adherence, defer to Phase 2, document trade-offs |
| Integration complexity (frontend + backend + LLM) | Medium | Medium | Early integration testing, API contract validation, E2E tests |

---

## Success Metrics (Trackable KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Code Coverage | >80% | Automated test suite |
| Deployment Success Rate | >99% | CI/CD pipeline |
| API Response Time (p95) | <500ms | Application monitoring |
| Student Satisfaction with M.I.A | >4.0/5.0 | Post-beta survey |
| System Uptime | 99.5% | Monitoring dashboard |
| Feature Completion | 100% | Sprint burndown |

---

*Last updated: 2026-06-03*
