# Personal Log - Ajna

**Role:** Frontend Development - Student dashboard UI, M.I.A chat interface, Tailwind styling, responsive design

---

## Week 9 - 2026-06-07 (Final Week)

**What I worked on:**
Completed the final frontend polish for the student dashboard before the project presentation. Reviewed the Grades & GPA, Transcript, Attendance, Assignments, Finance, and M.I.A Chat tabs to make sure the user flow was clear and consistent. Updated student-facing grade displays to support the final grading model, showing points, Albanian grade scale, and GPA values more clearly. Improved attendance warning states for students below the required threshold, checked responsive behavior across the dashboard, and helped verify that the final system documentation matched the implemented student portal.

**What I learned:**
Learned how important final integration testing is when several modules depend on shared academic rules. Improved my ability to review a complete frontend workflow from a student's perspective and make small UI changes that improve clarity before presentation.

---

## Week 8 - 2026-05-26

**What I worked on:**
Refined the student dashboard after the grading and finance updates. Adjusted the Grades & GPA and Transcript views so they worked with the new component-based grading structure and displayed course results more clearly. Redesigned the Attendance tab with course selector tabs, status filters, and color-coded week indicators to make attendance history easier to scan. Updated the Finance view to reflect scholarship-related changes and checked that student balances, installment information, and payment status remained understandable.

**What I learned:**
Gained more experience adapting frontend components when backend data structures change. Practiced presenting complex academic information in a simple student-friendly interface, especially for grades, attendance, and finance details.

---

## Week 7 - 2026-05-25

**What I worked on:**
Polished the dashboard UI and resolved cross-tab synchronization issues. Added better error handling and user feedback for API failures, optimized responsiveness for mobile viewports, and finalized the M.I.A chat experience with session selection and new-chat reset behavior.

**What I learned:**
Gained experience in refining user-facing workflows and accessibility in a production-style dashboard. Improved my ability to debug multi-endpoint integration issues and deliver a cohesive frontend experience across complex academic features.

---

## Week 6 - 2026-05-18

**What I worked on:**
Expanded the student dashboard with course materials and finance views. Implemented persistent M.I.A chat sessions, session previews, and session deletion. Added robust assignment submission refresh logic, completed transcript and finance endpoint integration, and improved loading states across all student tabs.

**What I learned:**
Strengthened skills in managing complex React state for tabbed interfaces and asynchronous data flows. Learned how to design reusable API service layers and create a more polished chat UX with session handling and error recovery.

---

## Week 5 - 2026-05-04

**What I worked on:**
Refined student dashboard UI consistency and fixed frontend-backend integration issues. Resolved assignment submission schema mismatch between frontend (sending content) and backend (expecting file_url). Added proper error handling for API calls and improved loading state management across all tabs. Enhanced accessibility and responsive design for mobile devices.

**What I learned:**
Deepened understanding of API integration patterns and error boundary implementation. Mastered cross-component state synchronization and performance optimization techniques.

---

## Week 4 - 2026-04-22

**What I worked on:**
Built complete student dashboard functionality by implementing an API service layer for 6 student endpoints plus M.I.A chat integration. Created a tabbed navigation system replacing placeholder cards and built 6 fully functional pages: My Courses, Grades & GPA, Attendance, Assignments, Transcript, and M.I.A Chat. Integrated real-time data fetching with loading states and error handling, implemented assignment submission functionality with auto-refresh, and built an interactive AI chat interface with message history.

**What I learned:**
Mastered React hooks for state management across multiple data sources and API integration patterns with axios interceptors for authentication. Gained proficiency in Tailwind CSS utility classes for responsive design.

---

## Week 3 - 2026-04-15

**What I worked on:**
Developed core student dashboard structure and implemented tabbed navigation system. Built initial components for courses, grades, and attendance views. Created API service layer with proper authentication headers and error handling. Established responsive design patterns with Tailwind CSS and implemented loading states for all data fetching operations.

**What I learned:**
Fundamentals of React component architecture and state management with hooks. Understanding of RESTful API integration and authentication flow patterns.

---

## Week 2 - 2026-04-08

**What I worked on:**
Set up project foundation and basic React application structure. Configured Vite build system and Tailwind CSS. Created initial routing with React Router and built basic login/home pages. Implemented authentication context and API client configuration with axios interceptors.

**What I learned:**
Project setup fundamentals, build tool configuration, and basic frontend development workflow. Introduction to modern React patterns and CSS utility frameworks.

---

## Week 1 - 2026-04-01

**What I worked on:**
Project initialization and environment setup. Installed and configured Node.js, React, and development dependencies. Created Git repository and established project structure. Set up development environment with VS Code extensions and configured package.json scripts.

**What I learned:**
Version control basics, modern JavaScript tooling, and project scaffolding principles. Understanding of package management and development server configuration.

---

## Week 6 - 2026-05-18

**What I worked on:**
Expanded the student dashboard with course materials and finance views. Implemented persistent M.I.A chat sessions, session previews, and session deletion. Added robust assignment submission refresh logic, completed transcript and finance endpoint integration, and improved loading states across all student tabs.

**What I learned:**
Strengthened skills in managing complex React state for tabbed interfaces and asynchronous data flows. Learned how to design reusable API service layers and create a more polished chat UX with session handling and error recovery.

---

## Week 7 - 2026-05-25

**What I worked on:**
Polished the dashboard UI and resolved cross-tab synchronization issues. Added better error handling and user feedback for API failures, optimized responsiveness for mobile viewports, and finalized the M.I.A chat experience with session selection and new-chat reset behavior.

**What I learned:**
Gained experience in refining user-facing workflows and accessibility in a production-style dashboard. Improved my ability to debug multi-endpoint integration issues and deliver a cohesive frontend experience across complex academic features.

---

## Research Log

### Tailwind CSS - Student Dashboard Implementation

**Date:** 2026-04-22

**What I built:** Complete student dashboard with 6 functional tabs using Tailwind utility classes for responsive design and consistent dark theme

**What worked:**
Utility-first approach enabled rapid UI development with consistent dark theme styling. Responsive layouts worked across devices, while hover states and loading states improved user experience and provided better feedback.

**What didn't:**
Initially tried complex custom CSS but found utility classes were more maintainable. Had to ensure accessibility with proper contrast ratios throughout the interface.

**Key finding:** Tailwind's utility classes allow for rapid prototyping while maintaining design consistency across the application. The existing design system made it easy to extend the student dashboard without breaking the overall look and feel.

**Code:** `frontend/src/pages/StudentDashboard.jsx` - Complete implementation with all 6 functional tabs and API integration
