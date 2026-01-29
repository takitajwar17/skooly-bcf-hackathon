"use client";

import { SignUp } from "@clerk/nextjs";
import { useEffect } from "react";

const SignUpPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <SignUp fallbackRedirectUrl="/dashboard" />
    </div>
  );
};

export default SignUpPage;