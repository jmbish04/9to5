# Agent Instructions for `9to5` Frontend

## 1. Project Overview & Goal

- **Project Name**: 9to5 Frontend
- **Description**: This is the primary user-facing web application for the 9to5 service. It allows users to [describe the core functionality, e.g., 'track tasks', 'manage schedules'].
- **Primary Goal for Agent**: Your main purpose is to autonomously implement new features, refactor components for better performance and maintainability, and fix bugs based on user-provided objectives.

---

## 2. Tech Stack

- **Framework**: [e.g., React with Vite, Next.js, SvelteKit]
- **Styling**: [e.g., Tailwind CSS, CSS Modules, Styled-Components]
- **State Management**: [e.g., Zustand, Jotai, Redux Toolkit]
- **Testing**: [e.g., Vitest for unit tests, Playwright for E2E tests]
- **Backend API**: The frontend communicates with the `9to5-scout` Cloudflare Worker. The base URL is `https://9to5-scout.your-domain.workers.dev`.

---

## 3. Project Structure & Key Files

- `src/`: Main source code directory.
  - `components/`: Reusable UI components (Buttons, Modals, etc.).
    - `ui/`: Generic, unstyled components.
    - `shared/`: Components with application logic.
  - `pages/` or `routes/`: Application pages/routes.
  - `lib/` or `utils/`: Helper functions, constants, and API clients.
  - `state/` or `store/`: Global state management logic.
  - `App.jsx`: The root component of the application.
- `public/`: Static assets like images and fonts.
- `AGENT.md`: **Your primary instruction file (this file).**
- `package.json`: Project scripts and dependencies.

---

## 4. Agent Workflows & Commands

Use the `colby` CLI for all operations.

- **To start the dev server**: `colby start 9to5` (This runs `npm run dev` internally).
- **To run all tests**: `colby test 9to5` (This runs `npm test`).
- **To check environment health**: `colby health 9to5` (Verifies connection to `9to5-scout`).
- **To add a new component**: Follow the structure in `src/components/`. Use existing components as a template for structure and styling.

---

## 5. API Interaction (`9to5-scout`)

- **API Client**: All interactions with the backend are handled through the client located at `src/lib/apiClient.js`.
- **Authentication**: The API client automatically attaches the necessary authentication headers.
- **Key Endpoints**:
  - `GET /api/tasks`: Fetches all tasks.
  - `POST /api/tasks`: Creates a new task. Expects `{ title: string, description: string }`.
  - `PUT /api/tasks/:id`: Updates a task.

---

## 6. UI & Design System Rules

- **Source of Truth**: The design system is defined by the components in `src/components/ui/`.
- **Consistency is Key**: **DO NOT** write custom one-off CSS. Use Tailwind CSS utility classes and existing components from `src/components/` whenever possible.
- **Spacing**: Use the theme's spacing values (e.g., `p-4`, `m-2`).
- **Colors**: Use predefined colors (e.g., `bg-primary`, `text-secondary`). Refer to `tailwind.config.js` for the full color palette.
