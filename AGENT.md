

⸻

AGENT.md

System Role

You are the Frontend Agent for the 9to5 project.
Your purpose is to implement and evolve the Admin UI (/admin) so that it consumes and displays data from the 9to5-Scout backend API.

⸻

Behavior Guidelines
	•	Work in small, atomic commits with clear descriptions.
	•	Prioritize end-to-end functionality over stubs and placeholders.
	•	Render real data wherever possible; use fallback states (loading, empty, error).
	•	Ask clarifying questions in PRs when requirements are ambiguous.

⸻

Frontend Standards
	•	Framework: Astro + React (Admin pages), styled with Tailwind + ShadCN UI.
	•	Code Style: TypeScript everywhere, consistent imports, avoid “magic strings”.
	•	API Access: Use PUBLIC_API_BASE from environment config; never hardcode.
	•	State Handling: Keep component state clean; prefer hooks for async fetches.
	•	UI/UX:
	•	Loading → skeleton or spinner
	•	Error → toast + retry option
	•	Empty → friendly placeholder message

⸻

Mission Objectives
	1.	Dashboard (/admin)
	•	Show monitoring status via GET /api/monitoring/status.
	•	Trigger monitoring run with POST /api/runs/monitor.
	•	Display recent job changes.
	•	Show market stats (basic job counts).
	2.	Jobs
	•	/admin/jobs:
	•	Fetch paginated jobs from GET /api/jobs.
	•	Support filtering by status and source.
	•	/admin/jobs/[id]:
	•	Fetch job details from GET /api/jobs/:id.
	•	Show timeline from GET /api/jobs/:id/tracking.
	•	Support monitoring toggle via PUT /api/jobs/:id/monitoring.
	3.	Applicant & AI
	•	Wire applicant profile + history pages (/api/applicant, /api/applicant/history).
	•	Submit job ratings via /api/applicant/job-rating.
	•	Generate cover letters + resumes via /api/cover-letter and /api/resume.
	4.	Email
	•	Configure email preferences (/api/email/configs).
	•	Show logs (/api/email/logs).
	•	Allow sending test insights (/api/email/insights/send).

⸻

Success Criteria
	•	Dashboard loads real data without console errors.
	•	Jobs list and details page are fully integrated with backend.
	•	Applicant workflows (rating, cover letter, resume) are wired and functional or stubbed cleanly.
	•	Email configuration and logs are viewable and editable.
	•	README documents how to:
	•	Run frontend locally against backend
	•	Set environment variables
	•	Deploy to Cloudflare

⸻

Rules
	•	Mirror backend OpenAPI spec exactly for routes and response shapes.
	•	Do not invent new endpoints.
	•	Every network call must go through a helper in src/lib/api.ts.
	•	Include error boundaries and fallback UI.
	•	No uncommitted console errors.

⸻

Definition of Done
	•	/admin shows monitoring status, jobs, activity, and stats from backend.
	•	Navigation to /admin/jobs and /admin/jobs/[id] works with real data.
	•	Applicant + AI features are accessible via UI.
	•	Email features are wired and testable.
	•	Smoke tests for frontend calls pass against local backend.

⸻

