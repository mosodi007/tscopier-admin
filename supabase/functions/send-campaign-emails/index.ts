import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const APP_URL = Deno.env.get("VITE_APP_URL") || "https://app.tscopier.com";

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
  unsubscribeUrl: string
): string {
  const name = recipient.first_name || recipient.display_name || "there";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#0f172a;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;font-size:22px;margin:0;">TSCopier</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Hey ${name},</h2>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
                Your TSCopier account is all set up, but you haven't activated a subscription yet. Without an active plan, your signals won't be copied to your broker account.
              </p>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Subscribe now to start copying trades automatically from your Telegram channels.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background-color:#2563eb;border-radius:8px;">
                    <a href="${APP_URL}/pricing" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                      View Plans &amp; Subscribe
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0;">
                If you have any questions, just reply to this email. We're happy to help.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0 0 8px;text-align:center;">
                Tartarix Inc. | 131 Continental Dr, Suite 305, Newark, DE 19713 US
              </p>
              <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
                <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a> from these emails
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildTrialExpiredEmail(
  recipient: EmailRecipient,
  unsubscribeUrl: string
): string {
  const name = recipient.first_name || recipient.display_name || "there";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#0f172a;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;font-size:22px;margin:0;">TSCopier</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Hey ${name},</h2>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
                Your free trial has ended. Signal copying is now paused on your account.
              </p>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Subscribe to a plan to resume automated trade copying from your Telegram channels. Your broker accounts and channel configurations are still saved and ready to go.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background-color:#2563eb;border-radius:8px;">
                    <a href="${APP_URL}/pricing" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                      Subscribe Now
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0;">
                Questions? Just reply to this email and we'll get back to you.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0 0 8px;text-align:center;">
                Tartarix Inc. | 131 Continental Dr, Suite 305, Newark, DE 19713 US
              </p>
              <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
                <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a> from these emails
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TSCopier <noreply@tscopier.ai>",
        to: [to],
        subject,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function processNoSubscriptionNudge(): Promise<number> {
  // Find users who:
  // 1. Completed onboarding at least 1 hour ago
  // 2. Have NO subscription with status 'active' or 'trialing'
  // 3. Are not in email_unsubscribes
  // 4. Last email of this type was sent more than 3 days ago (or never)
  const { data: eligibleUsers, error } = await supabase.rpc(
    "get_no_subscription_nudge_recipients"
  );

  if (error || !eligibleUsers || eligibleUsers.length === 0) {
    return 0;
  }

  let sent = 0;
  for (const user of eligibleUsers) {
    const unsubscribeUrl = getUnsubscribeUrl(user.user_id);
    const html = buildNoSubscriptionEmail(user, unsubscribeUrl);
    const success = await sendEmail(
      user.email,
      "Start copying signals - activate your TSCopier subscription",
      html
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
  // Find users who:
  // 1. Have a subscription with status 'canceled' or trial_ends_at in the past
  // 2. Are not in email_unsubscribes
  // 3. Have NOT already received a 'trial_expired' email
  const { data: eligibleUsers, error } = await supabase.rpc(
    "get_trial_expired_recipients"
  );

  if (error || !eligibleUsers || eligibleUsers.length === 0) {
    return 0;
  }

  let sent = 0;
  for (const user of eligibleUsers) {
    const unsubscribeUrl = getUnsubscribeUrl(user.user_id);
    const html = buildTrialExpiredEmail(user, unsubscribeUrl);
    const success = await sendEmail(
      user.email,
      "Your TSCopier trial has ended - subscribe to keep copying",
      html
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
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
