# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Next.js 16** App Router hackathon template featuring:
- Clerk authentication
- MongoDB database with Mongoose ODM
- Responsive design with Tailwind CSS 4 and Framer Motion
- Server actions for data mutations
- Conditional layout rendering based on routes
- Toast notifications with react-toastify

## Development Commands

### Essential Commands
```bash
# Development server
npm run dev
Note: Never run a dev server unless the user explicitly asks for it.

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Database Operations
```bash
# MongoDB connection is automatic via mongoose.js
# Check connection logs in console during development
```

## Architecture Overview

### Application Structure
```
app/
├── layout.jsx                    # Root layout with Clerk provider
├── page.jsx                     # Landing page (dynamic import)
├── dashboard/page.jsx           # Protected dashboard
├── projects/                    # Project management
│   ├── page.jsx                 # Project list
│   └── [id]/                    # Project details & file editor
├── sign-in/[[...sign-in]]/     # Clerk auth pages
├── sign-up/[[...sign-up]]/     # Clerk auth pages
├── components/
│   ├── ClientLayout.jsx        # Conditional sidebar/header logic
│   ├── Header.jsx              # Navigation header
│   ├── Sidebar.jsx             # Sidebar navigation
│   └── LandingPage.jsx         # Landing page component
└── api/webhooks/clerk/route.js # User sync webhook
```

### Data Flow Architecture
1. **Authentication**: Clerk handles auth, redirects to `/dashboard` post-login
2. **Layout Logic**: ClientLayout conditionally renders header/sidebar based on route
3. **Database**: Mongoose models with connection pooling via `connect()` function

## Key Patterns

### Critical Constraints
- **NO MODIFICATION of `app/globals.css`**: The agent must NEVER modify this file. It is managed by external visual editors (like **TweakCN**) and manual tweaks that would be overwritten by agent changes. Any styling needs should be handled via Tailwind classes or separate component styles.
- **CHECK `app/globals.css` FOR VARIABLES**: Always read `app/globals.css` to see what variables are available before using them in components. Do not assume variable names.
- **NO HARDCODED COLORS**: Never use hex codes (e.g., `#ffffff`) or generic Tailwind palettes (e.g., `bg-red-500`) unless explicitly unthemed. Always use semantic variables (e.g., `bg-primary`, `text-muted-foreground`) to ensure consistency with the TweakCN theme.
- **Use Shadcn UI**: Prefer using existing components in `app/components/ui/` over building from scratch.
- **DO NOT MODIFY Shadcn UI Structure**: Never refactor internal Shadcn component logic or structure (e.g., removing `forwardRef`) to ensure compatibility with the official registry. Only modify styles for theme alignment.

### Authentication Flow
- Clerk proxy protects routes (configured in `proxy.js`)
- Public routes: `/`, `/sign-in`, `/sign-up`, webhook endpoints
- Post-auth redirect: `/dashboard`
- User data synced to MongoDB via webhooks on create/update/delete

### Layout Conditional Rendering
```jsx
// ClientLayout.jsx pattern
const isHomePage = normalizedPath === "" || normalizedPath === "/";
const excludedPaths = ["/sign-in", "/sign-up"];
const shouldRenderSidebar = !isHomePage && !isExcludedPath;
```

### Database Connection Pattern
```javascript
// lib/mongodb/mongoose.js - Connection singleton
let initialized = false;
export const connect = async () => {
  if (initialized) return; // Prevents reconnection
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "bcf-hackathon" });
  initialized = true;
};
```

### Server Actions Pattern
```javascript
// lib/actions/user.js - Server action pattern
"use server";
export const createOrUpdateUser = async (...params) => {
  await connect(); // Always connect before DB operations
  // Upsert pattern with findOneAndUpdate
};
```

### Utility Patterns
```javascript
// lib/utils.js - Tailwind class merging and toast helpers
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const showToast = {
  success: (message) => toast.success(message, { position: "bottom-right" }),
  error: (message) => toast.error(message, { position: "bottom-right" })
};
```

## Integration Points

### Frontend → Backend
- Server actions for all database mutations
- Client components for UI interactivity
- Middleware for route protection

### Styling Integration
- **Tailwind CSS**: Configured with custom theme
- **Framer Motion**: For animations
- **Custom Font**: Kanit from Google Fonts
- **Toast Notifications**: react-toastify with custom positioning

## Environment Setup

### Required Environment Variables
```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
CLERK_SECRET_KEY=your_secret_key_here
WEBHOOK_SECRET=your_webhook_secret_here

# Clerk URLs (customize as needed)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# MongoDB

# Next.js
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Setup Steps
1. Copy `.env.example` to `.env.local`
2. Configure Clerk project and get API keys
3. Set up MongoDB Atlas or local MongoDB instance
4. Configure Clerk webhooks pointing to `/api/webhooks/clerk`
5. Run `npm install && npm run dev`

## Customization Points

### 1. Landing Page Content
- **File**: `app/components/LandingPage.jsx`
- **Purpose**: Replace placeholder content with actual project details
- **Dynamic Import**: Component is dynamically imported for SSR optimization

### 2. Dashboard Implementation
- **File**: `app/dashboard/page.jsx`
- **Current State**: Basic placeholder component
- **Customization**: Add actual dashboard functionality, data fetching

### 3. Navigation & Sidebar
- **Files**: `app/components/Sidebar.jsx`, `app/components/Header.jsx`
- **Customization**: Add menu items, navigation logic, user profile components

### 4. Authentication Routes
- **Protected Routes**: Add new protected routes under proxy configuration
- **Public Routes**: Modify `proxy.js` publicRoutes array

### 6. Database Schema
- **Location**: `lib/models/`
- **Models**: `Project`, `File`
- **Pattern**: Follow existing pattern for additional models
- **Actions**: Create corresponding server actions in `lib/actions/`

### 6. Styling & Theming
- **Tailwind Config**: `tailwind.config.js`
- **Global Styles**: `app/globals.css`
- **Clerk Theme**: Modify appearance in `app/layout.jsx`

## Development Workflow

### Adding New Features
1. **Models**: Create Mongoose model in `lib/models/`
2. **Actions**: Create server actions in `lib/actions/`
3. **Components**: Add React components in `app/components/`
4. **Pages**: Create new pages following App Router structure
5. **Routes**: Update proxy if route protection needed

### Database Operations
- Always use server actions for database operations
- Import and call `connect()` before any Mongoose operations
- Use upsert patterns where appropriate
- Handle errors with try/catch blocks

### Styling Guidelines
- Use `cn()` utility for conditional classes
- Follow existing Tailwind patterns
- Utilize toast notifications for user feedback
- Maintain responsive design principles

## Common Tasks

### Adding a New Protected Route
1. Create page component in `app/new-route/page.jsx`
2. Add route to sidebar navigation if needed
3. Middleware will automatically protect non-public routes

### Extending User Data
1. Update user schema in `lib/models/userModel.js`
2. Modify webhook handler to capture additional Clerk data
3. Update createOrUpdateUser action parameters

### Custom Components
1. Create in `app/components/`
2. Use PropTypes for type checking
3. Follow existing patterns for responsive design
4. Import utilities from `lib/utils.js`

This template provides a solid foundation for rapid development while maintaining scalable architecture patterns. Focus customization efforts on the business logic specific to your application while leveraging the existing authentication, database, and UI infrastructure.