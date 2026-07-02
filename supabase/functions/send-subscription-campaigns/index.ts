import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { createHmac } from "node:crypto";
import {
  buildCampaignEmailHtml,
  recipientFirstName,
} from "../_shared/campaignEmailLayout.ts";
import { resolveEmailLogoUrl } from "../_shared/brandEmailAssets.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const APP_URL = (Deno.env.get("VITE_APP_URL") || "https://app.tscopier.ai").replace(/\/$/, "");
const LOGO_URL = resolveEmailLogoUrl({
  supabaseUrl: SUPABASE_URL,
  appUrl: APP_URL,
  variant: "dark",
  explicitUrl: Deno.env.get("EMAIL_LOGO_URL"),
});
const RESEND_FROM = Deno.env.get("RESEND_CAMPAIGN_FROM") || "TScopier <noreply@tscopier.ai>";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function generateUnsubscribeToken(userId: string): string {
  const hmac = createHmac("sha256", SUPABASE_SERVICE_ROLE_KEY);
  hmac.update(userId);
  return hmac.digest("hex");
}

function getUnsubscribeUrl(userId: string): string {
  const token = generateUnsubscribeToken(userId);
  return `${SUPABASE_URL}/functions/v1/email-unsubscribe?uid=${userId}&token=${token}`;
}

interface EmailRecipient {
  user_id: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
}

function buildNoSubscriptionEmail(
  recipient: EmailRecipient,
  unsubscribeUrl: string,
): string {
  const name = recipientFirstName(recipient);

  return buildCampaignEmailHtml({
    appUrl: APP_URL,
    logoUrl: LOGO_URL,
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
      url: `${APP_URL}/pricing`,
    },
    closingHtml: `Questions? Email us at <a href="mailto:support@tscopier.ai" style="color:#0d9488;text-decoration:underline;">support@tscopier.ai</a><br/>Live support is available 24/7 via the app.`,
    unsubscribeUrl,
  });
}

function buildTrialExpiredEmail(
  recipient: EmailRecipient,
  unsubscribeUrl: string,
): string {
  const name = recipientFirstName(recipient);

  return buildCampaignEmailHtml({
    appUrl: APP_URL,
    logoUrl: LOGO_URL,
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
      url: `${APP_URL}/pricing`,
    },
    closingHtml: `Questions? Email us at <a href="mailto:support@tscopier.ai" style="color:#0d9488;text-decoration:underline;">support@tscopier.ai</a><br/>Live support is available 24/7 via the app.`,
    unsubscribeUrl,
  });
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error("[send-subscription-campaigns] RESEND_API_KEY missing");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error("[send-subscription-campaigns] Resend error:", await res.text());
    }
    return res.ok;
  } catch (err) {
    console.error("[send-subscription-campaigns] send failed:", err);
    return false;
  }
}

async function processNoSubscriptionNudge(): Promise<number> {
  const { data: eligibleUsers, error } = await supabase.rpc(
    "get_no_subscription_nudge_recipients",
  );

  if (error) {
    console.error("[send-subscription-campaigns] nudge rpc:", error.message);
    return 0;
  }
  if (!eligibleUsers?.length) return 0;

  let sent = 0;
  for (const user of eligibleUsers as EmailRecipient[]) {
    const unsubscribeUrl = getUnsubscribeUrl(user.user_id);
    const html = buildNoSubscriptionEmail(user, unsubscribeUrl);
    const success = await sendEmail(
      user.email,
      "Activate TScopier — start copying Telegram signals to your broker",
      html,
    );

    if (success) {
      await supabase.from("email_campaign_log").insert({
        user_id: user.user_id,
        campaign_type: "no_subscription_nudge",
        email_address: user.email,
      });
      sent++;
    }
  }

  return sent;
}

async function processTrialExpired(): Promise<number> {
  const { data: eligibleUsers, error } = await supabase.rpc(
    "get_trial_expired_recipients",
  );

  if (error) {
    console.error("[send-subscription-campaigns] trial_expired rpc:", error.message);
    return 0;
  }
  if (!eligibleUsers?.length) return 0;

  let sent = 0;
  for (const user of eligibleUsers as EmailRecipient[]) {
    const unsubscribeUrl = getUnsubscribeUrl(user.user_id);
    const html = buildTrialExpiredEmail(user, unsubscribeUrl);
    const success = await sendEmail(
      user.email,
      "Your TScopier trial ended — subscribe to resume copying",
      html,
    );

    if (success) {
      await supabase.from("email_campaign_log").insert({
        user_id: user.user_id,
        campaign_type: "trial_expired",
        email_address: user.email,
      });
      sent++;
    }
  }

  return sent;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const nudgeSent = await processNoSubscriptionNudge();
    const trialSent = await processTrialExpired();

    return new Response(
      JSON.stringify({
        success: true,
        no_subscription_nudge_sent: nudgeSent,
        trial_expired_sent: trialSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
