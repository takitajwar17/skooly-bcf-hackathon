"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center -mt-20">
      <div className="text-center space-y-6 p-8 bg-card max-w-md">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-3xl font-semibold text-foreground">Page Not Found</h2>
        <p className="text-muted-foreground">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-block bg-primary text-primary-foreground px-8 py-2.5 rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
            >
              ← Back to Home
            </Link>
            <Link
              href="/dashboard"
              className="inline-block border border-input text-primary px-8 py-2.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors font-medium text-sm"
            >
              View Dashboard
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            If you believe this is a mistake, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
