import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-16 px-6 py-20">
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight">AI Dashboard</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Monitor agents, track traces, and manage your AI platform.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link
          href="/dashboard"
          className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-8 shadow-sm hover:shadow-md hover:border-foreground/20 transition-all"
        >
          <div className="text-3xl">&#128200;</div>
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            View agent metrics, traces, and observability data in real time.
          </p>
          <span className="mt-auto text-sm font-medium group-hover:underline">
            Go to Dashboard &rarr;
          </span>
        </Link>

        <Link
          href="/registerAgent"
          className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-8 shadow-sm hover:shadow-md hover:border-foreground/20 transition-all"
        >
          <div className="text-3xl">&#129302;</div>
          <h2 className="text-xl font-semibold">Register Agent</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Onboard a new AI agent and configure its settings and metadata.
          </p>
          <span className="mt-auto text-sm font-medium group-hover:underline">
            Register Agent &rarr;
          </span>
        </Link>
      </div>
    </div>
  );
}
