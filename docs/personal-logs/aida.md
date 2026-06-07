# Personal Log — Aida

**Role:** Backend Development — FastAPI endpoints, database models, business logic, validation layer
          Tester — supporting backend validation and ensuring correct API behavior  


## Week 9 — 2026-06-07 (Final Week)

This was the last week before our presentation, so I spent it cleaning up a few backend correctness problems I'd come across while testing.

The first one was the GPA calculation. The numbers coming out of one of the backend functions didn't match what students saw on their dashboard, because the logic was still using letter grades like A and B+ that we don't actually use — our grades are stored as points out of 100 on the Albanian scale. I rewrote it to convert points the same way the frontend does, so the values match now.

I also found a bug in one of the endpoints that was keeping its data in a single shared list for everyone instead of per request. For users who weren't logged in that meant one person's data could end up showing for someone else, so I fixed it so each request is handled on its own.

The other thing was the student preferences table — it was being read from but nothing was ever writing to it, so that data was never actually getting saved. I added the part that writes to it and made sure we don't store the same entry twice. After that I did a quick check on our Supabase keys to confirm the sensitive one only lives in the backend and isn't exposed to the frontend, and that our environment file stays out of git.

**Tech explored:** GPA calculation on the Albanian grading scale, keeping request data isolated between users, writing to the preferences table, Supabase key handling.

## Week 8 — 2026-05-26

This week I focused on how we check user roles across the backend, because it wasn't being done consistently. The admin routes returned a proper "forbidden" error when someone wasn't allowed in, but the professor, student, and finance routes only looked the user up in a table, so a wrong role got a confusing "not found" error instead of a clear one. I wrote a single shared function for checking roles and used it across all the protected routes so they all behave the same way now. I also tested it properly — I tried using a student token on an admin route and an admin token on a student route to make sure each one returns the right error, and checked what happens when the token is missing or invalid.

**Tech explored:** role-based access control in FastAPI, shared dependency functions, HTTP status codes (401, 403, 422), testing endpoints with tokens.

## Week 7 — 2026-05-25

This week I worked on the login and token side of the backend. I found that the secret key we use to sign our login tokens had a default fallback value built in, which isn't safe — if the real key was ever missing, the app would just keep running with a guessable one and someone could fake a token. I changed it so the app won't start at all unless a proper secret key is set, and it shows a clear error explaining why if it isn't. I also went over how invalid tokens are handled to make sure they get rejected cleanly instead of causing an error in the middle of a request.

**Tech explored:** JWT token signing and security, validating configuration at startup, handling environment secrets safely.

## Week 6 — 2026-05-16

This week I went through the backend looking at how we handle errors, because I wanted the code to be more reliable before the final stretch. I noticed a lot of places were catching every possible error at once without saying which one, and that hides the real problem when something actually breaks. I went through auth.py, admin.py, and professor.py and changed those to catch only the specific errors we expect, so anything unexpected now shows up instead of being silently ignored. Doing this also helped me notice some of the login and access-control issues that I ended up fixing in the next couple of weeks.

**Tech explored:** exception handling in Python, writing more reliable backend code, reviewing existing code for problems.

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
