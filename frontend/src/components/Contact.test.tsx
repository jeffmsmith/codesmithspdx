import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Contact from "./Contact";

// Mock fetch
(globalThis as any).fetch = vi.fn();

describe("Contact Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }),
    );
  });

  it("renders the contact form", () => {
    render(<Contact />);
    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/subject/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/tell us about your project/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send message/i }),
    ).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    render(<Contact />);
    const submitButton = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/subject is required/i)).toBeInTheDocument();
    expect(screen.getByText(/message is required/i)).toBeInTheDocument();
  });

  it("shows validation error for invalid email", async () => {
    render(<Contact />);
    const nameInput = screen.getByPlaceholderText(/your name/i);
    const emailInput = screen.getByPlaceholderText(/your email/i);
    const subjectInput = screen.getByPlaceholderText(/subject/i);
    const messageInput = screen.getByPlaceholderText(
      /tell us about your project/i,
    );

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(subjectInput, { target: { value: "Test Subject" } });
    fireEvent.change(messageInput, {
      target: { value: "This is a test message" },
    });

    const submitButton = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
  });

  it("sends form data when valid", async () => {
    render(<Contact />);
    const nameInput = screen.getByPlaceholderText(/your name/i);
    const emailInput = screen.getByPlaceholderText(/your email/i);
    const subjectInput = screen.getByPlaceholderText(/subject/i);
    const messageInput = screen.getByPlaceholderText(
      /tell us about your project/i,
    );

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(subjectInput, { target: { value: "Test Subject" } });
    fireEvent.change(messageInput, {
      target: { value: "This is a test message" },
    });

    const submitButton = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(submitButton);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("Test User"),
      }),
    );
  });

  it("shows success message after successful submit", async () => {
    (globalThis as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }),
    );

    render(<Contact />);
    const nameInput = screen.getByPlaceholderText(/your name/i);
    const emailInput = screen.getByPlaceholderText(/your email/i);
    const subjectInput = screen.getByPlaceholderText(/subject/i);
    const messageInput = screen.getByPlaceholderText(
      /tell us about your project/i,
    );

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(subjectInput, { target: { value: "Test Subject" } });
    fireEvent.change(messageInput, {
      target: { value: "This is a test message" },
    });

    const submitButton = screen.getByRole("button", { name: /send message/i });
    await fireEvent.click(submitButton);

    await new Promise((r) => setTimeout(r, 100));
    expect(screen.getByText(/message sent/i)).toBeInTheDocument();
    expect(screen.getByText(/thanks for reaching out/i)).toBeInTheDocument();
  });

  it("shows error message when submit fails", async () => {
    (globalThis as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Something went wrong." }),
      }),
    );

    render(<Contact />);
    const nameInput = screen.getByPlaceholderText(/your name/i);
    const emailInput = screen.getByPlaceholderText(/your email/i);
    const subjectInput = screen.getByPlaceholderText(/subject/i);
    const messageInput = screen.getByPlaceholderText(
      /tell us about your project/i,
    );

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(subjectInput, { target: { value: "Test Subject" } });
    fireEvent.change(messageInput, {
      target: { value: "This is a test message" },
    });

    const submitButton = screen.getByRole("button", { name: /send message/i });
    await fireEvent.click(submitButton);

    await new Promise((r) => setTimeout(r, 100));
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
