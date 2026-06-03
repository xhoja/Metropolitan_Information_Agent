# Research Plan — Technology Evaluation

## Overview

Each team member evaluates one core technology by building a "Hello World" proof-of-concept (POC), documenting findings, and logging progress in their personal wiki page. The goal is to reduce technical risk by validating architectural decisions early and understanding each technology's strengths, limitations, and developer experience before committing to it across the full project.

This research phase runs in parallel during **Week 1–2** of development and informs the detailed technical architecture documented in the wiki.

---

## Technology Stack Rationale

### Why These Technologies?

**Frontend (React + Vite + Tailwind CSS):**
- React dominates modern web development with large ecosystem and reusable component model
- Vite provides faster development experience than traditional bundlers (webpack)
- Tailwind CSS avoids context-switching between HTML and CSS files, speeds up styling iteration
- This combination is industry standard for web applications

**Backend (Python + FastAPI):**
- Python is ideal for rapid backend development with excellent data handling
- FastAPI is modern, fast (comparable to Node.js), and generates OpenAPI docs automatically
- Well-suited for integrating with AI/ML libraries (Groq SDK, LLM APIs)
- Strong typing with Pydantic reduces bugs before runtime

**Database (PostgreSQL + Supabase):**
- PostgreSQL is the industry standard relational database for reliability and features
- Supabase provides managed hosting, built-in authentication, and dashboard
- Eliminates DevOps overhead of managing database infrastructure
- Strong JSON support for flexible schema evolution

**AI/LLM Integration (Groq API or Gemini):**
- Groq API provides ultra-low latency inference (<50ms) with optimized hardware
- Gemini (Google) offers strong reasoning capabilities and multimodal support
- Both provide production-ready APIs with rate limiting and cost controls
- Alternative evaluation allows team to choose based on cost/performance tradeoffs

---

## Research Assignments

| Member | Technology | Deliverable | Success Criteria |
|--------|-----------|------------|------------------|
| **Loric** | Groq API / Gemini API | Chat completion "Hello World" — send a message, receive a response. Evaluate latency, cost, and streaming support. | Send prompt → receive response in <2 sec. Test streaming. Compare pricing. |
| **Aida** | Python + FastAPI | REST API "Hello World" — one GET and one POST endpoint with request validation and error handling. | GET endpoint returns JSON. POST validates input (rejects invalid data). Auto-generated OpenAPI docs work. |
| **Parashqevi** | PostgreSQL + Supabase | Database "Hello World" — create a table, insert a row, query it via Supabase client library. | Table created. Insert succeeds. Query returns correct row. Connection pooling works. |
| **Xhoi** | React + Vite | Frontend "Hello World" — component tree, state management (useState), and a fetch call to a mock API. | Components render. State updates trigger re-render. Fetch call completes. Hot module reloading works. |
| **Ajna** | Tailwind CSS | Styled UI "Hello World" — a responsive card or dashboard layout using only utility classes (no custom CSS). | Layout responsive on mobile/tablet/desktop. All spacing/colors via utilities. Build process strips unused CSS. |

---

## Evaluation Criteria

### Performance
- **Time to "Hello World"** — How long did setup + first working example take?
- **Development feedback loop** — Hot reload, error messages, debugging experience
- **Runtime performance** — Latency, memory usage, throughput (where applicable)

### Developer Experience
- **Documentation quality** — Is the official docs easy to understand?
- **Learning curve** — Can a team member unfamiliar with the tech get productive in 1–2 hours?
- **Error messages** — Are errors clear and actionable?
- **Tooling** — Are there good IDE integrations, linters, formatters?

### Production Readiness
- **Maturity** — Is this technology stable in production?
- **Community support** — Is there an active community? Easy to find answers online?
- **Licensing** — Open source? Commercial? Any cost?
- **Scalability** — Can this grow with our project if we add more features/users?

### Cost & Hosting
- **Infrastructure cost** — Self-hosted vs managed? Any per-request fees?
- **Integration cost** — Do APIs charge per request? Any free tier?
- **Hidden costs** — Licensing, premium features, overage fees?

---

## Detailed Technology Research

### 1. LLM API (Groq or Gemini) — Loric

**Goal:** Evaluate real-time inference capabilities and integration patterns for M.I.A chatbot.

**Tasks:**
- [ ] Create accounts and obtain API keys for Groq AND Gemini
- [ ] Build "Hello World": send a simple prompt, receive response
- [ ] Test streaming responses (important for chat UX)
- [ ] Measure latency (target: <500ms for inference)
- [ ] Calculate cost per request (1000 requests = ?)
- [ ] Document authentication flow (API keys, rate limits)
- [ ] Test error handling (invalid prompts, rate limit exceeded)
- [ ] Compare: Groq latency vs Gemini accuracy

**Key Questions:**
- Which API returns responses faster?
- What's the cost difference at scale (1M requests/month)?
- Does streaming work well over WebSocket?
- Can we batch requests for cost efficiency?
- What happens when rate limits are hit?

**Success Metrics:**
- Latency <500ms for typical student question
- Cost <$0.001 per request
- Streaming implemented and working
- Error handling documented

---

### 2. Backend Framework (FastAPI + Python) — Aida

**Goal:** Validate FastAPI as backend architecture and understand API design patterns.

**Tasks:**
- [ ] Create FastAPI project with basic structure
- [ ] Implement GET `/students` endpoint (returns JSON array)
- [ ] Implement POST `/students` endpoint (validate input, return created object)
- [ ] Add Pydantic model for request/response validation
- [ ] Test error handling (missing required fields, invalid types)
- [ ] Auto-generate OpenAPI documentation
- [ ] Test async/await patterns (important for I/O-heavy operations)
- [ ] Benchmark: measure response time for 100 concurrent requests

**Key Questions:**
- How easy is it to add validation without boilerplate?
- Does auto-generated OpenAPI documentation work correctly?
- What's the developer experience for building complex endpoints?
- How well does async/await handle concurrent requests?
- What's the learning curve for team members new to FastAPI?

**Success Metrics:**
- GET endpoint returns 200 + valid JSON
- POST validates and rejects invalid input with meaningful error message
- OpenAPI docs auto-generate and are accurate
- Framework handles async I/O efficiently

---

### 3. Database (PostgreSQL + Supabase) — Parashqevi

**Goal:** Validate Supabase as managed PostgreSQL solution and understand connection/auth patterns.

**Tasks:**
- [ ] Create Supabase project and database
- [ ] Create a simple table (e.g., students with id, name, email, gpa)
- [ ] Insert 5 rows of test data
- [ ] Query using Supabase JavaScript/Python client library
- [ ] Test connection pooling (important for scalability)
- [ ] Evaluate Supabase dashboard (backup, logs, monitoring)
- [ ] Test Row Level Security (RLS) for student data isolation
- [ ] Compare managed Supabase vs self-hosted PostgreSQL

**Key Questions:**
- How easy is it to set up schemas and relationships?
- Does Supabase dashboard provide enough visibility (logs, performance)?
- Can connection pooling handle 100+ concurrent connections?
- How does Row Level Security work for multi-tenant isolation?
- What's the backup and disaster recovery story?

**Success Metrics:**
- Database created and accessible
- 5 rows inserted and queried successfully
- Connection pool handles 50+ concurrent connections
- Supabase dashboard shows query performance metrics

---

### 4. Frontend Framework (React + Vite) — Xhoi

**Goal:** Validate React architecture and Vite build tooling for single-page application.

**Tasks:**
- [ ] Create Vite + React project from scratch
- [ ] Build 2–3 reusable components (Header, Card, Button)
- [ ] Implement state management (useState hook)
- [ ] Fetch data from mock API and display in component
- [ ] Test hot module reloading (code changes without page refresh)
- [ ] Measure build time and bundle size
- [ ] Test TypeScript type checking
- [ ] Compare development vs production build performance

**Key Questions:**
- How fast is the development feedback loop (edit → see change)?
- Is TypeScript integration smooth with Vite?
- How large is the production bundle? Can we optimize?
- Does component composition feel natural for building 3 dashboards?
- What's the testing story (Jest, Vitest, etc.)?

**Success Metrics:**
- Components render and state updates work
- Hot reload works without full page refresh
- Production build <200KB (gzipped)
- TypeScript catches type errors before runtime

---

### 5. Styling (Tailwind CSS) — Ajna

**Goal:** Validate utility-first CSS approach for rapid, consistent styling across 3 portals.

**Tasks:**
- [ ] Create React component with Tailwind utilities
- [ ] Build responsive layout (mobile, tablet, desktop breakpoints)
- [ ] Use Tailwind's utility classes for: spacing, colors, typography, shadows
- [ ] Test dark mode support (if needed)
- [ ] Verify unused CSS is stripped in production build
- [ ] Measure CSS file size (target: <20KB gzipped)
- [ ] Compare development speed: Tailwind vs custom CSS vs Bootstrap
- [ ] Test accessibility (color contrast, focus states)

**Key Questions:**
- How much faster is development with utilities vs custom CSS?
- Is the HTML more readable or cluttered with utility classes?
- Does Tailwind integrate well with other tools (TypeScript, Vite)?
- Can we enforce consistent styling across the team?
- What's the customization story (custom colors, fonts)?

**Success Metrics:**
- Responsive layout works on all breakpoints
- CSS file <20KB (gzipped)
- All utility classes self-document styling intent
- Build process successfully removes unused CSS

---

## Log Format & Documentation

Each member logs findings in their **personal wiki page** under a `## Research Log` section.

### Log Entry Template

```markdown
## Research Log

### [Date] — [Technology] — [Task Description]

**What was built/tested:**
- Brief summary of what you did

**What worked well:**
- Positive findings, smooth experience

**What didn't work:**
- Blockers, confusing docs, unexpected behavior

**Key findings (1–2 sentences):**
- Main insight or recommendation

**Metrics (if applicable):**
- Latency: XXms
- Bundle size: XXkb
- Cost per request: $XX

**Next steps / recommendations:**
- Should we proceed with this tech?
- Any concerns for production use?

**Links:**
- Link to POC code (GitHub branch/folder)
- Link to official documentation
```

### Wiki Page Organization

```
# [Member Name]

## Research Log

### Week 1 — [Tech] — Hello World Setup
[Entry details]

### Week 1 — [Tech] — Performance Testing
[Entry details]

## Learnings & Recommendations
[Summary of key insights]
```

---

## Success Criteria for Research Phase

### Individual Success
- POC code builds and runs without errors
- Log entries document findings clearly
- Recommendation made: proceed with or pivot to alternative

### Team Success
- All 5 technologies evaluated by deadline
- No critical blockers identified (or mitigation plan documented)
- Technical architecture informed by research findings
- Team has hands-on experience with chosen stack

### Project Success
- Technology choices validated for production use
- Team is confident in scalability and maintainability
- Development timeline realistic based on POC experience
- Risk of technology failure significantly reduced

---

## Deadline & Checkpoints

| Milestone | Date | Owner | Deliverable |
|-----------|------|-------|-------------|
| **Research Started** | 2026-04-01 | All | Team kickoff + tech assignment |
| **Hello World Complete** | 2026-04-05 | All | POC code working, pushed to branches |
| **Initial Findings Logged** | 2026-04-08 | All | Wiki pages updated with findings |
| **Team Review** | 2026-04-09 | Captain | Discuss findings, resolve blockers |
| **Architecture Decided** | 2026-04-12 | Captain | Final tech stack approved, document rationale |
| **Ongoing Updates** | 2026-04-12+ | All | Continue logging learnings during development |

---

## Pivot Decision Points

If critical issues discovered during research:

1. **Blocker found** (e.g., "API latency >2 sec") → Discuss at team meeting same day
2. **Evaluation** → Is this a deal-breaker? Can we work around it?
3. **Decision** → Proceed with tech or evaluate alternative
4. **Document** → Record decision rationale in wiki

Example pivots:
- If Groq API too expensive → try Gemini or self-hosted LLM
- If FastAPI routing feels awkward → evaluate Django or Express
- If Tailwind CSS class names make HTML unreadable → use CSS Modules or CSS-in-JS

---

## Handoff to Development

Once research complete:

1. **Architecture Document** — Team documents final tech choices + rationale
2. **Setup Guides** — POC becomes template for project structure
3. **Known Limitations** — Document any gotchas or constraints discovered
4. **Performance Baselines** — Record metrics as benchmark for production performance
5. **Team Wiki** — All learnings preserved for onboarding future contributors

---

*Last updated: 2026-06-03*
