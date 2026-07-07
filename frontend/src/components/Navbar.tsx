import { useSyncExternalStore } from "react";

const navLinks = [
  { href: "#services", label: "Services" },
  { href: "#about", label: "About" },
  { href: "#work", label: "Our Work" },
  { href: "#contact", label: "Contact" },
];

const subscribe = (callback: () => void) => {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
};

const getSnapshot = () => window.scrollY > 20;

const LogoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    fill="none"
    className="w-9 h-9 text-accent group-hover:text-accent-hover transition-colors"
    aria-hidden="true"
  >
    <path
      d="M16 8L6 24L16 40"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M32 8L42 24L32 40"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="18" y="20" width="12" height="4" rx="1" fill="#c4b5fd" />
    <rect x="21" y="24" width="6" height="8" rx="1" fill="#c4b5fd" />
    <rect x="16" y="32" width="16" height="4" rx="1" fill="#c4b5fd" />
  </svg>
);

export default function Navbar() {
  const scrolled = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return (
    <nav
      className={
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 " +
        (scrolled
          ? "bg-bg-primary/90 backdrop-blur-md border-b border-border-subtle"
          : "bg-transparent")
      }
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 group">
          <LogoIcon />
          <span className="text-lg font-semibold tracking-tight text-text-primary group-hover:text-accent transition-colors hidden md:block">
            Code Smiths
          </span>
        </a>
        <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs sm:text-sm text-text-secondary hover:text-accent transition-colors whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
