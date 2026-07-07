export interface Service {
  icon: string;
  title: string;
  description: string;
  details: string[];
}

export interface Stat {
  value: string;
  label: string;
}

export interface Feature {
  title: string;
  description: string;
}

export interface Project {
  title: string;
  description: string;
  tech: string[];
  outcome: string;
}

export interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}
