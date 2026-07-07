export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col justify-center items-center px-6 relative overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent-subtle/30 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-glow/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">
        <p className="text-accent text-sm font-medium tracking-widest uppercase mb-6">
          Code Smiths, LLC
        </p>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
          <span className="text-gradient">Software</span>
          <br />
          <span className="text-text-primary">That Works</span>
        </h1>
        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed mb-12">
          Full-stack engineering, cloud infrastructure, and AI platform
          development for teams that ship. From concept to production — no
          bloat, just results.
        </p>
        <a
          href="#contact"
          className="inline-flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent-hover text-bg-primary font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-accent/20"
        >
          Start a Project
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}
