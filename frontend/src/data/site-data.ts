import type { Service, Stat, Feature, Project } from "../types";

export const services: Service[] = [
  {
    icon: "◆",
    title: "Application Development",
    description:
      "Production systems from first prototype to scaled deployment. Full-stack, AI-powered, built for reliability.",
    details: [
      "Custom web applications — React, TypeScript, FastAPI",
      "AI & LLM platforms — agent orchestration, RAG, tool calling",
      "Real-time systems — WebSockets, SSE, event-driven architectures",
      "APIs that scale — REST, GraphQL, OpenAI-compatible endpoints",
    ],
  },
  {
    icon: "▲",
    title: "Cloud & Infrastructure",
    description:
      "AWS infrastructure designed for security, cost, and zero-downtime deployments.",
    details: [
      "Cloud architecture — EC2, RDS, EKS, Lambda, S3, Route53",
      "GPU workloads — Spot instances, inference optimization",
      "Infrastructure as code — Terraform, Ansible, CI/CD pipelines",
      "Cost-aware operations — monitoring, automation, right-sizing",
    ],
  },
  {
    icon: "●",
    title: "Engineering Consulting",
    description:
      "Technical leadership for teams and organizations — architecture reviews, team building, compliance.",
    details: [
      "Architecture reviews and strategic technology decisions",
      "Offshore team coordination and process design",
      "HIPAA / HITRUST compliance, security, and authentication",
      "Performance tuning and migration planning",
    ],
  },
];

export const stats: Stat[] = [
  {
    value: "7+",
    label: "Years in business",
  },
  {
    value: "13+",
    label: "Microservices deployed",
  },
  {
    value: "Zero",
    label: "Downtime deployments",
  },
  {
    value: "18+",
    label: "Programming languages",
  },
];

export const features: Feature[] = [
  {
    title: "HIPAA & HITRUST",
    description:
      "Experience building and securing systems for healthcare and regulated industries.",
  },
  {
    title: "Multi-Team Leadership",
    description:
      "Distributed teams across three time zones — India, Vietnam, and on-shore — with consistent delivery.",
  },
  {
    title: "AWS Native",
    description:
      "Deep AWS expertise — from EC2 and RDS to EKS, Lambda, and GPU inference on g5 Spot.",
  },
  {
    title: "AI & LLM Platforms",
    description:
      "Production multi-agent systems, RAG pipelines, and OpenAI-compatible APIs — fully deployed.",
  },
];

export const projects: Project[] = [
  {
    title: "Multi-Agent AI Platform",
    description:
      "Production-deployed collaborative AI platform with per-agent LLM configs, shared vector memory, hybrid search, and OpenAI-compatible APIs for IDE clients.",
    tech: [
      "FastAPI",
      "WebSockets",
      "React 19",
      "PostgreSQL 16",
      "pgvector",
      "llama.cpp",
    ],
    outcome:
      "Zero-downtime deployment with 79%+ test coverage and fully automated CI/CD.",
  },
  {
    title: "Healthcare Coaching Platform",
    description:
      "HIPAA-aware telehealth tool with real-time coaching, device integration, and support for 18 languages across two on-shore and three off-shore teams.",
    tech: ["Zoom API", ".NET 8", "React", "RabbitMQ", "Material UI"],
    outcome:
      "Connected data from Google Fit, Apple HealthKit, and Garmin for a 18-language product.",
  },
  {
    title: "Cloud Platform Migration",
    description:
      "Immutable AWS microservices infrastructure with Terraform. CI/CD pipeline migration maintained zero-downtime deployments across 13 services.",
    tech: ["Terraform", "AWS", "GitHub Actions", "TravisCI", "DynamoDB"],
    outcome:
      "Zero-downtime migration across 13 microservices with full audit trail.",
  },
];
