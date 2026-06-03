# M.I.A Team Process Guidelines

## Team Name
**M.I.A — Metropolitan Information Agent**

---

## Mission & Objectives

Build a full-stack, AI-powered university management system that gives students instant personalised academic guidance, provides administrators unified control over users and data, and gives professors a single platform to manage courses, grades, attendance, and assignments.

**Objectives:**
- Deliver a working web application with three role-based portals (Admin, Professor, Student)
- Integrate a conversational AI adviser (M.I.A) accessible only to students
- Maintain a clean, documented codebase on GitHub throughout the project
- Meet all course milestone deadlines
- Achieve >90% code coverage on critical business logic
- Deploy to a production-ready environment with CI/CD pipeline

---

## Team Members, Roles & Contact Information

| Member | Project Role | Course Role | Email | 
|--------|-------------|-------------|-------|
| Xhoi | Frontend Development | Captain | ikonomixhoja@gmail.com |
| Ajna  | Frontend Development | Editor | ajnanushi6@gmail.com |
| Parashqevi | Backend Development | Tester | klimi.paro@gmail.com | 
| Aida | Backend Development | Optimist | aida.bedaj@gmail.com |
| Loric| AI Agent Integration | Analyst | hagardloric@gmail.com |

### Full Member List (Project Roles)

| Member | Project Responsibilities | Technical Skills |
|--------|--------------------------|-------------------|
| Loric | AI Agent Integration — M.I.A chat, Groq/Gemini API, prompt engineering, preference memory, RAG pipeline | LLM APIs, prompt design, Python, vector databases |
| Aida | Backend Development — FastAPI endpoints, database models, business logic, validation, core schemas | Python, FastAPI, PostgreSQL, ORM design |
| Parashqevi | Backend Development — API routing, authentication middleware, Supabase integration, payment logic | Python, FastAPI, JWT, PostgreSQL, payment APIs |
| Xhoi | Frontend Development — React architecture, admin and professor dashboards, routing, app structure | React, TypeScript, Routing, Component design |
| Ajna | Frontend Development — Student dashboard UI, M.I.A chat interface, Tailwind styling, responsive design | React, Tailwind CSS, UI/UX, Component styling |

---

## Communication & Collaboration

### Communication Channels
- **Critical issues** — WhatsApp group (immediate response expected within 1 hour during work hours)
- **Code reviews & PRs** — GitHub comments (24-hour review window)
- **Design decisions** — Weekly meeting + async updates on wiki
- **Documentation** — Wiki pages + inline code comments

### Escalation Path
1. Reach out to directly responsible team member
2. If no response in 24 hours, mention in team Slack/WhatsApp
3. If blocker persists, raise at weekly meeting
4. Captain may reassign work if member is unavailable >2 days

---

## Coding Standards & Best Practices

### Frontend (React/TypeScript)
- Use functional components with hooks (no class components)
- Props validation with TypeScript interfaces
- Separate concerns: containers vs presentational components
- CSS organized via Tailwind utility classes (no custom CSS without justification)
- Max component file size: 300 lines (split if larger)
- All components must have prop documentation

### Backend (Python/FastAPI)
- Type hints required on all function signatures
- Docstrings for all public functions (Google style)
- Pydantic models for all request/response validation
- Exception handling: custom exception classes, never bare `except:`
- Database queries must use ORM, no raw SQL without approval
- Max function length: 50 lines (refactor if larger)

### General
- No hardcoded credentials, API keys, or URLs in code
- All third-party secrets stored in `.env` file (never committed)
- Console.log/print statements removed before PR submission
- Meaningful variable names (no single letters except loop indices)

---

## Definition of Done (DoD)

A feature is considered complete when:

1. **Code**
   - All code follows team style guidelines
   - No console errors or warnings
   - Type checking passes (TypeScript strict mode for frontend, mypy for backend)

2. **Testing**
   - Unit tests written and passing (minimum 80% coverage)
   - Manual testing completed and documented
   - Edge cases tested (empty inputs, null values, boundary conditions)
   - Tester sign-off required for features

3. **Documentation**
   - Code comments explain WHY, not WHAT
   - Inline documentation for complex algorithms
   - API endpoints documented in code comments
   - Database schema changes documented

4. **Review**
   - At least one team member code review completed
   - All review comments addressed
   - Repo Master approval before merge to main

5. **Integration**
   - Feature branch merged to `main` via pull request
   - CI/CD pipeline passes (if configured)
   - No merge conflicts

---

## Git & Version Control Workflow

### Branch Naming Convention
- Feature work: `feature/user-auth`, `feature/grade-recording`
- Bug fixes: `fix/login-redirect`, `fix/gpa-calculation`
- Documentation: `docs/api-reference`, `docs/setup-guide`
- Hotfixes (production only): `hotfix/payment-crash`

### Commit Message Format
Follow Conventional Commits:
```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat: implement grade recording endpoint

Add POST /api/grades endpoint with validation for grade values,
course_id, and student_id. Includes database transaction handling
and error responses for invalid inputs.

Closes #42
```

### Pull Request Process
1. Push feature branch to origin
2. Create PR with descriptive title and description
3. Link related issue (if applicable)
4. Request review from at least 1 team member
5. Address review comments
6. Repo Master merges PR once approved
7. Delete feature branch after merge

### Main Branch Protection
- No direct commits to `main`
- All changes via pull requests
- At least 1 review required before merge
- CI checks must pass

---

## Role Responsibilities

### Captain (Xhoi)
- Keeps team on track and maintains sprint plan
- Owns the weekly meeting agenda and facilitates discussions
- Escalates blockers to instructors if unresolved after 3 days
- Chairs weekly team meetings and ensures action items are documented
- Responsible for overall project timeline and milestone tracking

### Editor (Ajna)
- Owns all written deliverables — wiki pages, guidelines, meeting reports
- Reviews documentation before submission
- Ensures writing is clear, consistent, and follows project voice
- Maintains wiki organization and up-to-date links
- Proofreads meeting reports before posting

### Tester (Parashqevi)
- Owns the QA process for all features before merge
- Tests features against acceptance criteria
- Documents bugs in GitHub issues with reproducible steps
- Tracks regression issues and coordinates with developers
- Maintains a checklist of test cases for each major feature

### Researcher (Ajna - Secondary)
- Leads technology evaluation and POC builds
- Documents findings in personal wiki pages
- Presents tech recommendations to the team
- Keeps team updated on best practices in chosen tech stack

### Repo Master (Xhoi - Secondary)
- Enforces branch policy (no direct commits to `main`)
- Reviews and merges PRs according to DoD checklist
- Resolves merge conflicts in collaboration with developers
- Maintains clean commit history
- Monitors GitHub Actions CI/CD pipeline status

### Optimist (Aida)
- Advocates for what is achievable within constraints
- Generates creative solutions when team feels stuck
- Keeps team morale high during slower progress periods
- Highlights wins and positive momentum

### Pessimist (Parashqevi - Secondary)
- Devil's advocate on design and technical decisions
- Identifies risks, edge cases, and failure modes
- Asks "what could go wrong?" before features ship
- Ensures defensive programming practices

### Analyst (Loric)
- Owns requirements analysis and translation to user stories
- Clarifies acceptance criteria before development begins
- Maintains traceability between requirements and code
- Coordinates with client on scope questions

---

## Meeting Schedule

| Meeting Type | Day & Time | Location / Platform | Duration | Owner |
|-------------|------------|---------------------|----------|-------|
| Weekly team meeting | Friday 2 PM | In Person / Discord | 1 hour | Captain |
| Ad-hoc / emergency | As needed | In Person | 15 min | Captain |
| Code review sync | As needed | GitHub / Discord | 30 min | Repo Master |
| Client check-in | Bi-weekly | Scheduled | 1 hour | Captain |

### Weekly Meeting Agenda Template
1. **Status Updates** (15 min) — Each member: what's done, what's next, any blockers
2. **Demo** (15 min) — Show working features from past week
3. **Blockers & Decisions** (15 min) — Escalate issues, make team decisions
4. **Planning** (10 min) — Assign work for next week
5. **Action Items** (5 min) — Recap decisions, confirm owners, set deadlines

---

## Conflict Resolution Process

### Escalation Path
1. **Raise it early** — If a disagreement arises, surface it at the next team meeting, not over text.
2. **Each side states position** — Two minutes each, no interruptions.
3. **Team votes** — Majority rules on technical or process disagreements.
4. **Captain decides** — If the vote is tied, the Captain makes the final call.
5. **Escalate** — If the conflict is unresolved after two meetings, escalate to the course instructor.
6. **Document outcome** — Record the decision in the meeting report for that week.

### Conflict Prevention
- Disagreements are about ideas, not people
- Assume good intent — everyone is trying to help
- Ask clarifying questions before reacting
- Focus on project goals, not individual preferences

---

## Definition of Ready (DoR)

Work items (user stories, bugs, features) are ready for development when:

1. **Clarity** — Acceptance criteria are clear and testable
2. **Estimation** — Team has estimated story points
3. **Dependencies** — Blocking work is identified and addressed
4. **Design** — UI/UX design approved (for frontend features)
5. **API Contract** — Backend and frontend have agreed on endpoint structure
6. **Data Model** — Database schema changes documented (if applicable)

---

## Release & Deployment Process

### Pre-Release Checklist
- [ ] All tests passing (unit, integration, manual)
- [ ] No console errors or warnings
- [ ] Code review complete and approved
- [ ] Release notes written
- [ ] Version number bumped (if versioning)
- [ ] Documentation updated

### Deployment Steps
1. Merge to `main` branch via approved PR
2. Run full test suite
3. Build and deploy to staging environment
4. Smoke test in staging (critical paths)
5. Deploy to production
6. Monitor error logs for 1 hour post-deployment

---

## Security & Data Handling

### Password & Secrets
- Never commit credentials to Git
- Use environment variables for all secrets (`.env` file)
- `.env` file must be in `.gitignore`
- Rotate API keys and credentials monthly

### Data Privacy
- No personal data (names, emails) in log files
- Never log passwords or authentication tokens
- Database credentials only in environment variables
- User data is sensitive — handle with care

### Authentication & Authorization
- All endpoints require authentication (except login & home)
- Role-based access control enforced on backend
- Frontend must not be trusted for access control
- Sessions expire after inactivity (configurable)

---

## Success Metrics & Project Health

### Code Quality Metrics
- Test coverage >80% on business logic
- Code review turnaround <24 hours
- Zero unresolved linter errors
- Zero security vulnerabilities (per GitHub Dependabot)

### Team Health Metrics
- 0 missed weekly meetings
- <3 days average time to resolve blockers
- All team members contributing equally
- 0 unresolved conflicts escalated >2 weeks

### Project Progress Metrics
- Milestone deadlines met on time
- User stories completed to Definition of Done
- Zero critical bugs in production
- Client satisfaction (feedback collected bi-weekly)

---

*Last updated: 2026-06-03*
