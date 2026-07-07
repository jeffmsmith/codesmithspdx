import { services } from "../data/site-data";
import type { Service } from "../types";

function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="group card-glow bg-bg-card hover:bg-bg-card-hover rounded-xl p-8 border border-border-subtle hover:border-border-medium transition-all duration-300">
      <div className="text-3xl mb-4 text-accent group-hover:text-accent-hover transition-colors">
        {service.icon}
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-3">
        {service.title}
      </h3>
      <p className="text-text-secondary mb-6 leading-relaxed">
        {service.description}
      </p>
      <ul className="space-y-2">
        {service.details.map((detail, i) => (
          <li
            key={i}
            className="text-sm text-text-muted flex items-start gap-2"
          >
            <span className="text-accent mt-1.5 text-xs">›</span>
            {detail}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Services() {
  return (
    <section id="services" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-accent text-sm font-medium tracking-widest uppercase mb-3">
            What We Do
          </p>
          <h2 className="text-4xl font-bold text-text-primary mb-4">
            What We Deliver
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            End-to-end solutions — from architecture review to production
            deployment. Retained, project-based, or staff augmentation.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard key={service.title} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}
