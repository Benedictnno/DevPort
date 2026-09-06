export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-surface-container-high rounded-lg" />
          <div className="h-4 w-72 bg-surface-container-high/60 rounded" />
        </div>
        <div className="h-10 w-32 bg-surface-container-high rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 rounded-xl border border-border/50 bg-card/50 space-y-3"
          >
            <div className="h-4 w-24 bg-surface-container-high rounded" />
            <div className="h-7 w-16 bg-surface-container-high rounded-lg" />
            <div className="h-3 w-36 bg-surface-container-high/60 rounded" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4">
        <div className="h-6 w-36 bg-surface-container-high rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 w-full bg-surface-container-high/40 rounded-lg"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
