# Personal Log — Xhoi

**Role:** Frontend Development — React architecture, admin and professor dashboards, routing

## Week 9 — 2026-06-07 (Final Week)

This was the final week before the project presentation. The focus was on debugging, grading-system correctness, attendance enforcement, and reviewing the overall system to ensure it is presentation-ready.

**Grading system overhaul.** The existing grade storage used 0–100 points, but the application was incorrectly displaying raw percentages as Albanian grades. I introduced a proper conversion pipeline: professors continue entering 0–100 points; the frontend converts to the Albanian 4–10 scale using a step function (95–100 → 10, 85–94 → 9, 75–84 → 8, 65–74 → 7, 55–64 → 6, 45–54 → 5, <45 → 4 fail), then derives a 0–4 GPA from that (5 → 1.0 D, 6 → 2.0 C, 7 → 3.0 B, 8 → 3.3 B+, 9 → 3.7 A−, 10 → 4.0 A). All grade display components — student Grades & GPA tab, transcript, course detail table, assignment badges, admin grade list — now show Points/100, Albanian/10, and GPA side by side. A bug where pre-converted Albanian averages were incorrectly re-run through `toAlbanian()` (causing 9.3 to map to fail since 9.3 < 45) was fixed by separating `gradeColor(points)` from `albColor(alb)`.

**Semester logic.** Albanian universities run two semesters only — Spring (Jan–Jun) and Autumn (Jul–Dec). The codebase previously had a three-way Summer/Fall split. Fixed `getCurrentSemester()` in both the professor dashboard and the two backend endpoints (`professor.py`, `student.py`). Existing DB records with "Summer 2026" or "Fall YYYY" are normalised on the frontend via `normalizeSemester()` so the transcript groups and sorts them correctly without a data migration.

**Attendance failure enforcement.** Added a 75% attendance threshold rule: any student below that threshold has failed the class and must retake it. On the student side, course tabs in the attendance view turn red with a warning symbol, and a prominent red banner appears inside the failed course card explaining the situation. On the professor side, a failure panel appears above the attendance sheet listing every student below 75% with their rate. The admin attendance tab was fully redesigned — now includes a 4-card stat summary (Present / Absent / Late / At Risk), a failure panel showing all failing students across all courses with a progress-bar rate column, and a Student Overview table with passing/failed badges sorted alphabetically by name then course. The backend `/admin/attendance` endpoint was extended to return `student_id`, `course_id`, `week_number`, `hours_present`, `student_email`, and `course_code` since these were missing and blocked the rate calculation entirely.

**Submissions modal cleanup.** Removed the grading UI (Component dropdown, Grade input, Save button) from the professor's submissions view — professors grade exclusively from the Grades tab. The modal now shows Student / Status / Files only, with a simple submitted-count footer.

**Report review.** Reviewed the full project report and the comprehensive system documentation ahead of the presentation. Verified feature completeness across all modules: student dashboard (grades, GPA, attendance, assignments, transcript, finance, MIA chat), professor dashboard (courses, roster, materials, assignments, grades, attendance), admin dashboard (users, students, professors, courses, enrollments, attendance, grades, finance, role assignment).

**Tech explored:** Albanian academic grading system (4–10 scale, 45-point pass threshold, 0–4 GPA mapping), timezone-aware datetime comparison in Python (offset-naive vs offset-aware), React state separation to avoid cross-purpose contamination, Supabase Storage public bucket uploads, FastAPI multipart/form-data with `List[UploadFile]`, attendance rate calculation from hours-present aggregation.

## Week 8 — 2026-05-26

This week I reworked the grade recording flow end-to-end, implementing a component-based grading system, and built out the scholarship feature in the finance module. On the grading side, the old flow allowed professors to enter a free-text grade type and weight per entry, which meant nothing was consistent. I replaced this with a grade components manager: professors now define named components (e.g. Final Exam 60%, Midterm 15%) per course before any grades can be recorded. A new `grade_components` table stores these, and the record-grade form replaced the free-text fields with a dropdown that pulls from those predefined components. Semester is now auto-determined server-side based on the current date so professors never enter it manually. I also added a delete endpoint for grades and locked the edit/delete actions for past-semester grades on the backend. A student/component filter was added to the grades table view.

For the finance module, I implemented scholarship support. Admin can apply a scholarship amount and optional reason to any student fee record. The backend computes the net payable, updates `agreed_amount`, and redistributes the remaining balance across unpaid installments. The admin student detail view gained a scholarship panel and a revised four-card summary.

On the student dashboard, I redesigned the attendance tab with course selector tabs, status filter pills, and per-session colour-coded week indicators.

**Tech explored:** Supabase check constraint debugging, FastAPI route ordering with overlapping path patterns, React IIFE rendering for derived state inside JSX, scholarship arithmetic without additional DB columns.

## Week 7 — 2026-05-25

This week I worked on data integrity, grade editing, and redesigning the student grades and transcript views. I fixed a silent overwrite bug in attendance recording — the backend now returns 409 if a week is already recorded, and the Save Session button is disabled on the frontend until the week is cleared. I added a `PUT /professor/grades/{grade_id}` endpoint and wired up an inline edit mode on the professor dashboard, where clicking Edit populates the grade form with the existing values while locking the student and course fields. On the student side, I replaced the flat grades table with a two-level course-list drilldown and rebuilt the transcript tab to group grades by semester with per-semester and cumulative averages.

**Tech explored:** FastAPI 409 conflict responses, Pydantic partial-update schemas, React inline edit state patterns, grade aggregation and weighted GPA calculation on the frontend.

## Week 6 — 2026-05-16

This week I focused on bug fixes and feature improvements across both the admin and professor dashboards, and the student-facing views. I fixed a critical bug in the admin user edit flow where the backend was using the wrong Pydantic model (`UserCreate` instead of `UserUpdate`), causing any edit without a password change to fail with a validation error. I added multi-file upload support for course materials and assignments — professors can now select and upload multiple files at once, with materials creating one database record per file and assignments storing file references as JSON arrays. On the student dashboard I corrected the attendance display, replacing the hardcoded `/2h` denominator with a calculated session duration derived from the recorded `session_start` and `session_end` times, and removed a broken session-type badge that always showed "lab" regardless of actual data. I also removed the interim grades sub-tab from the course info view as it was surfacing incomplete data. Finally I investigated and fixed several bugs in the MIA chat integration — a wrong dictionary key in the student profile fetch, a schema mismatch between the code and the actual `chat_sessions` table columns, and silent error swallowing on the frontend that left the user with no feedback when the chat failed.

**Tech explored:** FastAPI form validation with optional fields, multipart file uploads with `List[UploadFile]`, JSON storage for variable-length relations, Supabase table schema alignment, React error state patterns.

## Week 5 — 2026-05-11

This week I focused on system design documentation and frontend polish. I created UI system design diagrams for all four main views — Home/Login, Student Dashboard, Professor Dashboard, and Admin Dashboard — and organised them into the project docs. On the frontend side, I continued refining the React components and layout details across the dashboards to bring them closer to the final design spec.

**Tech explored:** UI system design documentation, React component refinement, dashboard layout polish.

## Week 4 — 2026-04-22

This week I completed the UI polish pass across all dashboards — switched to lighter blues throughout the colour scheme, redesigned the hero section on the landing page, and added password reveal toggles to the login form. I also resolved a CORS configuration issue between the frontend and backend that was blocking API calls in the development environment. Currently working on tightening up the admin and professor dashboard layouts to match the latest wireframe specs.

**Tech explored:** React component composition, Tailwind colour palette customisation, Vite proxy config for CORS bypass in dev.

## Week 3 — 2026-04-15

This week I completed and presented the full React + Vite frontend scaffold to the team — client-side routing for all three roles (admin, professor, student) and authentication flow integrated with Supabase. From there I shifted focus to building out the admin and professor dashboard layouts. The team meeting on April 14 highlighted some compatibility issues between the frontend and backend, so the decision was made to stabilise what exists before adding new features. I spent the latter part of the week addressing those inconsistencies and aligning component structure with the backend API contracts Aida and Parashqevi had defined.

**Tech explored:** React Router for role-based routing, Supabase JS client authentication, component-driven dashboard layout patterns.

## Week 2 — 2026-04-08

This week was focused on research and setup. I investigated React + Vite as the frontend framework and presented the findings to the team in the April 8 WhatsApp meeting — the team agreed on it as the official stack. I also explored Tailwind CSS component patterns suitable for the three dashboards (admin, professor, student) and began planning the page structure and routing logic. The team agreed to work individually on our assigned areas and reconvene once initial implementation was underway.

**Tech explored:** React + Vite project setup, Tailwind CSS utility patterns, React Router structure planning.

## Week 1 — 2026-04-01

This week the team met in person at a coffee shop near Skanderbeg Square on April 6 for the first official project meeting. Three project ideas were evaluated and the team selected M.I.A (Metropolitan Information Agent) — a full-stack university management system with an integrated AI advisor for students. The tech stack was agreed upon: React + Tailwind CSS for the frontend, Python + FastAPI for the backend, PostgreSQL hosted on Supabase, and GitHub with GitHub Desktop for version control. Xhoi and Ajna were assigned frontend development; Aida and Parashqevi backend; Loric the AI agent. My tasks for the week were to set up the React + Tailwind project, scaffold the five main pages (Home, Login, Admin Dashboard, Professor Dashboard, Student Dashboard), configure routing, and initialise the GitHub repository with agreed branching conventions.

**Tech explored:** React + Vite scaffolding, Tailwind CSS initial setup, GitHub branching strategy (feature/name convention).

## Research Log

### React + Vite — Hello World

**Date:** 2026-04-19

**What I built:** React + Vite frontend scaffold with admin and professor dashboards, client-side routing, and authentication flow integrated with Supabase.

**What worked:** Vite dev server setup was fast and straightforward. React Router handled multi-role routing (admin, professor, student) cleanly. Tailwind CSS integrated without issues.

**What didn't:** CORS between the Vite dev server and FastAPI backend required proxy configuration — direct API calls failed until Vite's proxy config was set up correctly.

**Key finding:** Vite's proxy config (`server.proxy` in `vite.config.js`) is the cleanest way to bypass CORS in development without touching the backend. React component composition with role-based routing scales well from the start.

**Code:** `feature/frontend-scaffold` branch — `src/` folder
