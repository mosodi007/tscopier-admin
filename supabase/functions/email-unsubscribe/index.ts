import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { createHmac, timingSafeEqual } from "node:crypto";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = (Deno.env.get("VITE_APP_URL") || "https://app.tscopier.ai").replace(/\/$/, "");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function verifyToken(userId: string, token: string): boolean {
  const hmac = createHmac("sha256", SUPABASE_SERVICE_ROLE_KEY);
  hmac.update(userId);
  const expected = hmac.digest("hex");
  if (token.length !== expected.length) return false;
  return timingSafeEqual(
    Buffer.from(token, "utf-8"),
    Buffer.from(expected, "utf-8"),
  );
}

function pageShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Preferences — TScopier</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      background: #0f1b1a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }
    .logo {
      margin-bottom: 32px;
    }
    .logo img {
      height: 32px;
      display: block;
    }
    .card {
      width: 100%;
      max-width: 440px;
      background: #ffffff;
      border-radius: 16px;
      padding: 40px 32px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.1);
    }
    .icon-circle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }
    .icon-circle.warning { background: #fef3c7; }
    .icon-circle.success { background: #d1fae5; }
    .icon-circle.error { background: #fee2e2; }
    .icon-circle svg { width: 28px; height: 28px; }
    h1 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      text-align: center;
      margin-bottom: 8px;
      line-height: 1.3;
    }
    .subtitle {
      font-size: 14px;
      color: #64748b;
      text-align: center;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .reason-group {
      margin-bottom: 24px;
    }
    .reason-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 8px;
    }
    .reason-option {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 6px;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .reason-option:hover { border-color: #0d9488; background: #f0fdfa; }
    .reason-option input[type="radio"] {
      appearance: none;
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border: 2px solid #cbd5e1;
      border-radius: 50%;
      margin-right: 10px;
      flex-shrink: 0;
      transition: border-color 0.15s;
      position: relative;
    }
    .reason-option input[type="radio"]:checked {
      border-color: #0d9488;
    }
    .reason-option input[type="radio"]:checked::after {
      content: '';
      position: absolute;
      top: 3px; left: 3px;
      width: 6px; height: 6px;
      background: #0d9488;
      border-radius: 50%;
    }
    .reason-option span {
      font-size: 13px;
      color: #334155;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s, opacity 0.15s;
      text-align: center;
      text-decoration: none;
    }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary { background: #0f172a; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #1e293b; }
    .btn-ghost { background: transparent; color: #64748b; margin-top: 12px; }
    .btn-ghost:hover { color: #0f172a; }
    .btn-teal { background: #0d9488; color: #fff; }
    .btn-teal:hover { background: #0f766e; }
    .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
    .note {
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
      line-height: 1.5;
    }
    .note a { color: #94a3b8; text-decoration: underline; }
    .footer {
      margin-top: 32px;
      font-size: 11px;
      color: #64748b;
      text-align: center;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="logo">
    <img src="https://sso.tscopier.ai/storage/v1/object/public/email-assets/tscopierlogo-dark.png" alt="TScopier" />
  </div>
  ${content}
  <div class="footer">Tartarix Inc. &middot; 131 Continental Dr, Suite 305, Newark, DE 19713 US</div>
</body>
</html>`;
}

function confirmPage(uid: string, token: string): string {
  return pageShell(`
  <div class="card">
    <div class="icon-circle warning">
      <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
        <line x1="12" y1="2" x2="12" y2="12"/>
      </svg>
    </div>
    <h1>Unsubscribe from emails?</h1>
    <p class="subtitle">You'll stop receiving subscription reminders and campaign emails from TScopier. Transactional emails (password resets, security alerts) will still be delivered.</p>
    <form method="POST" action="">
      <input type="hidden" name="uid" value="${uid}" />
      <input type="hidden" name="token" value="${token}" />
      <div class="reason-group">
        <span class="reason-label">Help us improve (optional)</span>
        <label class="reason-option"><input type="radio" name="reason" value="too_frequent" /><span>Too many emails</span></label>
        <label class="reason-option"><input type="radio" name="reason" value="not_relevant" /><span>Not relevant to me</span></label>
        <label class="reason-option"><input type="radio" name="reason" value="no_longer_use" /><span>I no longer use TScopier</span></label>
        <label class="reason-option"><input type="radio" name="reason" value="other" /><span>Other reason</span></label>
      </div>
      <button type="submit" class="btn btn-primary">Unsubscribe me</button>
    </form>
    <a href="${APP_URL}" class="btn btn-ghost">Never mind, take me back</a>
  </div>`);
}

function successPage(): string {
  return pageShell(`
  <div class="card">
    <div class="icon-circle success">
      <svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
    <h1>You've been unsubscribed</h1>
    <p class="subtitle">You won't receive any more campaign emails from TScopier. If you change your mind, you can re-subscribe below.</p>
    <div class="divider"></div>
    <p class="note">Changed your mind? You can re-enable emails anytime from your <a href="${APP_URL}/settings">account settings</a>.</p>
  </div>`);
}

function errorPage(title: string, message: string): string {
  return pageShell(`
  <div class="card">
    <div class="icon-circle error">
      <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    </div>
    <h1>${title}</h1>
    <p class="subtitle">${message}</p>
  </div>`);
}

function alreadyUnsubscribedPage(): string {
  return pageShell(`
  <div class="card">
    <div class="icon-circle success">
      <svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
    <h1>Already unsubscribed</h1>
    <p class="subtitle">You're already unsubscribed from TScopier campaign emails. No further action is needed.</p>
    <div class="divider"></div>
    <p class="note">Want to re-enable emails? Visit your <a href="${APP_URL}/settings">account settings</a>.</p>
  </div>`);
}

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);

    if (req.method === "GET") {
      const uid = url.searchParams.get("uid");
      const token = url.searchParams.get("token");

      if (!uid || !token) {
        return new Response(
          errorPage("Invalid Link", "This unsubscribe link is missing required parameters. Please use the link directly from your email."),
          { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      }

      if (!verifyToken(uid, token)) {
        return new Response(
          errorPage("Link Expired", "This unsubscribe link is invalid or has expired. Please use the most recent email you received."),
          { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      }

      const { data: existing } = await supabase
        .from("email_unsubscribes")
        .select("user_id")
        .eq("user_id", uid)
        .maybeSingle();

      if (existing) {
        return new Response(alreadyUnsubscribedPage(), {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      return new Response(confirmPage(uid, token), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (req.method === "POST") {
      const formData = await req.formData();
      const uid = formData.get("uid")?.toString();
      const token = formData.get("token")?.toString();
      const reason = formData.get("reason")?.toString() || null;

      if (!uid || !token) {
        return new Response(
          errorPage("Invalid Request", "Missing required fields. Please try again from the link in your email."),
          { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      }

      if (!verifyToken(uid, token)) {
        return new Response(
          errorPage("Link Expired", "This unsubscribe link is invalid or has expired."),
          { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      }

      const { error } = await supabase
        .from("email_unsubscribes")
        .upsert(
          {
            user_id: uid,
            unsubscribed_at: new Date().toISOString(),
            reason,
          },
          { onConflict: "user_id" },
        );

      if (error) {
        console.error("[email-unsubscribe] upsert error:", error.message);
        return new Response(
          errorPage("Something Went Wrong", "We couldn't process your request right now. Please try again in a moment."),
          { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      }

      return new Response(successPage(), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response(
      errorPage("Method Not Allowed", "This endpoint only accepts GET and POST requests."),
      { status: 405, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  } catch (err) {
    console.error("[email-unsubscribe] unexpected error:", err);
    return new Response(
      errorPage("Something Went Wrong", "An unexpected error occurred. Please try clicking the link in your email again."),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
});
