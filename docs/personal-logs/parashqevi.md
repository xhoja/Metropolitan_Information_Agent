# Personal Log — Parashqevi

**Role:** Backend Development — API routing, authentication middleware, data queries, Supabase integration

---

## Week 9 — 2026-06-07

Final week of the project. Completed the last backend documentation and personal log entries in preparation for the June 8 submission and presentation. Conducted a final review of all backend components to confirm there were no regressions or open issues across any of the admin, professor, and student routes. Verified that the repository is clean, all required files are present, and the codebase is ready for submission. Reviewed the overall structure of the project deliverables alongside the team and signed off on the backend layer.

---

## Week 8 — 2026-06-05

Participated in the team's final review and debugging session ahead of submission. Finished the remaining backend documentation and reports, and reviewed all backend components to confirm stability across admin, professor, and student endpoints. Contributed to the final submission checklist — going through the codebase, meeting reports, and repository structure to confirm everything was in order. The team confirmed the project is ready for final submission, scheduled for June 6, with the presentation on June 8.

---

## Week 7 — 2026-06-01

Completed and shared the full API documentation with the team, covering all endpoints with request payloads, response formats, and error codes. The documentation was reviewed by all members and confirmed ready for submission. Participated in the full end-to-end integration testing session across all three dashboards — student, professor, and admin. Several minor mismatches between frontend expectations and backend responses were identified and resolved during the session. Verified that all backend endpoints are reachable and respond correctly under real integration conditions.

---

## Week 6 — 2026-05-17

Focused on finalizing the backend layer and beginning formal API documentation. Confirmed all endpoints are stable and consistent across admin, professor, and student routes. Drafted the initial API documentation covering endpoint signatures, request payloads, and expected response formats for all routes. Coordinated with Aida to ensure complete coverage across the full API surface ahead of the end-to-end integration testing phase.

---

## Week 5 — 2026-05-11

This week I focused on refining and stabilising the admin and professor backend endpoints. Reviewed all admin routes for edge cases and ensured proper validation and error responses. Worked on professor dashboard API — course management, grade submission, and attendance endpoints — testing each against the frontend integration. Coordinated with the frontend team to resolve any mismatches in response structure.

**Tech explored:** FastAPI endpoint hardening, role-based route validation, backend-frontend API contract alignment.

---

## Week 4 — 2026-04-22

Finalized all backend routes and confirmed full integration with the frontend. All endpoints were tested via FastAPI's `/docs` interface — register, login, and admin user creation all returned correct responses and data appeared live in the Supabase Table Editor. CORS was configured to allow the frontend running at `http://localhost:5173`. No blockers this week — the backend is fully functional and connected.

---

## Week 3 — 2026-04-15

Built out the professor and student routers from scratch. Professor endpoints cover course creation, grade submission, attendance marking, and assignment management. Student endpoints cover enrolled courses, grades, attendance, transcript, and assignment submission. Also added role-based protection to all admin endpoints using `decode_token()` and a `require_admin()` guard. Fixed a critical bug where `passlib` was incompatible with `bcrypt` v5.x — replaced with direct `bcrypt` library calls for `hash_password()` and `verify_password()`. Fixed another issue where `load_dotenv()` was not loading before router imports, solved by moving it to the very top of `main.py`.

---

## Week 2 — 2026-04-08

Set up the full backend project structure inside `/backend`: created `db.py` for the Supabase client, `models.py` for Pydantic schemas, and the `routers/` folder with `auth.py` and `admin.py`. Implemented JWT-based authentication — login returns a signed token (HS256, 8-hour expiry), and `GET /auth/me` decodes it to return the current user. Implemented `POST /auth/register` for bootstrapping the first admin account, and `POST /admin/users` so the admin can create students and professors. When a student is created, a row is automatically inserted into the `students` table; same for professors. Configured the virtual environment, installed all dependencies, and generated `requirements.txt`. Created `.env.example` as a template for team members and distributed actual keys privately.

---

## Week 1 — 2026-04-01

First week — team formed and project scoped as M.I.A (Metropolitan Information Agent), a full-stack university management system. My role was assigned as backend developer. Set up the Supabase project, configured the Data API (enabled), and chose to leave Row Level Security off for now since JWT handles authorization at the API layer. Designed and deployed the full database schema with 11 tables: `users`, `students`, `professors`, `courses`, `enrollments`, `grades`, `attendance`, `assignments`, `submissions`, `chat_sessions`, and `messages`. All tables use UUID primary keys, foreign key constraints, and CHECK constraints on role and status fields. Ran the schema in Supabase's SQL Editor and confirmed all tables were created. Integrated Loric's existing `agent/mia.py` into the app by registering it as a router in `main.py` and fixing the `.env` loading path so the Groq API key resolved correctly.

---

## Research Log

### PostgreSQL + Supabase — Hello World

**Date:** 2026-04-08

**What I built:** Connected a FastAPI backend to a live Supabase (PostgreSQL) project. Created the `users` table via SQL Editor and performed the first successful read and write from Python using the `supabase-py` client — inserting a user via `POST /auth/register` and reading it back via `GET /admin/users`.

**What worked:** The Supabase client (`create_client(URL, KEY)`) connected immediately once the correct Project URL and anon public key were in `.env`. The insert and select queries worked exactly like the documentation described. FastAPI's `/docs` interface made manual testing straightforward without needing a separate tool.

**What didn't:** `passlib` with `bcrypt` v5.x raised a `ValueError` about passwords longer than 72 bytes during a compatibility check on startup — even before any password was submitted. Also, `load_dotenv()` inside `agent/mia.py` was not finding `.env` because the file's relative path differed from where `uvicorn` was launched.

**Key finding:** Supabase provides a fully managed PostgreSQL instance with a REST API layer on top — no server configuration needed. The anon key is safe to use in the backend since Row Level Security and JWT validation handle access control at the application layer.

**Code:** `feature/backend-auth-db` — `/backend/db.py`, `/backend/routers/auth.py`, `/backend/routers/admin.py`