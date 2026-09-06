export default function PublicProjectLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-pulse">
      <header className="border-b border-border/40 bg-surface-container-lowest/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="h-6 w-32 bg-surface-container-high rounded" />
          <div className="h-9 w-24 bg-surface-container-high rounded-lg" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="space-y-4">
          <div className="h-10 w-2/3 max-w-lg bg-surface-container-high rounded-lg" />
          <div className="h-5 w-full max-w-2xl bg-surface-container-high/60 rounded" />
          <div className="flex gap-2 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 w-20 bg-surface-container-high rounded-full" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-72 rounded-2xl border border-border/50 bg-card/40 p-6" />
            <div className="h-56 rounded-2xl border border-border/50 bg-card/40 p-6" />
          </div>
          <div className="space-y-6">
            <div className="h-48 rounded-2xl border border-border/50 bg-card/40 p-6" />
            <div className="h-48 rounded-2xl border border-border/50 bg-card/40 p-6" />
          </div>
        </div>
      </main>
    </div>
  );
}
