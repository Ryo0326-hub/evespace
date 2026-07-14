import "server-only";

import { Resend } from "resend";
import type { Profile } from "@/types/evespace";

type ImportantNotificationEmailInput = {
  recipient: Profile;
  subject: string;
  heading: string;
  message: string;
  href: string;
  actionLabel: string;
};

export type EmailResult =
  | { sent: true; error: null }
  | { sent: false; error: string | null };

export async function sendImportantNotificationEmail({
  recipient,
  subject,
  heading,
  message,
  href,
  actionLabel,
}: ImportantNotificationEmailInput): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY ?? "";
  const emailFrom = process.env.EMAIL_FROM ?? "";

  if (!apiKey || !emailFrom || !recipient.email) {
    return { sent: false, error: null };
  }

  const absoluteHref = `${getAppBaseUrl()}${href.startsWith("/") ? href : `/${href}`}`;
  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from: emailFrom,
      to: recipient.email,
      subject,
      html: renderEmail({ actionLabel, absoluteHref, heading, message }),
      text: `${message} ${actionLabel}: ${absoluteHref}`,
    });

    if (error) {
      return { sent: false, error: error.message ?? "Failed to send email." };
    }
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Failed to send email.",
    };
  }

  return { sent: true, error: null };
}

function getAppBaseUrl() {
  const configured = process.env.APP_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  return vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000";
}

function renderEmail({
  actionLabel,
  absoluteHref,
  heading,
  message,
}: {
  actionLabel: string;
  absoluteHref: string;
  heading: string;
  message: string;
}) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h1 style="font-size:22px;margin:0 0 12px">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 20px">${escapeHtml(message)}</p>
      <a href="${escapeHtml(absoluteHref)}" style="display:inline-block;border-radius:999px;background:#0f172a;color:#ffffff;padding:12px 18px;text-decoration:none;font-weight:700">${escapeHtml(actionLabel)}</a>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
