export default function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-border-subtle">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-text-muted">
          © {new Date().getFullYear()} Code Smiths, LLC. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
