export default function ProjectEditorLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-6 border-b border-border/50">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-surface-container-high rounded" />
          <div className="h-8 w-64 bg-surface-container-high rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-24 bg-surface-container-high rounded-lg" />
          <div className="h-9 w-28 bg-surface-container-high rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 rounded-xl border border-border/50 bg-card/50 p-6" />
          <div className="h-48 rounded-xl border border-border/50 bg-card/50 p-6" />
        </div>
        <div className="space-y-6">
          <div className="h-48 rounded-xl border border-border/50 bg-card/50 p-6" />
          <div className="h-64 rounded-xl border border-border/50 bg-card/50 p-6" />
        </div>
      </div>
    </div>
  );
}
