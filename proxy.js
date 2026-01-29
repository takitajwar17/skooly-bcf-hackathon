import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/health",
  "/api/materials(.*)",
  "/api/materials/courses",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

const proxy = clerkMiddleware(async (auth, req) => {
  // If it's an admin route, ensure the user is an admin
  if (isAdminRoute(req)) {
    const { userId, sessionClaims } = await auth();
    
    // Check if role is in claims, if not, it might not be mapped in Clerk Dashboard
    const role = sessionClaims?.metadata?.role || sessionClaims?.publicMetadata?.role;
    
    console.log(`Checking admin access for user ${userId}. Role found in claims: ${role}`);

    if (role !== "admin") {
      console.log("Access denied: Not an admin. Redirecting to home.");
      const url = new URL("/", req.url);
      return Response.redirect(url);
    }
  }

  // If it's not a public route, protect it
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export { proxy as default, proxy };

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
