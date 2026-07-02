import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("VITE_APP_URL") || "https://app.tscopier.ai";

function buildUnsubscribeUrl(uid: string): string {
  const token = btoa(`${uid}:${Date.now()}`);
  return `${SUPABASE_URL}/functions/v1/email-unsubscribe?uid=${uid}&token=${token}`;
}

function noSubscriptionHtml(name: string, unsubUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background-color:#0f172a;padding:32px 40px;text-align:center;">
          <h1 style="color:#ffffff;font-size:22px;margin:0;">TSCopier</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Hey ${name},</h2>
          <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
            Your TSCopier account is all set up, but you haven't activated a subscription yet. Without an active plan, your signals won't be copied to your broker account.
          </p>
          <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Subscribe now to start copying trades automatically from your Telegram channels.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
            <tr><td style="background-color:#2563eb;border-radius:8px;">
              <a href="${APP_URL}/pricing" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">View Plans &amp; Subscribe</a>
            </td></tr>
          </table>
          <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0;">If you have any questions, just reply to this email.</p>
        </td></tr>
        <tr><td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0 0 8px;text-align:center;">Tartarix Inc. | 131 Continental Dr, Suite 305, Newark, DE 19713 US</p>
          <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;"><a href="${unsubUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a> from these emails</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function trialExpiredHtml(name: string, unsubUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background-color:#0f172a;padding:32px 40px;text-align:center;">
          <h1 style="color:#ffffff;font-size:22px;margin:0;">TSCopier</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Hey ${name},</h2>
          <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
            Your free trial has ended. Signal copying is now paused on your account.
          </p>
          <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Subscribe to a plan to resume automated trade copying from your Telegram channels. Your broker accounts and channel configurations are still saved and ready to go.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
            <tr><td style="background-color:#2563eb;border-radius:8px;">
              <a href="${APP_URL}/pricing" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Subscribe Now</a>
            </td></tr>
          </table>
          <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0;">Questions? Just reply to this email and we'll get back to you.</p>
        </td></tr>
        <tr><td style="background-color:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0 0 8px;text-align:center;">Tartarix Inc. | 131 Continental Dr, Suite 305, Newark, DE 19713 US</p>
          <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;"><a href="${unsubUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a> from these emails</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const CAMPAIGNS: Record<
  string,
  { subject: string; html: (name: string, unsubUrl: string) => string }
> = {
  no_subscription_nudge: {
    subject: "Start copying signals - activate your TSCopier subscription",
    html: noSubscriptionHtml,
  },
  trial_expired: {
    subject: "Your TSCopier trial has ended - subscribe to keep copying",
    html: trialExpiredHtml,
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { user_id, campaign } = await req.json();

    if (!user_id || !campaign) {
      return new Response(
        JSON.stringify({ error: "user_id and campaign are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const campaignConfig = CAMPAIGNS[campaign];
    if (!campaignConfig) {
      return new Response(
        JSON.stringify({ error: `Unknown campaign: ${campaign}. Valid: ${Object.keys(CAMPAIGNS).join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user email from auth.users
    const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(user_id);
    if (authErr || !authUser?.user?.email) {
      return new Response(
        JSON.stringify({ error: "Could not find user email", details: authErr?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const email = authUser.user.email;

    // Get display name from user_profiles
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name, first_name")
      .eq("user_id", user_id)
      .maybeSingle();

    const name = profile?.first_name || profile?.display_name || "there";

    // Check if unsubscribed
    const { data: unsub } = await supabase
      .from("email_unsubscribes")
      .select("id")
      .eq("user_id", user_id)
      .maybeSingle();

    if (unsub) {
      return new Response(
        JSON.stringify({ error: "User has unsubscribed from emails" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const unsubUrl = buildUnsubscribeUrl(user_id);

    // Send via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TSCopier <noreply@tscopier.ai>",
        to: [email],
        subject: campaignConfig.subject,
        html: campaignConfig.html(name, unsubUrl),
      }),
    });

    const resData = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Resend API error", status: res.status, details: resData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the sent email
    await supabase.from("email_campaign_log").insert({
      user_id,
      campaign_type: campaign,
      email_address: email,
      metadata: { triggered_by: "admin_manual", resend_id: resData.id },
    });

    return new Response(
      JSON.stringify({ success: true, email, campaign, resend_id: resData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
