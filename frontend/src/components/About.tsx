import { stats, features } from "../data/site-data";
import type { Stat, Feature } from "../types";

function StatBox({ stat }: { stat: Stat }) {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-accent mb-2">
        {stat.value}
      </div>
      <div className="text-sm text-text-muted">{stat.label}</div>
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className="bg-bg-card rounded-xl p-6 border border-border-subtle hover:border-border-medium transition-colors">
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        {feature.title}
      </h3>
      <p className="text-sm text-text-secondary leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
}

export default function About() {
  return (
    <section id="about" className="py-24 px-6 bg-bg-secondary">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-accent text-sm font-medium tracking-widest uppercase mb-3">
            Why Code Smiths
          </p>
          <h2 className="text-4xl font-bold text-text-primary mb-4">
            Results, Not Resumes
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            Seven years of production systems for startups, healthcare, and
            enterprise. The same engineering rigor as the largest consultancies
            — without the markup.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat) => (
            <StatBox key={stat.label} stat={stat} />
          ))}
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
