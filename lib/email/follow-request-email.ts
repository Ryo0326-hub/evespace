import "server-only";

import { Resend } from "resend";
import type { Profile } from "@/types/evespace";

type FollowRequestEmailInput = {
  recipient: Profile;
  requester: Profile;
};

type EmailResult =
  | { sent: true; error: null }
  | { sent: false; error: string | null };

const resendApiKey = process.env.RESEND_API_KEY ?? "";
const emailFrom = process.env.EMAIL_FROM ?? "";

export async function sendFollowRequestEmail({
  recipient,
  requester,
}: FollowRequestEmailInput): Promise<EmailResult> {
  if (!resendApiKey || !emailFrom || !recipient.email) {
    return { sent: false, error: null };
  }

  const requesterName = displayName(requester);
  const notificationsUrl = `${getAppBaseUrl()}/notifications`;
  const resend = new Resend(resendApiKey);

  try {
    const { error } = await resend.emails.send({
      from: emailFrom,
      to: recipient.email,
      subject: `${requesterName} requested to follow you on Evespace`,
      html: renderFollowRequestHtml({ notificationsUrl, requesterName }),
      text: `${requesterName} requested to follow you on Evespace. Review the request: ${notificationsUrl}`,
    });

    if (error) {
      return { sent: false, error: error.message ?? "Failed to send email." };
    }
  } catch (error) {
    return { sent: false, error: toErrorMessage(error) };
  }

  return { sent: true, error: null };
}

function getAppBaseUrl() {
  const configured = process.env.APP_BASE_URL;
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}

function renderFollowRequestHtml({
  notificationsUrl,
  requesterName,
}: {
  notificationsUrl: string;
  requesterName: string;
}) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h1 style="font-size:22px;margin:0 0 12px">New follow request</h1>
      <p style="margin:0 0 16px">${escapeHtml(requesterName)} requested to follow you on Evespace.</p>
      <p style="margin:0 0 20px">Open your notifications to accept or deny the request.</p>
      <a href="${notificationsUrl}" style="display:inline-block;border-radius:999px;background:#0f172a;color:#ffffff;padding:12px 18px;text-decoration:none;font-weight:700">Review request</a>
    </div>
  `;
}

function displayName(profile: Profile) {
  return profile.displayName ?? profile.email ?? "An Evespace user";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to send email.";
}
