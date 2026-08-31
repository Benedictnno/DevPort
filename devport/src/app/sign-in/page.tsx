import type { Metadata } from "next";
import Link from "next/link";
import { Code2 } from "lucide-react";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your DevPort account",
};

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mb-3">
            <Code2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to your DevPort account
          </p>
        </div>

        <SignInForm />

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
