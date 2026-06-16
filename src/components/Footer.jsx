export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between text-sm text-muted-foreground">
        <span>&copy; {new Date().getFullYear()} AI Platform. All rights reserved.</span>
        <span>Built with Next.js</span>
      </div>
    </footer>
  );
}
