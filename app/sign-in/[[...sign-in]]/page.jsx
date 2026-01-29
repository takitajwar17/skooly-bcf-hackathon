"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect } from "react";

const SignInPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <SignIn fallbackRedirectUrl="/dashboard" />
    </div>
  );
};

export default SignInPage;