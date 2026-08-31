import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const isProtected = pathname.startsWith("/dashboard");
      const isAuthPath = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

      if (isProtected) {
        if (isLoggedIn) return true;
        return false; // Automatically redirects to signIn page
      } else if (isAuthPath) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
      }
      return true;
    },
  },
};
