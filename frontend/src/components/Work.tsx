import { projects } from "../data/site-data";
import type { Project } from "../types";

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="group bg-bg-card rounded-xl p-8 border border-border-subtle hover:border-border-medium transition-all duration-300 card-glow">
      <h3 className="text-xl font-semibold text-text-primary mb-3 group-hover:text-accent transition-colors">
        {project.title}
      </h3>
      <p className="text-text-secondary mb-5 leading-relaxed text-sm">
        {project.description}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {project.tech.map((t) => (
          <span
            key={t}
            className="px-2 py-0.5 text-xs rounded bg-accent-subtle text-accent font-mono"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="pt-4 border-t border-border-subtle">
        <p className="text-xs text-text-muted italic">
          <span className="text-text-secondary">Impact: </span>
          {project.outcome}
        </p>
      </div>
    </div>
  );
}

export default function Work() {
  return (
    <section id="work" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-accent text-sm font-medium tracking-widest uppercase mb-3">
            Case Studies
          </p>
          <h2 className="text-4xl font-bold text-text-primary mb-4">
            What We've Built
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            Systems deployed under real conditions — healthcare, AI, and
            enterprise infrastructure at scale.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.title} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
