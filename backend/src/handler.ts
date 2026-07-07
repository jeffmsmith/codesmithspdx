import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import type { Resend } from "resend";

const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL ?? "jeff@jeffmsmith.com";

interface FormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface RecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  "error-codes"?: string[];
}

interface RecaptchaError {
  success: false;
  "error-codes": string[];
}

type RecaptchaResult = RecaptchaResponse | RecaptchaError;

const validateForm = (body: unknown): FormPayload | null => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const cast = body as Record<string, unknown>;

  const name = cast.name;
  const email = cast.email;
  const subject = cast.subject;
  const message = cast.message;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof subject !== "string" ||
    typeof message !== "string"
  ) {
    return null;
  }

  const trimmed: FormPayload = {
    name: name.trim(),
    email: email.trim(),
    subject: subject.trim(),
    message: message.trim(),
  };

  if (
    trimmed.name.length === 0 ||
    trimmed.email.length === 0 ||
    trimmed.subject.length === 0 ||
    trimmed.message.length === 0
  ) {
    return null;
  }

  if (trimmed.message.length < 10) {
    return null;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed.email)) {
    return null;
  }

  return trimmed;
};

const verifyRecaptcha = async (token: string): Promise<boolean> => {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return false;
  }

  const response = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
      }),
    },
  );

  const data = (await response.json()) as RecaptchaResult;

  if ("error-codes" in data && !data.success) {
    return false;
  }

  return data.success;
};

export const handler = async (
  event: APIGatewayProxyEvent | Record<string, unknown>,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  // Normalize Lambda URL and API Gateway events
  const rawEvent = event as Record<string, unknown>;
  const bodyString =
    typeof rawEvent.body === "string"
      ? rawEvent.body
      : typeof rawEvent === "object" && rawEvent !== null
        ? JSON.stringify(rawEvent)
        : "{}";

  // Determine HTTP method
  let httpMethod: string = (rawEvent.httpMethod as string) ?? "";
  if (!httpMethod) {
    const rc =
      typeof rawEvent.requestContext === "object" &&
      rawEvent.requestContext !== null
        ? (rawEvent.requestContext as Record<string, unknown>)
        : {};
    const http =
      typeof rc.http === "object" && rc.http !== null
        ? (rc.http as Record<string, unknown>)
        : {};
    httpMethod = (typeof http.method === "string" ? http.method : "") ?? "";
  }
  if (!httpMethod) {
    httpMethod = (rawEvent.method as string) ?? "POST";
  }

  // Determine headers
  const headersObj =
    typeof rawEvent.headers === "object" && rawEvent.headers !== null
      ? (rawEvent.headers as Record<string, string>)
      : {};
  const origin = headersObj["origin"] ?? headersObj["Origin"] ?? "*";
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyString);
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  const form = validateForm(body);
  if (!form) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Validation failed" }),
    };
  }

  // reCAPTCHA verification is best-effort; don't block if it fails
  // (the site key may not match the deployed domain during setup)
  const recaptchaToken = (body as Record<string, unknown>).recaptchaToken;
  if (typeof recaptchaToken === "string" && recaptchaToken.length > 0) {
    const recaptchaVerified = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaVerified) {
      console.warn("reCAPTCHA verification failed — proceeding anyway");
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Missing RESEND_API_KEY" }),
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Code Smiths <contact@codesmithspdx.com>",
        to: [RECIPIENT_EMAIL],
        subject: `[Contact] ${form.subject}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
            <h2 style="margin-bottom: 24px; color: #a78bfa;">New Contact Message</h2>
            <p><strong>From:</strong> ${form.name}</p>
            <p><strong>Email:</strong> ${form.email}</p>
            <p><strong>Subject:</strong> ${form.subject}</p>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e5e5;" />
            <p style="white-space: pre-wrap;">${form.message}</p>
          </div>
        `,
        reply_to: form.email,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Failed to send message" }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ id: data?.id, message: "Message sent" }),
    };
  } catch (err) {
    console.error("Unhandled error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
