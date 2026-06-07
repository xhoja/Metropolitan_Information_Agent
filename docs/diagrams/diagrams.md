# ERD — Database Schema

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar name
        varchar email
        varchar password_hash
        varchar role
        timestamp created_at
    }
    STUDENTS {
        uuid id PK
        uuid user_id FK
        varchar major
        int enrolled_year
        int credits_earned
        float gpa
    }
    PROFESSORS {
        uuid id PK
        uuid user_id FK
        varchar department
        varchar title
    }
    COURSES {
        uuid id PK
        varchar code
        varchar title
        int credits
        varchar department
        text description
        uuid professor_id FK
        timestamp created_at
    }
    ENROLLMENTS {
        uuid id PK
        uuid student_id FK
        uuid course_id FK
        varchar semester
        timestamp enrolled_at
    }
    GRADES {
        uuid id PK
        uuid student_id FK
        uuid course_id FK
        float value
        varchar semester
        varchar grade_type
        float weight
        timestamp created_at
    }
    ATTENDANCE {
        uuid id PK
        uuid student_id FK
        uuid course_id FK
        date date
        varchar status
        time session_start
        time session_end
        float hours_present
        timestamp created_at
    }
    ASSIGNMENTS {
        uuid id PK
        uuid course_id FK
        varchar title
        text description
        date due_date
        varchar type
        varchar file_url
        varchar file_name
        timestamp created_at
    }
    SUBMISSIONS {
        uuid id PK
        uuid student_id FK
        uuid assignment_id FK
        varchar file_url
        text content
        timestamp submitted_at
        float grade
        text feedback
    }
    MATERIALS {
        uuid id PK
        uuid course_id FK
        varchar title
        varchar file_url
        varchar file_name
        timestamp created_at
    }
    CHAT_SESSIONS {
        uuid id PK
        uuid student_id FK
        varchar title
        timestamp started_at
        timestamp ended_at
    }
    MESSAGES {
        uuid id PK
        uuid session_id FK
        varchar role
        text content
        timestamp created_at
    }
    STUDENT_PREFERENCES {
        uuid id PK
        uuid student_id FK
        varchar key
        varchar value
        timestamp updated_at
    }

    USERS ||--o| STUDENTS : "has profile"
    USERS ||--o| PROFESSORS : "has profile"
    PROFESSORS ||--o{ COURSES : "teaches"
    STUDENTS ||--o{ ENROLLMENTS : "enrolled via"
    COURSES ||--o{ ENROLLMENTS : "registered via"
    STUDENTS ||--o{ GRADES : "receives"
    COURSES ||--o{ GRADES : "has"
    STUDENTS ||--o{ ATTENDANCE : "tracked in"
    COURSES ||--o{ ATTENDANCE : "tracks"
    COURSES ||--o{ ASSIGNMENTS : "has"
    STUDENTS ||--o{ SUBMISSIONS : "submits"
    ASSIGNMENTS ||--o{ SUBMISSIONS : "receives"
    COURSES ||--o{ MATERIALS : "has"
    STUDENTS ||--o{ CHAT_SESSIONS : "opens"
    CHAT_SESSIONS ||--o{ MESSAGES : "contains"
    STUDENTS ||--o{ STUDENT_PREFERENCES : "stores"
```

# Class Diagram — Core Academic

![Class Diagram Core Academic](MIA_ClassDiagram_CoreAcademic.png)

**Classes:** User, Student, Professor, Course, Enrollment, Grade, GradeComponent, Attendance, Assignment, Submission, Material

Relationships: composition (Course → GradeComponent), aggregation (User → Student/Professor), association across enrollment, grade, attendance, assignment, and submission boundaries.

---

# Class Diagram — Finance

![Class Diagram Finance](MIA_ClassDiagram_Finance.png)

**Classes:** StudentFee, MajorFee, Installment, FeeTransaction — with external Student boundary from Core Academic diagram.

StudentFee composes Installment and FeeTransaction. MajorFee derives major-level fee rules and auto-assigns to students.

---

# Layered Architecture

![Layered Architecture](MIA_LayeredArchitecture.png)

5-layer architecture:

| Layer | Name | Key files |
|-------|------|-----------|
| L1 | Presentation | React 19 SPA — `App.jsx`, dashboard components, `axios.js` |
| L2 | HTTP Interface | FastAPI routes, Pydantic schemas, CORS — `main.py`, `schemas/*.py` |
| L3 | Application Logic | Fat-router pattern — `routers/*.py`, `agent/mia.py` |
| L4 | Data Client | Thin Supabase SDK wrapper — `db.py` |
| L5 | External Services | Supabase PostgreSQL, Supabase Storage, Groq Cloud API |

Layer skip noted: `agent/mia.py` (L3) calls Groq directly, bypassing L4. `axios.js` serves L1 and L2 boundary.

---

# Use Cases — Actor-Specific Diagrams

## Administrator Use Cases

![Administrator Use Cases](use-case-admin.svg)

**Responsibilities:** Create/update users, assign roles, view system reports, manage tuition fees, configure payment plans, track payments

---

## Professor Use Cases

![Professor Use Cases](use-case-professor.svg)

**Responsibilities:** Create courses, upload materials, manage assignments, record grades, track attendance, view class roster, enroll students

---

## Student Use Cases

![Student Use Cases](use-case-student.svg)

**Responsibilities:** View courses, check grades/GPA, view attendance, download transcript, submit assignments, view tuition balance, track payments, chat with M.I.A

**M.I.A (AI Agent):** Answer academic questions, recommend courses, track graduation progress, remember preferences (exclusive to student portal)

# Login Flow

![Login Flow BPMN](Login-Flow-BPMN.svg)

# M.I.A Chat Flow

![M.I.A Chat Flow BPMN](M.I.A-Chat-Flow-BPMN.svg)

# Assignment Submission Flow

![Assignment Submission Flow BPMN](Assignment-Submission-BPMN.svg)

# State Diagram — Assignment Lifecycle

![State Diagram Assignment](MIA_StateDiagram_Assignment.png)

4 states: **Published** → **Submitted** → **Graded** | **Deleted**

- **Published**: Professor creates assignment; INSERT into `assignments`, file uploaded to Supabase Storage
- **Submitted**: Student submits (enrolled only); INSERT into `submissions`, file auto-set by Supabase
- **Graded**: UPDATE `submissions SET grade=?, feedback=?` — endpoint planned, not yet implemented
- **Deleted**: Hard delete from `assignments`; cascades to submissions

All transitions one-way. `due_date` display only — no overdue transition implemented.

---

# DFD Level 0 — Context Diagram

```mermaid
flowchart LR
    STU([Student])
    PROF([Professor])
    ADMIN([Administrator])
    GROQ([Groq LLM API])
    STORAGE([Supabase Storage])

    STU -->|credentials, messages,\nfile submissions| SYS[M.I.A\nSystem]
    PROF -->|credentials, grades,\nattendance, materials| SYS
    ADMIN -->|user data,\nenrollment ops| SYS

    SYS -->|grades, GPA, attendance,\nAI responses, materials| STU
    SYS -->|course roster,\nstudent records| PROF
    SYS -->|user listings,\nsystem reports| ADMIN

    SYS <-->|inference requests\n& responses| GROQ
    SYS <-->|file reads\n& writes| STORAGE
```

# DFD Level 1 — Process Detail

![DFD Level 1](MIA_DFD_Level1.png)

**Processes:** 1.0 Authentication · 2.0 Enrollment · 3.0 Grade · 4.0 Attendance · 5.0 Assignments & Materials · 6.0 Payment · 7.0 MIA Chat

**Data stores:** Users & Profiles · Academic Records (courses, grades, enrollments) · Assignments & Submissions · Course Materials · Chat Sessions & Messages

**External entities:** Student, Professor, Admin · Groq API (inference)