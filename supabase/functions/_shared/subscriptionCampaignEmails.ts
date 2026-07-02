import { createHmac } from "node:crypto";
import {
  buildCampaignEmailHtml,
  recipientFirstName,
  type EmailRecipient,
} from "./campaignEmailLayout.ts";

export type { EmailRecipient };

export type SubscriptionCampaignType =
  | "no_subscription_nudge"
  | "trial_expired";

export const SUBSCRIPTION_CAMPAIGN_SUBJECTS: Record<SubscriptionCampaignType, string> = {
  no_subscription_nudge:
    "Activate TScopier — start copying Telegram signals to your broker",
  trial_expired:
    "Your TScopier trial ended — subscribe to resume copying",
};

export function isSubscriptionCampaignType(
  value: string,
): value is SubscriptionCampaignType {
  return value === "no_subscription_nudge" || value === "trial_expired";
}

export function getEmailUnsubscribeUrl(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
): string {
  const hmac = createHmac("sha256", serviceRoleKey);
  hmac.update(userId);
  const token = hmac.digest("hex");
  return `${supabaseUrl}/functions/v1/email-unsubscribe?uid=${userId}&token=${token}`;
}

function buildNoSubscriptionHtml(
  recipient: EmailRecipient,
  unsubscribeUrl: string,
  appUrl: string,
  logoUrl: string,
): string {
  const name = recipientFirstName(recipient);

  return buildCampaignEmailHtml({
    appUrl,
    logoUrl,
    preheader: "Activate a plan to start copying signals to your broker.",
    eyebrow: "Subscription required",
    title: "Activate a plan to go live",
    greeting: name,
    bodyHtml: `
      <p style="margin:0 0 16px 0;">Your TScopier account is ready, but <strong style="color:#0f172a;">signal copying is off</strong> because there's no active subscription.</p>
      <p style="margin:0;">Subscribe to start copying Telegram signals to your broker automatically. Your channels, broker connections, and settings are saved and waiting.</p>
    `,
    primaryCta: {
      label: "View plans & subscribe",
      url: `${appUrl}/pricing`,
    },
    closingHtml: `Questions? Email us at <a href="mailto:support@tscopier.ai" style="color:#0d9488;text-decoration:underline;">support@tscopier.ai</a><br/>Live support is available 24/7 via the app.`,
    unsubscribeUrl,
  });
}

function buildTrialExpiredHtml(
  recipient: EmailRecipient,
  unsubscribeUrl: string,
  appUrl: string,
  logoUrl: string,
): string {
  const name = recipientFirstName(recipient);

  return buildCampaignEmailHtml({
    appUrl,
    logoUrl,
    preheader: "Your free trial has ended. Subscribe to resume trade copying.",
    eyebrow: "Trial ended",
    title: "Subscribe to keep copying",
    greeting: name,
    bodyHtml: `
      <p style="margin:0 0 16px 0;">Your <strong style="color:#0f172a;">10-day trial has ended</strong> and signal copying is now paused.</p>
      <p style="margin:0;">Your broker connections, channels, and settings are still saved. Subscribe to resume automated copying instantly.</p>
    `,
    primaryCta: {
      label: "Subscribe now",
      url: `${appUrl}/pricing`,
    },
    closingHtml: `Questions? Email us at <a href="mailto:support@tscopier.ai" style="color:#0d9488;text-decoration:underline;">support@tscopier.ai</a><br/>Live support is available 24/7 via the app.`,
    unsubscribeUrl,
  });
}

export function buildSubscriptionCampaignHtml(
  campaign: SubscriptionCampaignType,
  recipient: EmailRecipient,
  unsubscribeUrl: string,
  appUrl: string,
  logoUrl: string,
): string {
  switch (campaign) {
    case "no_subscription_nudge":
      return buildNoSubscriptionHtml(recipient, unsubscribeUrl, appUrl, logoUrl);
    case "trial_expired":
      return buildTrialExpiredHtml(recipient, unsubscribeUrl, appUrl, logoUrl);
  }
}
