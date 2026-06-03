# M.I.A: Metropolitan Information Agent
## Comprehensive Project Overview & Presentation Guide

---

## Executive Summary

**M.I.A (Metropolitan Information Agent)** is a full-stack, AI-powered university management system developed for Metropolitan University of Tirana. The system consolidates fragmented academic operations into a unified platform serving three distinct user roles: **Students**, **Professors**, and **Administrators**. 

### The Vision
Eliminate the friction in university operations by providing:
- **Students:** Instant AI-powered academic guidance and self-service progress tracking
- **Professors:** One unified workspace for all course-related operations
- **Administrators:** Complete visibility and control over institutional data

### Key Innovation: M.I.A AI Adviser
The standout feature is a conversational AI adviser embedded in the student portal, powered by Groq or Gemini APIs, that provides personalised academic guidance in natural language without requiring human adviser appointments.

### Timeline
- **Start:** April 2026
- **Launch:** June 2026
- **Client:** Metropolitan University of Tirana (~5,000 students, 300+ faculty)

---

## Table of Contents

1. [The Problem](#the-problem)
2. [The Solution](#the-solution)
3. [System Architecture](#system-architecture)
4. [Features & Capabilities](#features--capabilities)
5. [Technical Implementation](#technical-implementation)
6. [Team & Organization](#team--organization)
7. [Research & Validation](#research--validation)
8. [Project Methodology](#project-methodology)
9. [Timeline & Milestones](#timeline--milestones)
10. [Success Criteria & Metrics](#success-criteria--metrics)
11. [Risk Management](#risk-management)

---

## The Problem

### Current State: System Fragmentation

Metropolitan University currently operates with **disconnected, manual processes** that create friction for all stakeholders:

#### Students Face
- No self-service access to academic progress (requires 24-48 hour registrar requests)
- Assignment submission scattered across email and portals
- No unified academic dashboard
- Limited real-time guidance on graduation timeline and course planning
- No visibility into tuition balance or payment status
- Waiting days for adviser appointments

#### Professors Face
- Multiple systems required: email, spreadsheets, Moodle, paper records
- Manual grade entry (30+ minutes per class)
- Tedious attendance tracking
- Limited visibility into student progress
- Scattered materials across multiple platforms

#### Administrators Face
- Decentralized user management
- Manual report generation
- Financial operations disconnected from academic system
- Weak audit trails
- No unified institutional view

### Impact
- **Inefficiency:** 40-50% of registrar time spent on manual data entry
- **Errors:** Data inconsistencies across systems
- **Frustration:** Students wait days for information they should access instantly
- **Scalability:** System cannot grow without proportional increase in administrative staff

---

## The Solution

### M.I.A System Overview

A **unified, modern, web-based platform** that consolidates all academic operations:

#### Core Value Propositions

**For Students:**
```
┌─────────────────────────────────────────┐
│ M.I.A Student Portal                    │
├─────────────────────────────────────────┤
│ • View grades, GPA, attendance, transcript
│ • Submit assignments with status tracking
│ • Access course materials
│ • Chat with M.I.A AI adviser (24/7)
│ • Track tuition balance & payments
│ • Real-time graduation progress
└─────────────────────────────────────────┘
```

**For Professors:**
```
┌─────────────────────────────────────────┐
│ M.I.A Professor Dashboard               │
├─────────────────────────────────────────┤
│ • Manage courses & enrollment
│ • Record grades (bulk & individual)
│ • Track attendance efficiently
│ • Organize course materials
│ • Manage assignments & feedback
│ • View class progress & analytics
└─────────────────────────────────────────┘
```

**For Administrators:**
```
┌─────────────────────────────────────────┐
│ M.I.A Admin Portal                      │
├─────────────────────────────────────────┤
│ • Create/manage user accounts
│ • Assign roles & permissions
│ • System overview & dashboards
│ • Configure tuition fees & payment plans
│ • Track financial operations
│ • Generate institutional reports
│ • View audit logs & compliance data
└─────────────────────────────────────────┘
```

### Why M.I.A AI Adviser Matters

Student question: *"What courses should I take to graduate on time?"*

**Old way (before M.I.A):**
1. Student books adviser appointment (wait 5-7 days)
2. Adviser reviews transcript manually (15 min)
3. Adviser checks graduation requirements (10 min)
4. Adviser makes recommendation (5 min)
5. **Total: ~1 week + adviser labor**

**New way (with M.I.A):**
1. Student opens M.I.A chat
2. Types: "What courses should I take to graduate on time?"
3. M.I.A retrieves student profile (grades, credits, major requirements)
4. M.I.A generates personalized recommendation
5. **Total: <10 seconds, 24/7 available**

---

## System Architecture

### High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│              WEB BROWSERS (Devices)                  │
│  Desktop / Tablet / Mobile (Responsive Design)      │
└────────────────────┬─────────────────────────────────┘
                     │ HTTP/HTTPS
                     ↓
┌──────────────────────────────────────────────────────┐
│            FRONTEND LAYER (React + Vite)             │
│  ┌──────────────────────────────────────────────┐   │
│  │ Admin Dashboard  │ Professor Dashboard │      │   │
│  │ Student Portal   │ M.I.A Chat UI      │      │   │
│  └──────────────────────────────────────────────┘   │
│  • Component-based UI • State management (React)    │
│  • Responsive design (Tailwind CSS)                 │
│  • TypeScript type safety                           │
└────────────────────┬─────────────────────────────────┘
                     │ REST API Calls
                     ↓
┌──────────────────────────────────────────────────────┐
│          BACKEND API LAYER (FastAPI + Python)        │
│  ┌──────────────────────────────────────────────┐   │
│  │ /api/auth      → Authentication, JWT tokens │   │
│  │ /api/users     → User management            │   │
│  │ /api/courses   → Course operations          │   │
│  │ /api/grades    → Grade recording            │   │
│  │ /api/attendance→ Attendance tracking        │   │
│  │ /api/assignments→ Assignment handling       │   │
│  │ /api/chat      → M.I.A chat interface       │   │
│  └──────────────────────────────────────────────┘   │
│  • Request validation (Pydantic models)             │
│  • Business logic & workflows                       │
│  • Database ORM (SQLAlchemy)                        │
│  • Error handling & logging                         │
└────────────────┬──────────────────┬─────────────────┘
                 │                  │
        ┌────────▼─────────┐  ┌─────▼────────────┐
        │   PostgreSQL     │  │ Groq/Gemini API  │
        │   (via Supabase) │  │ (LLM Inference)  │
        │                  │  │                  │
        │ • Users table    │  │ • M.I.A responses│
        │ • Courses table  │  │ • Chat answers   │
        │ • Grades table   │  │ • Recommendations
        │ • Attendance tbl │  │                  │
        │ • Assignments    │  │ Latency: <500ms  │
        │ • etc.           │  │ Cost: $0.0005/req
        └──────────────────┘  └──────────────────┘
                 │
        ┌────────▼────────────────┐
        │  Supabase Storage (S3)  │
        │  • Course materials     │
        │  • Assignment files     │
        │  • Student submissions  │
        └────────────────────────┘
```

### Technology Stack

| Component | Technology | Why? |
|-----------|-----------|------|
| **Frontend** | React 18 + TypeScript | Component-based, large ecosystem, type-safe |
| **Styling** | Tailwind CSS | Rapid development, responsive, consistent design |
| **Build Tool** | Vite | Fast HMR, optimized bundles, modern tooling |
| **Backend** | Python 3.11 + FastAPI | Fast async, auto docs, AI-friendly ecosystem |
| **Database** | PostgreSQL (Supabase) | Reliable, ACID compliant, managed hosting |
| **File Storage** | Supabase Storage | S3-compatible, integrated auth, scalable |
| **AI/LLM** | Groq API or Gemini | Low latency (<50ms), cost-effective, production-ready |
| **Authentication** | JWT + Supabase Auth | Stateless, scalable, secure |
| **Deployment** | Docker + Railway/Render | Containerized, CI/CD friendly, easy scaling |
| **VCS** | GitHub | Collaboration, issue tracking, CI/CD integration |

### Why This Stack?

**Validated through research:** All technologies validated through proof-of-concept (POC) implementations before project start.

-  FastAPI proven to handle async I/O efficiently
-  React + Vite provides fast development feedback loop
-  Tailwind CSS reduces styling iteration time
-  Groq API meets <500ms latency target for M.I.A
-  PostgreSQL handles relational academic data perfectly
-  Supabase eliminates DevOps overhead

---

## Features & Capabilities

### Phase 1: MVP (Minimum Viable Product)

#### Public Pages
- **Home Page** — Welcome, university info, login access
- **Login Page** — Role-based authentication

#### Student Portal (Core)
| Feature | Description | Benefit |
|---------|-------------|---------|
| **Dashboard** | Courses, grades, GPA, upcoming assignments | Quick academic overview |
| **Grades** | View per-course grades, calculate GPA | Instant progress tracking |
| **Attendance** | Track attendance by course | Know your attendance record |
| **Courses** | View enrolled courses, materials, professor info | Unified course info |
| **Transcript** | Download official transcript | For job applications |
| **Assignments** | Submit files/text, track status | Organized submission |
| **Tuition** | View balance, payment schedule, history | Financial transparency |
| **M.I.A Chat** | Ask academic questions, get recommendations | Instant guidance 24/7 |

#### Professor Portal (Core)
| Feature | Description | Benefit |
|---------|-------------|---------|
| **My Courses** | View/edit course details | Central course hub |
| **Roster** | View enrolled students, manage enrollment | Easy roster management |
| **Grades** | Record individual/bulk grades | Efficient grading |
| **Attendance** | Track attendance per session | Organized attendance |
| **Assignments** | Create, view submissions, provide feedback | Unified workflow |
| **Materials** | Upload course materials | Organized content |

#### Admin Portal (Core)
| Feature | Description | Benefit |
|---------|-------------|---------|
| **Users** | Create, edit, delete accounts | Centralized user mgmt |
| **Roles** | Assign/manage roles | Permission control |
| **Dashboard** | System overview, key metrics | Institutional visibility |
| **Reports** | Enrollment, grades, payments | Data-driven planning |
| **Tuition** | Configure fees, payment plans | Financial management |
| **Payments** | Track payments, record receipts | Financial tracking |

### Phase 2: Enhanced Features (Beyond Scope)

- Scholarship system
- Advanced financial analytics
- Mobile app
- Student-professor messaging
- Grade appeal workflow
- Course evaluation surveys

---

## Technical Implementation

### Backend Architecture

#### API Design Principles
- RESTful endpoints (`GET /api/students`, `POST /api/grades`)
- Pydantic models for strict validation
- Comprehensive error handling
- JWT-based authentication
- Role-based access control (RBAC)

#### Example: Grade Recording Workflow

```python
# POST /api/grades
{
  "student_id": "uuid-123",
  "course_id": "uuid-456",
  "grade_value": 85.5,
  "grade_type": "final_exam",
  "weight": 0.4,
  "semester": "Spring 2026"
}

# Backend processes:
1. Authenticate user (JWT token)
2. Authorize (user is professor of this course)
3. Validate input (grade 0-100, valid course/student)
4. Check business logic (no grades before semester starts)
5. Insert into database
6. Return 201 Created + created record
```

#### Database Schema (Key Tables)

```
USERS
├── id (PK)
├── email
├── password_hash
├── role (admin, professor, student)
├── name
└── created_at

STUDENTS
├── id (PK)
├── user_id (FK → USERS)
├── major
├── enrolled_year
├── credits_earned
├── gpa
└── ...

COURSES
├── id (PK)
├── code
├── title
├── credits
├── professor_id (FK → PROFESSORS)
├── semester
└── ...

GRADES
├── id (PK)
├── student_id (FK → STUDENTS)
├── course_id (FK → COURSES)
├── value (0-100)
├── grade_type (midterm, final, assignment)
├── weight (0-1)
└── created_at

ATTENDANCE
├── id (PK)
├── student_id (FK → STUDENTS)
├── course_id (FK → COURSES)
├── date
├── status (present, absent, late)
├── hours_present
└── ...

ASSIGNMENTS
├── id (PK)
├── course_id (FK → COURSES)
├── title
├── due_date
├── file_url
└── ...

SUBMISSIONS
├── id (PK)
├── student_id (FK → STUDENTS)
├── assignment_id (FK → ASSIGNMENTS)
├── file_url
├── submitted_at
├── grade
├── feedback
└── ...

CHAT_SESSIONS
├── id (PK)
├── student_id (FK → STUDENTS)
├── started_at
└── ...

MESSAGES
├── id (PK)
├── session_id (FK → CHAT_SESSIONS)
├── role (user, assistant)
├── content
└── created_at

STUDENT_PREFERENCES
├── id (PK)
├── student_id (FK → STUDENTS)
├── key (preference_name)
├── value
└── updated_at
```

### Frontend Architecture

#### Component Hierarchy (Student Portal)

```
App
├── Layout
│   ├── Navigation (topbar)
│   ├── Sidebar (menu)
│   └── MainContent
│       ├── Dashboard
│       │   ├── CourseCard
│       │   ├── GradeCard
│       │   └── AnnouncementCard
│       ├── Grades
│       │   ├── GradeTable
│       │   └── GPACalculator
│       ├── Courses
│       │   ├── CourseList
│       │   └── CourseDetail
│       │       ├── Materials
│       │       ├── ClassRoster
│       │       └── Assignments
│       ├── Assignments
│       │   ├── AssignmentList
│       │   └── SubmissionForm
│       ├── Transcript
│       │   └── TranscriptViewer
│       ├── Tuition
│       │   ├── BalanceCard
│       │   ├── PaymentSchedule
│       │   └── TransactionHistory
│       └── MIAChat
│           ├── ChatWindow
│           ├── MessageList
│           ├── InputBox
│           └── ConversationHistory
└── Footer
```

#### State Management (React)

```javascript
// Example: Grade viewing with filtering
const [grades, setGrades] = useState([]);
const [selectedSemester, setSelectedSemester] = useState('Spring 2026');
const [loading, setLoading] = useState(false);

useEffect(() => {
  fetchGradesBySemester(selectedSemester)
    .then(data => setGrades(data))
    .catch(err => showError(err))
    .finally(() => setLoading(false));
}, [selectedSemester]);

// Filter, sort, calculate GPA
const filteredGrades = grades.filter(...);
const gpa = calculateGPA(filteredGrades);
```

### M.I.A AI Agent Architecture

#### Chat Flow

```
Student: "What courses should I take next semester?"
    ↓
[Frontend] Fetch student profile
    ↓
[Backend] GET /api/students/{id} → returns grades, major, credits
    ↓
[Backend] POST /api/chat → send message + context
    ↓
[Backend] Construct LLM prompt:
  "Student is Computer Science major, 45 credits completed,
   needs 75 more. GPA 3.2. Courses completed: [list].
   Question: What courses should I take next?"
    ↓
[LLM API] Send request to Groq/Gemini
    ↓
[LLM API] Return response in <500ms:
  "Based on your progress, I recommend:
   - Data Structures (required for major)
   - Algorithms (prerequisite for advanced courses)
   - Discrete Math (fulfills math requirement)
   This should put you on track to graduate in 2 years."
    ↓
[Backend] Store message in database
    ↓
[Frontend] Display response to student
```

#### Context & Memory

```
STUDENT_PREFERENCES table stores:
- Preferred class times (morning vs evening)
- Interest areas (AI, web dev, mobile dev)
- Career goals
- Learning pace preference

M.I.A uses this to personalize recommendations:
  "I remember you prefer morning classes and are interested
   in AI. Here are courses matching that profile..."
```

---

## Team & Organization

### Team Composition

| Name | Role | Responsibilities | Contact |
|------|------|-----------------|---------|
| **Xhoi** | Frontend Lead / Captain | React architecture, admin/prof dashboards, project leadership | ikonomixhoja@gmail.com |
| **Ajna** | Frontend Developer / Editor | Student dashboard, M.I.A chat UI, documentation | ajnanushi6@gmail.com |
| **Aida** | Backend Developer / Optimist | FastAPI endpoints, database models, core logic | aida.bedaj@gmail.com |
| **Parashqevi** | Backend Developer / Tester | API routing, auth, Supabase integration, QA | klimi.paro@gmail.com |
| **Loric** | AI Integration / Analyst | M.I.A chatbot, LLM APIs, prompt engineering | hagardloric@gmail.com |

### Communication & Workflow

**Weekly Meeting:** Friday 2 PM
- Status updates (15 min)
- Feature demo (15 min)
- Blockers & decisions (15 min)
- Planning (10 min)

**Branching Strategy:**
```
main (production) ← protected, PR review required
  ↑
  ├── feature/user-auth
  ├── feature/grade-recording
  ├── feature/mia-chat
  ├── fix/login-redirect
  └── docs/api-reference
```

**Pull Request Process:**
1. Push feature branch to origin
2. Create PR with description
3. At least 1 team member reviews
4. Address comments
5. Repo Master merges to main

---

## Research & Validation

### Technology Research Phase (Week 1-2)

Each team member validated one core technology through proof-of-concept (POC):

#### LLM API Evaluation (Loric)
 **Tasks Completed:**
- Created Hello World: send prompt → receive response
- Tested streaming responses
- Measured latency: **<200ms** (exceeds 500ms target)
- Calculated cost: **$0.0003/request** (exceeds $0.001 target)
- Documented authentication flow
- Compared Groq vs Gemini (Groq chosen for latency)

**Key Finding:** Both APIs exceed performance requirements; choose Groq for speed.

#### FastAPI Validation (Aida)
 **Tasks Completed:**
- Created FastAPI project structure
- Built GET/POST endpoints with Pydantic validation
- Auto-generated OpenAPI docs
- Tested async/await with 100 concurrent requests
- Benchmarked response times

**Key Finding:** FastAPI provides excellent DX, auto-generates accurate API docs, handles async efficiently.

#### PostgreSQL + Supabase (Parashqevi)
 **Tasks Completed:**
- Created Supabase project and database
- Built schema with relationships
- Tested connection pooling with 50+ concurrent connections
- Evaluated Supabase dashboard and monitoring
- Tested Row Level Security

**Key Finding:** Supabase eliminates DevOps overhead, dashboard provides good visibility, connection pooling handles load.

#### React + Vite Validation (Xhoi)
 **Tasks Completed:**
- Created Vite + React project
- Built reusable components (Header, Card, Button)
- Implemented state management (useState)
- Tested hot module reloading
- Measured production bundle size: **<150KB** (exceeds 200KB target)

**Key Finding:** Vite + React provides fast feedback loop, bundle optimization excellent, TypeScript integration smooth.

#### Tailwind CSS Validation (Ajna)
 **Tasks Completed:**
- Built responsive layout with utility classes
- Tested dark mode support
- Verified unused CSS stripping
- Measured CSS file size: **<15KB** (exceeds 20KB target)

**Key Finding:** Tailwind accelerates styling, responsive design natural, build optimization excellent.

### Risk Mitigation Through Research
By validating technologies early, we **eliminated major technical risks:**
- LLM latency acceptable for real-time chat
- Database can handle institutional scale
- Frontend bundle sizes under control
- Build tooling meets requirements

---

## Project Methodology

### Agile + Iterative Development

**Sprint Structure:**
- **Sprint Duration:** 2 weeks
- **Sprint Planning:** Monday 10 AM
- **Daily Standup:** 15 min (async via Slack if busy)
- **Sprint Review:** Friday with working demo
- **Retrospective:** Friday post-demo (continuous improvement)

### Definition of Done (DoD)

Work is only "done" when:
-  Code reviewed and approved
-  Tests written (80% coverage minimum)
-  No console errors/warnings
-  Follows team coding standards
-  Documentation updated
-  Tested by QA team
-  Merged to main branch

### Definition of Ready (DoR)

Work items are "ready" for development when:
-  Requirements clear and testable
-  Story points estimated
-  Blocking work identified
-  UI/UX design approved
-  API contracts defined
-  Database schema documented

### Quality Standards

| Metric | Target |
|--------|--------|
| Code Coverage | >80% |
| API Response Time (p95) | <500ms |
| Page Load Time | <3 seconds |
| Uptime | 99.5% |
| Bug Escape Rate | <1 critical bug/100 features |

---

## Timeline & Milestones

### Project Phases

```
┌─────────────────────────────────────────────────────────────────────────┐
│ M.I.A PROJECT TIMELINE                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Apr 2026                                                                │
│ │                                                                       │
│ ├─ Week 1-2: Research & Validation (Technology POCs)                  │
│ │            All 5 technologies validated ✓                           │
│ │                                                                     │
│ ├─ Week 3-4: Design Phase                                            │
│ │            • UI/UX mockups                                         │
│ │            • Data model finalized                                  │
│ │            • API contracts defined                                 │
│ │            • Architecture document                                 │
│ │                                                                     │
│ May 2026                                                                │
│ │                                                                       │
│ ├─ Week 5-8: Development Sprint 1 (Core API + Auth)                  │
│ │            • User authentication (JWT)                             │
│ │            • Role-based access control                             │
│ │            • Basic CRUD endpoints                                  │
│ │            • Database schema                                       │
│ │                                                                     │
│ ├─ Week 9-12: Development Sprint 2 (Academic Features)               │
│ │            • Courses & enrollment                                  │
│ │            • Grades recording & calculation                        │
│ │            • Attendance tracking                                   │
│ │            • Professor dashboard                                   │
│ │                                                                     │
│ ├─ Week 13-16: Development Sprint 3 (Student Portal + M.I.A)         │
│ │            • Student dashboard                                     │
│ │            • Transcript generation                                 │
│ │            • Assignment submission                                 │
│ │            • M.I.A chat integration                                │
│ │                                                                     │
│ June 2026                                                               │
│ │                                                                       │
│ ├─ Week 17-19: Testing & Polish                                      │
│ │            • QA testing (all features)                             │
│ │            • Bug fixes                                             │
│ │            • Performance optimization                              │
│ │            • Security audit                                        │
│ │            • User documentation                                    │
│ │                                                                     │
│ ├─ Week 20-21: Deployment & UAT                                      │
│ │            • Deploy to production environment                      │
│ │            • Client user acceptance testing                        │
│ │            • Final bug fixes                                       │
│ │                                                                     │
│ ├─ Week 22: Go Live                                                  │
│ │            • Official launch                                       │
│ │            • Monitor system health                                 │
│ │            • Support faculty & students                            │
│ │                                                                     │
│ └─ Post-Launch: Support & Phase 2 Planning                           │
│                6 months support commitment                           │
│                Gather feedback for enhancements                      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Milestones

| Date | Milestone | Deliverable | Owner |
|------|-----------|------------|-------|
| 2026-04-12 | Research Complete | All tech POCs validated | Aida, Parashqevi, Xhoi, Ajna, Loric |
| 2026-04-26 | Design Approved | UI mockups, data model, API contracts | Xhoi, Ajna |
| 2026-05-10 | Sprint 1 Done | Auth working, core API endpoints | Aida, Parashqevi |
| 2026-05-24 | Sprint 2 Done | Academic features, professor dashboard | Aida, Parashqevi, Xhoi |
| 2026-06-07 | Sprint 3 Done | Student portal, M.I.A chat, assignments | All |
| 2026-06-21 | Testing Done | <1% critical bugs, full documentation | Parashqevi, Team |
| 2026-06-28 | Go Live | Production deployment, monitoring | All |

---

## Success Criteria & Metrics

### Functional Success

**Core Features Working:**
-  All user roles (Student, Professor, Admin) can log in
-  Students view grades, attendance, courses, transcript
-  Professors record grades and manage classes
-  Admins manage users and view reports
-  M.I.A answers student questions with >80% accuracy
-  Zero data integrity issues (grades match source of truth)

### Performance Success

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time | <3 sec | Browser DevTools |
| API Response Time (p95) | <500ms | APM monitoring |
| LLM Inference Time | <2 sec | Chat latency |
| System Uptime | 99.5% | Monitoring dashboard |
| Concurrent Users | 1000+ | Load testing |

### User Adoption Success

| Metric | Target | Timeline |
|--------|--------|----------|
| Student Portal Usage | >80% | 3 months post-launch |
| Professor Grade Recording | >90% use system | Immediate |
| Administrator Engagement | 100% | Day 1 |
| Student Satisfaction (M.I.A) | >4.0/5.0 | 1 month post-launch |

### Business Success

| Metric | Impact | Measurement |
|--------|--------|-------------|
| Registrar Time Savings | 50% reduction | Compare pre/post hours |
| Grade Recording Time | From 30 min → 5 min/class | Time study |
| Student Information Access | 24h → instant | Self-service adoption |
| Fee Collection Rate | +5-10% improvement | Financial report |

---

## Risk Management

### Risk Assessment Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **LLM API Unavailability** | Medium | High | Fallback to static responses, contact support |
| **Database Performance Issues** | Low | High | Load testing early, query optimization, connection pooling |
| **Scope Creep** | High | Medium | Strict scope, defer to Phase 2, document trade-offs |
| **Team Member Unavailable** | Low | Medium | Cross-training, documentation, knowledge sharing |
| **Integration Bugs** | Medium | High | E2E testing, staging environment, parallel run |
| **Data Migration Loss** | Low | Critical | Backup strategy, validation tests, rollback plan |
| **Security Vulnerability** | Low | Critical | Security audit, OWASP compliance, code review |
| **Poor M.I.A Accuracy** | Medium | High | Early testing, feedback loops, human fallback |

### Mitigation Strategies

**For High-Priority Risks:**

1. **LLM Unavailability**
   - Keep both Groq and Gemini accounts active
   - Implement graceful degradation (static responses)
   - Monitor API status, set up alerts

2. **Database Performance**
   - Load test with 5,000+ concurrent users early
   - Optimize slow queries before launch
   - Implement caching layer if needed

3. **Scope Creep**
   - Captain enforces scope boundaries
   - Features not in MVP deferred to Phase 2
   - Document all requirements clearly

4. **Poor M.I.A Accuracy**
   - Beta testing with real students (50-100)
   - Gather feedback on answer quality
   - Refine prompts based on feedback
   - Provide human adviser contact as fallback

---

## Client: Metropolitan University of Tirana

### Organization Profile

**Metropolitan University of Tirana** is a leading private higher education institution in Albania serving approximately **5,000 students** across 5 schools and 20+ departments.

**Current Pain Points:**
- Fragmented academic management (email, spreadsheets, multiple portals)
- Limited student self-service (wait 24-48 hours for registrar assistance)
- Inefficient grade recording (manual entry, prone to errors)
- No unified financial operations
- Weak audit trails for compliance

**What They Want:**
- One unified platform for all academic operations
- Student self-service to reduce registrar workload
- AI adviser to support academic guidance
- Real-time reporting and analytics
- Better financial management

**Success Metrics (Client View):**
- Registrar staff time reduced by 50%
- >80% student adoption within 3 months
- >4.0/5.0 satisfaction rating for M.I.A
- 99.5% system uptime
- Improved financial reporting and fee collection

---

## Appendix: Technical Details

### Database Schema Diagram

See `/docs/diagrams/diagrams.md` for full ERD (Entity Relationship Diagram)

### Use Case Diagrams

See `/docs/diagrams/` for actor-specific use case diagrams:
- `use-case-admin.svg` — Administrator workflows
- `use-case-professor.svg` — Professor workflows
- `use-case-student.svg` — Student workflows

### Process Flows

See `/docs/diagrams/` for BPMN (Business Process Model & Notation):
- `Login-Flow-BPMN.svg` — Authentication flow
- `Assignment-Submission-BPMN.svg` — Assignment workflow
- `M.I.A-Chat-Flow-BPMN.svg` — AI adviser interaction

### Documentation Files

- `/docs/team-guidelines.md` — Team processes, coding standards, DoD/DoR
- `/docs/research-plan.md` — Technology evaluation and POC details
- `/docs/project-description.md` — Detailed feature list and requirements
- `/docs/client.md` — Client profile and requirements

### Code Repository

**GitHub:** https://github.com/xhoja/Metropolitan_Information_Agent

**Branch Structure:**
```
main (production-ready code)
  ├── feature/user-auth
  ├── feature/grade-recording
  ├── feature/mia-chat
  └── ...
```

**Commit Convention:** Conventional Commits
```
feat: add grade recording endpoint
fix: prevent duplicate attendance entries
docs: update API reference
test: add unit tests for GPA calculation
```

---

## Key Takeaways

### Why This Project Matters

1. **Impact at Scale:** Serving 5,000+ students with unified academic platform
2. **AI Innovation:** Conversational AI adviser provides 24/7 guidance
3. **Real-World Complexity:** Real academic workflows, real data, real compliance
4. **Modern Tech Stack:** Industry-standard technologies (React, FastAPI, PostgreSQL)
5. **Learning Opportunity:** Full-stack development, AI integration, team coordination

### Project Highlights

 **Comprehensive Research:** All technologies validated before development
 **Clear Architecture:** Well-designed system supporting 3+ user roles
 **Ambitious Scope:** From authentication to AI-powered advising
 **Professional Practices:** Git workflow, code review, testing, documentation
 **Real Client:** Metropolitan University of Tirana, actual deployment planned

### What Makes M.I.A Different

Most university systems are **disconnected and manual**. M.I.A is:
- **Unified:** One platform for students, professors, admins
- **Intelligent:** AI adviser answers questions without human involvement
- **Modern:** Built with current best-practice technologies
- **Scalable:** Supports institution growth without proportional staffing increase
- **User-Centric:** Designed to eliminate friction, not create it

---

## Contact & Questions

For questions about the M.I.A project:

**Project Captain:** Xhoi (ikonomixhoja@gmail.com)
**Client Contact:** Metropolitan University of Tirana (info@umt.edu.al)
**GitHub:** https://github.com/xhoja/Metropolitan_Information_Agent

---

*Document prepared: June 3, 2026*
*Last Updated: June 3, 2026*
*Status: Ready for presentation and stakeholder review*
