# M.I.A — Metropolitan Information Agent

> AI-Powered University Management System

*Advanced Software Engineering — Group Project | Metropolitan University of Tirana*

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white)

---

## Overview

M.I.A (Metropolitan Information Agent) is a full-stack web application that serves as a complete university management system. It provides three distinct portals for administrators, professors, and students — each tailored to their specific needs and responsibilities.

The standout feature is **M.I.A**, an AI-powered academic adviser integrated exclusively into the student portal, giving students instant, personalised answers about their academic journey — from course recommendations to graduation progress tracking.

The system covers every aspect of university operations, including a finance module built beyond the original project scope, making it a near-complete institutional platform designed for real-world use.

---

## The Problem We Solve

- Students lack instant access to personalised academic guidance without waiting for adviser appointments
- Administrators have no unified platform to manage users, roles, and institutional data
- Professors juggle multiple tools to manage courses, grades, attendance, and assignments
- University data is fragmented across disconnected systems with no single source of truth

---

## Features

### Public Pages
- **Home page** — Landing page introducing M.I.A and the university portal
- **Login page** — Role-based authentication that redirects each user to their correct dashboard

### Administrator Dashboard
- Create and manage all user accounts (students and professors)
- Assign and update user roles across the system — filter users by role (All / Admin / Professor / Student)
- Full system oversight — access to all records, courses, and activity
- Grades tab — view grade entries with component type and weight columns; Spring/Autumn semesters only (Albanian academic calendar)
- Attendance tab — search students by name in both overview and per-session log views
- **Finance management** *(beyond original scope)* — configure tuition fees per major, auto-assign fee records and installment plans on student creation, pre-fill fee assignment from matching major fee, edit total fee with automatic installment recalculation, record payments and track settlement status

### Professor Dashboard
- Upload and manage courses and course materials
- Archive and unarchive courses — all data preserved; archived courses hidden from dropdowns and shown in a dimmed section
- Define grade components and weights per course before recording grades
- Record and update student grades against defined components
- Track and manage student attendance with per-session records
- Create and manage assignments and projects with due dates and types
- Enroll students and manage class rosters

### Student Dashboard
- View current courses and enrolled subjects
- Check grades and cumulative GPA in real time — grades scale 4–10 (pass > 4), GPA scale 0–4 (Albanian academic system)
- View attendance records per course
- Access and download academic transcript
- View, submit, and track assignments and projects
- **Finance tab** *(beyond original scope)* — view tuition fee balance, installment schedule, payment status, and transaction history
- **M.I.A AI Adviser** — Conversational AI that answers academic questions, recommends courses, checks graduation progress, and remembers student preferences across sessions

### M.I.A — AI Agent *(Student Portal Only)*

The AI agent is powered by Groq or Gemini API and is exclusively available to students. It provides:

- Natural language answers to academic questions
- Personalised course recommendations based on major and progress
- Graduation timeline and credit hour tracking
- Persistent memory of student preferences and goals across sessions
- Context-aware multi-turn conversation with full chat history
- RAG (Retrieval-Augmented Generation) pipeline for accurate, data-grounded answers

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 | Component-based UI for all three dashboards |
| Frontend | Tailwind CSS | Utility-first styling for fast, clean UI |
| Frontend | React Router | Client-side routing and protected route guards |
| Backend | Python 3.10+ | Server-side language |
| Backend | FastAPI | REST API server — async, typed, auto-documented |
| Backend | SQLAlchemy | ORM for database models and queries |
| Backend | JWT (python-jose) | Stateless authentication tokens |
| AI Agent | Groq API / Gemini API | LLM powering the M.I.A conversational adviser |
| Database | PostgreSQL | Relational database for all structured university data |
| Database Host | Supabase | Managed PostgreSQL with built-in dashboard and connection pooling |
| Version Control | Git + GitHub | Source control and team collaboration |

---

## Application Pages

| Route | Access | Description |
|---|---|---|
| `/` | Public | Home — landing page introducing M.I.A |
| `/login` | Public | Login with role-based redirect |
| `/admin` | Admin | User management, role assignment, system overview, finance config |
| `/professor` | Professor | Courses, grade components, grades, attendance, assignments |
| `/student` | Student | Grades, GPA, transcript, attendance, finance, M.I.A chat |

---

## System Architecture

```
[Browser]
    |
[React Frontend — Tailwind CSS — React Router]
    |
    |  HTTP/REST (JSON)
    |
[FastAPI Backend — Python]
    |                        |
[JWT Auth + Role         [M.I.A Agent]  <-- Student portal only
 Middleware]                  |
    |                    [Groq / Gemini API]
    |                         |
    |                    [RAG Pipeline + Memory]
    |
[PostgreSQL — Supabase]
(users, courses, grades, attendance, assignments, finance, chat history)
```

### Request Flow

1. User logs in → backend validates credentials, issues JWT with role claim
2. React stores token in memory; attaches it as `Authorization: Bearer <token>` on every request
3. FastAPI middleware decodes token, injects `current_user` into route handlers
4. Role-specific routes reject tokens with insufficient permissions (403)
5. Student requests to M.I.A agent route → `mia.py` builds context from live DB data + student preference memory → sends to LLM → streams response back

---

## Authentication & Security

- **JWT tokens** — signed with `SECRET_KEY`, carry `user_id` and `role` claims, expire after a configurable TTL
- **Password hashing** — bcrypt via `passlib`; plaintext passwords are never stored
- **Role enforcement** — FastAPI dependency `get_current_user` + `require_role(role)` decorators on every protected route
- **CORS** — configured in `main.py` to allow only the frontend origin in production
- **Environment secrets** — all keys and connection strings live in `.env` files, never committed to the repository

---

## API Documentation

FastAPI auto-generates interactive API docs. Once the backend is running:

| URL | Description |
|---|---|
| `http://localhost:8000/docs` | Swagger UI — interactive, try-it-out |
| `http://localhost:8000/redoc` | ReDoc — clean, readable reference |
| `http://localhost:8000/openapi.json` | Raw OpenAPI 3.0 schema |

---

## Finance Module *(Beyond Original Scope)*

The finance module was added as an extension beyond the defined project scope. It covers:

### Admin-Side
- Configure tuition fee amount per academic major
- Auto-assign fee records to newly enrolled students based on their major
- Generate installment plans (split total fee into payment periods)
- Record manual payments against a student's installment schedule
- View settlement status — paid, partial, outstanding — per student

### Student-Side
- View total tuition fee and remaining balance
- See full installment schedule with due dates and amounts
- Track payment history and transaction records

### Out of Scope (Not Implemented)
- Scholarship management — no partial fee waivers, scholarship applications, or grant tracking
- Online payment gateway — payments are recorded manually by admin; no card/bank integration
- Invoice/receipt generation — no downloadable PDF documents for payments

---

## Core Database Entities

| Entity | Description |
|---|---|
| `User` | All system users — id, name, email, password_hash, role (admin / professor / student) |
| `Student` | Student profile — user_id, major, enrolled_year, credits_earned, gpa |
| `Professor` | Professor profile — user_id, department, title |
| `Course` | Course catalog — code, title, credits, department, description, professor_id |
| `Enrollment` | Student-course link — student_id, course_id, semester, status |
| `GradeComponent` | Grading breakdown per course — name, weight, course_id (e.g. Midterm 30%, Final 50%) |
| `Grade` | student_id, course_id, component_id, value, semester |
| `Attendance` | student_id, course_id, date, status (present / absent / late) |
| `Assignment` | title, description, due_date, course_id, type (project / homework / exam) |
| `Submission` | student_id, assignment_id, submitted_at, file_url, grade |
| `TuitionFee` | major, amount, academic_year |
| `StudentFeeRecord` | student_id, fee_id, total_amount, paid_amount, status |
| `Installment` | fee_record_id, due_date, amount, paid_at, status |
| `ChatSession` | student_id, started_at, ended_at |
| `Message` | session_id, role (user / assistant), content, created_at |
| `StudentPreference` | student_id, category, preference_text, source (chat / manual) |

Full schema: `database/schema.sql`

---

## Role Permissions

| Feature | Admin | Professor | Student |
|---|:---:|:---:|:---:|
| Create / manage users | yes | no | no |
| Assign roles | yes | no | no |
| View all system data | yes | no | no |
| Manage courses | yes | yes | no |
| Define grade components | yes | yes | no |
| Upload grades | yes | yes | no |
| Manage attendance | yes | yes | no |
| Create assignments | yes | yes | no |
| Configure tuition fees | yes | no | no |
| Record payments | yes | no | no |
| View own grades & GPA | no | no | yes |
| View transcript | no | no | yes |
| View own attendance | no | no | yes |
| Submit assignments | no | no | yes |
| View own finance tab | no | no | yes |
| Access M.I.A AI Adviser | no | no | yes |

---

## Project Structure

```
mia-university/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ProfessorDashboard.jsx
│   │   │   └── StudentDashboard.jsx
│   │   ├── components/
│   │   │   ├── chat/           # M.I.A chat UI components
│   │   │   ├── dashboard/      # Shared dashboard layout components
│   │   │   └── shared/         # Navbar, Sidebar, ProtectedRoute
│   │   ├── api/                # Axios instance + endpoint helpers
│   │   └── main.jsx
│   ├── .env
│   └── package.json
│
├── backend/
│   ├── routers/
│   │   ├── auth.py             # Login, JWT issue, role middleware
│   │   ├── admin.py            # User management, finance config endpoints
│   │   ├── professor.py        # Courses, grade components, grades, attendance
│   │   └── student.py          # Student data — grades, transcript, finance, chat
│   ├── agent/
│   │   ├── mia.py              # M.I.A agent orchestration and LLM calls
│   │   ├── prompt_builder.py   # Builds context-aware prompts from live DB data
│   │   └── memory.py           # Student preference extraction and storage
│   ├── models/                 # SQLAlchemy ORM models (one file per entity)
│   ├── schemas/                # Pydantic request/response schemas
│   ├── database.py             # DB session factory and connection
│   ├── main.py                 # App entry point, CORS, router registration
│   └── requirements.txt
│
├── database/
│   └── schema.sql              # Full PostgreSQL schema with constraints
│
├── docs/
│   └── report/                 # Diagrams and project documentation
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- Python 3.10+
- A [Supabase](https://supabase.com) account (free tier works)
- A [Groq API key](https://console.groq.com) (free) or [Gemini API key](https://aistudio.google.com) (free)
- Git + [GitHub Desktop](https://desktop.github.com) (optional)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/mia-university.git
cd mia-university
```

Or: GitHub Desktop → **File** → **Clone Repository** → paste the repo URL.

### 2. Set up the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Set up the frontend

```bash
cd frontend
npm install
```

### 4. Set up the database

Run `database/schema.sql` against your Supabase PostgreSQL instance via the Supabase SQL editor or `psql`:

```bash
psql "your_supabase_connection_string" -f database/schema.sql
```

### 5. Configure environment variables

Create `.env` files in both `frontend/` and `backend/` from the examples below.

**`backend/.env`**
```env
DATABASE_URL=your_supabase_postgres_connection_string
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
SECRET_KEY=your_jwt_secret_key_min_32_chars
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

**`frontend/.env`**
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 6. Run the development servers

**Backend** (from the `backend/` directory):
```bash
uvicorn main:app --reload
```
API available at `http://localhost:8000` — Swagger docs at `http://localhost:8000/docs`

**Frontend** (from the `frontend/` directory):
```bash
npm run dev
```
App available at `http://localhost:5173`

---

## Testing

### Backend

FastAPI's Swagger UI at `/docs` allows manual endpoint testing with authentication.

For automated tests (if implemented):
```bash
cd backend
pytest
```

### Frontend

```bash
cd frontend
npm run lint       # ESLint check
npm run build      # Production build — catches type/import errors
```

---

## Deployment Notes

For production deployment:

- Set `SECRET_KEY` to a strong random value (32+ characters)
- Set `ACCESS_TOKEN_EXPIRE_MINUTES` to a shorter value (e.g. 30)
- Configure CORS in `main.py` to allow only your frontend domain
- Use Supabase connection pooling URL (port 6543) for serverless/edge deployments
- Build the frontend with `npm run build` and serve the `dist/` folder via a static host (Vercel, Netlify, or Nginx)
- Deploy the FastAPI backend to Railway, Render, or a VPS with `uvicorn main:app --host 0.0.0.0 --port 8000`

---

## Contributing

This project uses **GitHub Desktop** and follows a feature-branch workflow. No direct commits to `main`.

1. In GitHub Desktop: **Current Branch** → **New Branch** → name it `feature/your-feature-name` or `fix/your-fix-name`
2. Make your changes and write a commit message following Conventional Commits format:
   - `feat: add student dashboard grade chart`
   - `fix: correct attendance status enum values`
   - `docs: update API endpoint table`
   - Prefixes: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
3. Click **Commit to [branch]**, then **Push origin**
4. On GitHub, open a **Pull Request** from your branch into `main` and request review from at least one teammate before merging

---

## Team

| Member | Role | Responsibilities |
|---|---|---|
| Loric | AI Agent Integration | M.I.A chat, Groq/Gemini API, prompt engineering, preference memory, RAG pipeline |
| Aida | Backend Development | FastAPI endpoints, database models, business logic, validation layer |
| Parashqevi | Backend Development | API routing, authentication middleware, data queries, Supabase integration |
| Xhoi | Frontend Development | React architecture, admin and professor dashboards, routing |
| Ajna | Frontend Development | Student dashboard UI, M.I.A chat interface, Tailwind styling, responsive design |

---

*Built by the M.I.A team — Advanced Software Engineering, Metropolitan University of Tirana*
