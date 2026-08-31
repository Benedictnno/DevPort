"use client";

import Link from "next/link";
import { Search, Bell, ExternalLink, Plus, Activity, Terminal } from "lucide-react";

interface DashboardHeaderProps {
  userName?: string | null;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <header className="h-16 border-b border-outline-variant bg-surface-container/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects, services, or APIs..."
            className="w-full bg-surface-container-low border border-outline-variant/60 rounded-lg pl-9 pr-12 py-1.5 text-xs text-on-surface placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 font-mono transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono bg-surface-container-high border border-outline-variant/60 rounded text-muted-foreground">
            /
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Environment Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-surface-container-low border border-outline-variant/60 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span className="font-mono text-[11px] text-on-surface-variant font-medium">env: prod-us-east</span>
        </div>

        {/* Quick Action Button */}
        <Link
          href="/dashboard/import"
          className="flex items-center gap-1.5 bg-primary-container text-on-primary-container hover:brightness-110 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </Link>
      </div>
    </header>
  );
}
