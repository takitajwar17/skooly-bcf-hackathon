# Hackathon Landing Page Template

A modern, responsive landing page template built with Next.js and Tailwind CSS, perfect for hackathons based on Inherit.


## 🛠️ Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/takitajwar17/inherit-hackathon-template.git
   ```

2. Install dependencies:
   ```bash
   cd inherit-hackathon-template
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the following variables with your own values:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
   CLERK_SECRET_KEY=your_secret_key_here

   # Clerk Authentication URLs
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

   # MongoDB
   MONGODB_URI=your_mongodb_uri_here

   # Next.js
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```
   Note: Replace all values that start with `your_` with your actual credentials.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Customization

1. **Landing Page**
   - Components located in `app/components/landing/`
   - Wrapper: `app/components/LandingPage.jsx`
   - Update `hero.jsx`, `features.jsx`, `pricing.jsx`, etc.

2. **Dashboard**
   - Sidebar: `app/components/dashboard/app-sidebar.jsx`
   - Header: `app/components/dashboard/site-header.jsx`
   - Main Data Table: `app/components/dashboard/data-table.jsx`

3. **Database & Auth**
   - Mongoose Models: `lib/models/`
   - Server Actions: `lib/actions/`
   - Auth Proxy: `proxy.js` (Route protection)

## 🎨 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** Shadcn UI + Tailwind CSS 4
- **Auth:** Clerk v6
- **Database:** MongoDB + Mongoose 9
- **Icons:** Lucide React & Tabler Icons
- **Linting:** ESLint (Flat Config)

## 🌙 Dark Mode
Built-in dark mode support using `next-themes` and Shadcn UI.
- Toggle component: `app/components/theme-toggle.jsx`
- Theme provider: `app/components/theme-provider.jsx`

Thank you!# bcf-hackathon
