import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { createHmac, timingSafeEqual } from "node:crypto";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function verifyToken(userId: string, token: string): boolean {
  const hmac = createHmac("sha256", SUPABASE_SERVICE_ROLE_KEY);
  hmac.update(userId);
  const expected = hmac.digest("hex");
  if (token.length !== expected.length) return false;
  return timingSafeEqual(
    Buffer.from(token, "utf-8"),
    Buffer.from(expected, "utf-8")
  );
}

function renderHtml(title: string, message: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin:0; padding:40px 20px; background:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
    .card { max-width:480px; margin:60px auto; background:#fff; border-radius:12px; padding:40px; box-shadow:0 1px 3px rgba(0,0,0,0.1); text-align:center; }
    h1 { color:#1e293b; font-size:20px; margin:0 0 12px; }
    p { color:#64748b; font-size:15px; line-height:1.6; margin:0; }
    .footer { margin-top:32px; color:#94a3b8; font-size:12px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <p class="footer">Tartarix Inc. | 131 Continental Dr, Suite 305, Newark, DE 19713 US</p>
  </div>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("uid");
    const token = url.searchParams.get("token");

    if (!userId || !token) {
      return new Response(
        renderHtml("Invalid Link", "This unsubscribe link is invalid or has expired."),
        { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    if (!verifyToken(userId, token)) {
      return new Response(
        renderHtml("Invalid Link", "This unsubscribe link is invalid or has expired."),
        { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const { error } = await supabase
      .from("email_unsubscribes")
      .upsert(
        { user_id: userId, unsubscribed_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (error) {
      return new Response(
        renderHtml("Something Went Wrong", "We couldn't process your request. Please try again later."),
        { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    return new Response(
      renderHtml(
        "Unsubscribed Successfully",
        "You've been unsubscribed from TSCopier marketing emails. You will no longer receive subscription reminders."
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (err) {
    return new Response(
      renderHtml("Something Went Wrong", "An unexpected error occurred. Please try again."),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
});
