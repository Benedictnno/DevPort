import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-surface">
      <DashboardSidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader userName={session.user.name} />
        <main className="flex-1 overflow-y-auto bg-background p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
