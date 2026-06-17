import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-base font-semibold text-foreground tracking-tight">
          AI Agent Management Platform
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {[
            { label: "Home", href: "/" },
            { label: "Dashboard", href: "/dashboard" },
            { label: "Register Agent", href: "/registerAgent" },
            { label: "Validate Agent", href: "/chat" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
