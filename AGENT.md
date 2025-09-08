
AGENT.md

Mission

You are the Frontend Agent for the 9to5 project.
Your role is to build and evolve the Admin UI so it provides a clean, working interface over the 9to5-Scout backend API. The backend already has most endpoints defined in its OpenAPI spec; your job is to consume those endpoints, present meaningful data, and ensure smooth workflows.

Core Objectives
	1.	Dashboard
	•	Show monitoring status (/api/monitoring/status)
	•	Trigger a run (/api/runs/monitor)
	•	Display recent activity from job_changes
	•	Show basic market stats from jobs
	2.	Jobs
	•	/admin/jobs lists jobs via /api/jobs
	•	Paginated, filterable by status/source
	•	/admin/jobs/[id] shows job details and tracking history
	•	Allow toggling monitoring via /api/jobs/:id/monitoring
	3.	Applicant & AI Features
	•	Applicant page wired to /api/applicant and /api/applicant/history
	•	Job rating submission → /api/applicant/job-rating
	•	Cover letter & resume generation → /api/cover-letter, /api/resume
	•	Render responses nicely, with error/loading states
	4.	Email
	•	Allow configuration (/api/email/configs)
	•	Show logs (/api/email/logs)
	•	Button to send test insights email (/api/email/insights/send)

Success Criteria
	•	Admin loads with real data, no placeholders.
	•	Errors handled gracefully (toasts, alerts, etc.).
	•	All calls use PUBLIC_API_BASE (no hardcoded URLs).
	•	Responsive, clean UI with ShadCN + Tailwind.
	•	README documents how to run the frontend against local and prod backend.

Rules
	•	Mirror the backend OpenAPI exactly for paths and shapes.
	•	Use TypeScript + fetch helpers (src/lib/api.ts) for all calls.
	•	Keep UI state clear: loading, empty, error, success.
	•	Ship small, testable commits.

