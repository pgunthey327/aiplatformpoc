import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-14 px-6 py-24">
      {/* Hero */}
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
          AI Observability Platform
        </p>
        <h1 className="text-6xl font-bold tracking-tight text-foreground">
          AI Dashboard
        </h1>
        <p className="mt-4 text-base text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Monitor agents, track traces, and manage your AI platform in one place.
        </p>
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        <Link
          href="/dashboard"
          className="group flex flex-col gap-5 rounded-lg border border-border bg-card p-7 hover:border-primary/50 hover:bg-secondary transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5V19a1 1 0 001 1h4a1 1 0 001-1v-5.5M9 9V19m0-10V5a1 1 0 011-1h4a1 1 0 011 1v14M15 13V19m0-6V9a1 1 0 011-1h4a1 1 0 011 1v10a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Dashboard</h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              View agent metrics, traces, and observability data.
            </p>
          </div>
          <span className="text-sm font-medium text-primary group-hover:underline underline-offset-4">
            Go to Dashboard &rarr;
          </span>
        </Link>

        <Link
          href="/registerAgent"
          className="group flex flex-col gap-5 rounded-lg border border-border bg-card p-7 hover:border-primary/50 hover:bg-secondary transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Register Agent</h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Onboard a new AI agent and configure its settings.
            </p>
          </div>
          <span className="text-sm font-medium text-primary group-hover:underline underline-offset-4">
            Register Agent &rarr;
          </span>
        </Link>
      </div>
    </div>
  );
}
