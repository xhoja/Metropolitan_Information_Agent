# Personal Log — Aida

**Role:** Backend Development — FastAPI endpoints, database models, business logic, validation layer
          Tester — supporting backend validation and ensuring correct API behavior  


## Week 9 — 2026-06-07 (Final Week)

This was the final week before the presentation. I focused on a backend security and correctness pass — hardening authentication, standardising role enforcement across every router, and fixing data-correctness bugs in the MIA agent so the system is reliable for the demo.

**Authentication hardening.** The JWT signing key was being read with an insecure `"changeme"` fallback, which meant the app would silently run with a guessable secret if the environment variable was missing — anyone could forge a valid token. I made `SECRET_KEY` mandatory: the backend now refuses to start and raises a clear error if it isn't set, closing the token-forgery hole.

**Standardised role guards.** Access control was inconsistent — the admin router checked the role explicitly and returned a clean 403, but the professor, student, and finance routers only did a table lookup, so a wrong-role request leaked a confusing 404 instead of a proper "forbidden". I added a single shared `require_role()` dependency in `auth.py` and wired every protected router through it, so each route now guards the same way and returns a consistent 403. I verified this end-to-end: a student token hitting an admin endpoint returns 403, an admin token hitting a student endpoint returns 403, a missing header returns 422, and a tampered token returns 401.

**Exception handling cleanup.** Replaced 12 bare `except:` blocks across `auth.py`, `admin.py`, and `professor.py` with specific exception types (`jwt.PyJWTError`, `KeyError`/`TypeError`, `ValueError`/`TypeError`). The old blanket catches were silently swallowing unexpected errors, which made bugs hard to trace; now only the expected failures are caught and anything unexpected surfaces.

**MIA agent correctness.** Fixed two real bugs in the AI advisor's data layer. First, the GPA calculation was mapping letter grades (A, B+, …) that don't exist in our system — grades are stored as 0–100 points on the Albanian scale — so the agent reported GPAs that didn't match the dashboards. I rewrote it to use the same points → Albanian 4–10 → GPA conversion the frontend uses, so the agent and the student dashboard now agree. Second, the unauthenticated chat path used a single module-level history list shared across all anonymous users, meaning one anonymous user could see another's messages; I removed the shared global and made that path stateless.

**Preference persistence.** The "MIA remembers your preferences" feature read from the `student_preferences` table but nothing ever wrote to it. I implemented the persistence path — extracting durable preferences a student states during chat and storing them (with de-duplication) — so the feature actually works across sessions.

**Security review.** Reviewed the Supabase key configuration and confirmed the service-tier key lives only in the backend environment and never reaches the frontend, and that the environment file is gitignored. Flagged Row-Level-Security verification as a follow-up for the database owner.

**Tech explored:** JWT signing-key validation and token-forgery risk, FastAPI shared dependencies for role-based access control, specific vs. blanket exception handling in Python, cross-user state leakage from module-level globals, Albanian grading-scale GPA conversion (0–100 points → 4–10 → 0–4 GPA), Supabase service-role keys vs. Row Level Security.

## Week 5 — 2026-05-11

This week I focused on the student backend — reviewing and refining existing endpoints for correctness and consistency. Tested GPA calculation logic against edge cases, validated assignment submission flow end-to-end, and ensured enrollment checks behave correctly under concurrent requests. Worked closely with the frontend to verify the student dashboard data matches expected API responses.

**Tech explored:** FastAPI validation patterns, Supabase query optimization, end-to-end API testing.

## Week 4 — 2026-04-22

This week I worked on backend API functionality, with a strong focus on making sure endpoints behave correctly and handle different scenarios properly. I implemented several endpoints in student.py, including retrieving course materials with enrollment checks, GPA calculation using weighted logic, and endpoints for assignments and submissions with related course data.
I also worked on the assignment submission endpoint, which now supports file uploads using multipart/form-data and stores files in Supabase Storage. While working on this, I identified an issue with the missing "submissions" storage bucket and resolved it by configuring the correct setup.
On the admin side, I implemented an enrollment endpoint that includes validation to prevent duplicate enrollments and ensures appropriate error responses are returned.
Overall, I paid close attention to validating inputs, handling edge cases, and making sure each endpoint returns the correct responses under different conditions.

**Tech explored:** FastAPI request validation, error handling, file upload handling, Supabase Storage integration

## Week 3 — 2026-04-15

This week I focused on setting up the core structure for backend endpoints and understanding how the student and admin modules should be organized. I worked on initial route definitions in FastAPI and explored how to structure responses for courses, assignments, and user-related data.
I also started testing basic API calls using tools like Postman to verify that endpoints were returning the correct data. During this process, I identified areas where validation would be needed, especially for role-based access and enrollment checks.

**Tech explored:** FastAPI routing, API testing with Postman, basic response structuring

## Week 2 — 2026-04-08

This week I worked on understanding the project architecture and backend structure. I reviewed how different modules like student.py, admin.py, and authentication are organized, and how they connect to the database through Supabase.
I also explored how data models such as students, courses, and enrollments relate to each other, which helped in planning how endpoints should be designed later.
Additionally, I familiarized myself with FastAPI basics and how requests, responses, and validation work.

**Tech explored:** FastAPI fundamentals, project structure, database relationships (Supabase/PostgreSQL)

## Week 1 — 2026-04-01

This week we formed the team and defined the overall scope of the project. We discussed the main features of the system and how different user roles (admin, professor, student) would interact with it.
I focused on setting up the backend environment and understanding how the system would be structured. This included exploring how API endpoints will be organized, how requests and responses are handled, and how the backend will connect to the database.
Most of the work this week was focused on planning and building a clear foundation for backend development in the following weeks.

**Tech explored:** FastAPI basics, API structure, backend planning

## Research Log 4

### API Validation and Backend Testing

**Date:** 22.04.2026

**What I built:** Backend endpoints for student and admin features, focusing on validation and correct API responses.

**What worked:** Endpoints correctly enforce rules such as enrollment checks and duplicate prevention. File uploads work after proper storage configuration.

**What didn't:** Initial issues with file upload handling and missing Supabase bucket required debugging and adjustment.

**Key finding:** Even during development, continuously checking API behavior and edge cases helps prevent larger issues later and ensures system reliability.

**Code:** feature/backend-endpoints — backend/ folder - student.py & admin.py flies
