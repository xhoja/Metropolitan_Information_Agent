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

```mermaid
flowchart TD
    STU([Student])
    PROF([Professor])
    ADMIN([Admin])
    GROQ([Groq LLM API])
    STORAGE([Supabase Storage])

    D1[(D1: Users\n& Profiles)]
    D2[(D2: Academic Records\nCourses, Grades,\nAttendance, Enrollments)]
    D3[(D3: Assignments\n& Submissions)]
    D4[(D4: Course\nMaterials)]
    D5[(D5: Chat Sessions\n& Messages)]

    STU & PROF & ADMIN -->|credentials| P1[1.0\nAuthenticate]
    P1 <-->|user lookup| D1
    P1 -->|JWT token + role| STU & PROF & ADMIN

    PROF -->|grade value, type,\nweight, semester| P2[2.0\nRecord Academic\nData]
    PROF -->|student_id, date,\nhours_present, status| P2
    P2 <-->|read/write| D2
    P2 -->|confirmation| PROF

    STU -->|query request| P3[3.0\nView Academic\nStatus]
    P3 <-->|grades, attendance,\nenrollments| D2
    P3 -->|GPA, grade list,\nattendance records| STU

    STU -->|file/text submission| P4[4.0\nManage\nAssignments]
    PROF -->|assignment details| P4
    P4 <-->|read/write records| D3
    P4 <-->|file upload/download| STORAGE
    P4 -->|submission confirmation| STU
    P4 -->|student submissions| PROF

    PROF -->|material file| P5[5.0\nManage Course\nMaterials]
    P5 <-->|file storage| STORAGE
    P5 <-->|metadata| D4
    P5 -->|material list + URLs| STU

    STU -->|chat message| P6[6.0\nAI Advising\nM.I.A]
    P6 <-->|student profile:\ngrades, GPA, courses| D2
    P6 <-->|session history| D5
    P6 <-->|inference request/response| GROQ
    P6 -->|AI response| STU

    ADMIN -->|user create/update/delete| P7[7.0\nUser and\nEnrollment Mgmt]
    P7 <-->|CRUD operations| D1
    P7 <-->|enrollment records| D2
    P7 -->|confirmation + reports| ADMIN
```