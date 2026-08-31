import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    // Skip Next.js internals, API routes, and static files
    "/((?!api|_next/static|_next/image|favicon.ico|public/).*)",
  ],
};

