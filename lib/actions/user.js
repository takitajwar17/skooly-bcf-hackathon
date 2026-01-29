"use server";

import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Get current authenticated user details from Clerk
 */
export const getCurrentUser = cache(async () => {
  const user = await currentUser();
  return user ? JSON.parse(JSON.stringify(user)) : null;
});

/**
 * Ensure request is authenticated
 */
export const requireAuth = async () => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: Must be logged in");
  }
  return userId;
};
