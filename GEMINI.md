# Project Context: Inherit Hackathon Template

## Project Overview
This is a **Next.js 16** web application template designed for hackathons. It features a complete authentication system using **Clerk**, data persistence with **MongoDB (Mongoose)**, and a polished UI built with **Tailwind CSS 4**.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** JavaScript
- **Authentication:** Clerk (`@clerk/nextjs`)
- **Database:** MongoDB with Mongoose (`mongoose`)
- **Styling:** Tailwind CSS 4, `tailwindcss-animate`, `framer-motion`
- **Icons:** Lucide React, React Icons
- **UI Components:** Radix UI primitives, Custom components

## Directory Structure
- **`app/`**: Contains the Next.js App Router file system.
    - **`dashboard/`**: Protected route for authenticated users.
    - **`projects/`**: Project management (list, details, file editor).
    - **`api/`**:
        - **`health/`**: Database connection health check.
        - **`v1/projects/`**: REST API for project access.
    - **`sign-in/` & `sign-up/`**: Clerk authentication pages.
    - **`components/`**: Reusable UI components (`Header`, `Sidebar`, `LandingPage`).
    - **`layout.jsx`**: Root layout wrapping the app in `ClerkProvider` and global styles.
- **`lib/`**: Backend logic and utilities.
    - **`actions/`**: Server Actions for database mutations.
        - **`project.js`**: Create, read, delete projects.
        - **`file.js`**: Manage files within projects.
        - **`user.js`**: Auth utilities.
    - **`models/`**: Mongoose schemas.
        - **`projectModel.js`**: Project schema (title, description, ownerId).
        - **`fileModel.js`**: File schema (content, type, projectId).
    - **`mongodb/`**: Database connection logic (`mongoose.js`).
- **`public/`**: Static assets (images, icons).

## Key Workflows

### Critical Constraints
- **NO MODIFICATION of `app/globals.css`**: The agent must NEVER modify this file. It is managed by external visual editors (like **TweakCN**) and manual tweaks that would be overwritten by agent changes. Any styling needs should be handled via Tailwind classes or separate component styles.
- **CHECK `app/globals.css` FOR VARIABLES**: Always read `app/globals.css` to see what variables are available before using them in components. Do not assume variable names.
- **NO HARDCODED COLORS**: Never use hex codes (e.g., `#ffffff`) or generic Tailwind palettes (e.g., `bg-red-500`) unless explicitly unthemed. Always use semantic variables (e.g., `bg-primary`, `text-muted-foreground`) to ensure consistency with the TweakCN theme.
- **Use Shadcn UI**: Prefer using existing components in `app/components/ui/` over building from scratch.
- **DO NOT MODIFY Shadcn UI Structure**: Never refactor internal Shadcn component logic or structure (e.g., removing `forwardRef`) to ensure compatibility with the official registry. Only modify styles for theme alignment.

### Authentication & User Sync
1.  **Sign Up/In**: Handled by Clerk components in `app/sign-in` and `app/sign-up`.
2.  **Auth Proxy**: Route protection is managed in `proxy.js`.

### UI Architecture
- **ClientLayout**: (`app/components/ClientLayout.jsx`) Manages the conditional rendering of the `Header` and `Sidebar` based on the current route (e.g., hidden on the landing page).
- **Styling**: Global styles in `app/globals.css` define theme variables and utility classes.

## Development Commands

- **Install Dependencies:**
  ```bash
  npm install
  ```

- **Start Development Server:**
  ```bash
  npm run dev
  ```
Note: never run a dev server unless the user explicitly asks for it.

- **Build for Production:**
  ```bash
  npm run build
  ```

- **Lint Code:**
  ```bash
  npm run lint
  ```

## Environment Configuration
Required environment variables (see `.env.example`):
- **Clerk**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- **Clerk URLs**: `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, etc.
- **Database**: `MONGODB_URI`
- **Webhooks**: `WEBHOOK_SECRET` (from Clerk Dashboard)
