import { useState, type FormEvent } from "react";
import type { FormData, FormErrors } from "../types";

const RECAPTCHA_SITE_KEY =
  import.meta.env.VITE_RECAPTCHA_SITE_KEY ??
  "6LcJKUctAAAAAITllqNxIq1Wry_CW2fcunMn9-Mt";
const API_URL =
  "https://vdlbn2zv2k.execute-api.us-west-2.amazonaws.com/api/contact";

export default function Contact() {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email";
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.message.trim()) e.message = "Message is required";
    else if (form.message.trim().length < 10)
      e.message = "Message must be at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      let token = "";
      if (RECAPTCHA_SITE_KEY) {
        const win = window as unknown as Record<string, unknown>;
        const grecaptcha = win.grecaptcha as {
          execute: (
            key: string,
            opts: Record<string, string>,
          ) => Promise<string>;
        };
        if (grecaptcha) {
          token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, {
            action: "contact_form",
          });
        }
      }

      const url = API_URL || "/api/contact";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({
          ...form,
          recaptchaToken: token,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitting(false);
      setSubmitted(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setSubmitError(
        "Network error. Please check your connection and try again.",
      );
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const inputClass = (field: keyof FormErrors) =>
    `w-full px-4 py-3 bg-bg-card border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 transition-all ${
      errors[field]
        ? "border-red-500/50 focus:ring-red-500/30"
        : "border-border-subtle focus:ring-accent/30 focus:border-accent/50"
    }`;

  return (
    <section id="contact" className="py-24 px-6 bg-bg-secondary">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-accent text-sm font-medium tracking-widest uppercase mb-3">
            Get in Touch
          </p>
          <h2 className="text-4xl font-bold text-text-primary mb-4">
            Let's Build Something
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            Tell us about your project. Our team responds within 24 hours.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <div>
            {/* reCAPTCHA script — React handles the DOM insertion natively */}
            {RECAPTCHA_SITE_KEY && (
              <script
                src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
                async
                defer
              />
            )}

            {submitted ? (
              <div className="bg-bg-card border border-border-subtle rounded-xl p-8 text-center">
                <div className="text-3xl mb-3">✓</div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Message Sent
                </h3>
                <p className="text-text-secondary text-sm mb-6">
                  Thanks for reaching out. We'll get back to you soon.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-accent hover:text-accent-hover text-sm transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {submitError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {submitError}
                  </div>
                )}
                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={form.name}
                    onChange={handleChange}
                    className={inputClass("name")}
                  />
                  {errors.name && (
                    <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    value={form.email}
                    onChange={handleChange}
                    className={inputClass("email")}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    name="subject"
                    placeholder="Subject"
                    value={form.subject}
                    onChange={handleChange}
                    className={inputClass("subject")}
                  />
                  {errors.subject && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.subject}
                    </p>
                  )}
                </div>
                <div>
                  <textarea
                    name="message"
                    placeholder="Tell us about your project..."
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    className={inputClass("message")}
                  />
                  {errors.message && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-bg-primary font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-accent/20"
                >
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
