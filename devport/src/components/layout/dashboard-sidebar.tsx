"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FolderOpen,
  GitBranch,
  Key,
  Settings,
  LogOut,
  Terminal,
  Plus,
  ShieldCheck,
} from "lucide-react";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface DashboardSidebarProps {
  user: User;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/projects", label: "Projects", icon: FolderOpen },
  { href: "/dashboard/import", label: "Import from GitHub", icon: GitBranch },
  { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col border-r border-outline-variant bg-surface-container z-40">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-outline-variant/60">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm shadow-primary/20 group-hover:scale-105 transition-transform">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-on-surface tracking-tight">
                DevPort
              </span>
              <span className="font-mono text-[9px] px-1.5 py-0.2 bg-primary/10 text-primary border border-primary/20 rounded">
                v1.0
              </span>
            </div>
            <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
              Infrastructure
            </p>
          </div>
        </Link>
      </div>

      {/* Quick Action */}
      <div className="p-3.5 pb-2">
        <Link
          href="/dashboard/import"
          id="import-from-github-btn"
          className="flex items-center justify-center gap-2 w-full bg-primary-container text-on-primary-container hover:brightness-110 active:scale-[0.98] rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Import Project
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 font-mono text-[10px] uppercase text-muted-foreground tracking-wider">
          Platform
        </p>
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all duration-150 ${
                active
                  ? "bg-surface-container-highest text-primary font-semibold border-l-2 border-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-medium"
              }`}
            >
              <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* System Live Pill */}
      <div className="px-4 py-2 mx-3 mb-2 rounded-md bg-surface-container-low border border-outline-variant/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px] text-on-surface-variant">Cluster Live</span>
        </div>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      </div>

      {/* User Session Footer */}
      <div className="border-t border-outline-variant/60 p-3 bg-surface-container-low/50">
        <div className="flex items-center gap-3 px-2 py-1.5 mb-1.5">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name ?? ""}
              className="w-7 h-7 rounded-full flex-shrink-0 border border-outline-variant"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-xs font-semibold text-primary">
                {user.name?.[0] ?? user.email?.[0] ?? "?"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-on-surface truncate">
              {user.name ?? user.email}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          id="sign-out-btn"
          className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-xs text-on-surface-variant hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
