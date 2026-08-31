import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
      }
      if (account?.provider === "github" && account.access_token) {
        const userId = (user?.id ?? token.id) as string;
        if (userId) {
          try {
            const { saveGitHubIntegration } = await import(
              "@/modules/integrations/github/github.service"
            );
            await saveGitHubIntegration(userId, {
              accessToken: account.access_token,
              providerAccountId: account.providerAccountId,
              providerAccountName:
                (profile as { login?: string })?.login ??
                user?.name ??
                "github-user",
              scopes: account.scope,
            });
          } catch (err) {
            console.error("Failed to auto-save GitHub integration:", err);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

