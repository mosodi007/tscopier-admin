/*
# Create RPC function for invoice due email recipients

1. New Functions
  - `get_invoice_due_recipients()` - Returns users eligible for the "invoice due" automated email:
    - Subscription status is 'past_due'
    - Has a `stripe_customer_id` (needed to fetch invoice details from Stripe)
    - Not in `email_unsubscribes` table
    - Last `invoice_due` email was sent more than 3 days ago (or never sent)
    - Returns: user_id, email, display_name, first_name, stripe_customer_id

2. Security
  - SECURITY DEFINER to bypass RLS (called by edge function with service role).
  - Limited to 20 recipients per batch (Stripe API rate-limiting consideration — each recipient triggers a Stripe API call).

3. Important Notes
  - The 3-day repeat gap allows persistent but non-aggressive follow-up on unpaid invoices.
  - stripe_customer_id is included in the result so the edge function can look up the open invoice without a second DB query.
*/

CREATE OR REPLACE FUNCTION public.get_invoice_due_recipients()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  first_name text,
  stripe_customer_id text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    up.user_id,
    au.email::text,
    up.display_name,
    up.first_name,
    s.stripe_customer_id
  FROM user_profiles up
  JOIN auth.users au ON au.id = up.user_id
  JOIN subscriptions s ON s.user_id = up.user_id
  WHERE
    -- Subscription is past_due (payment failed)
    s.status = 'past_due'
    -- Must have a Stripe customer ID to look up the invoice
    AND s.stripe_customer_id IS NOT NULL
    -- Not unsubscribed from emails
    AND NOT EXISTS (
      SELECT 1 FROM email_unsubscribes eu
      WHERE eu.user_id = up.user_id
    )
    -- Last invoice_due email was more than 3 days ago or never sent
    AND NOT EXISTS (
      SELECT 1 FROM email_campaign_log ecl
      WHERE ecl.user_id = up.user_id
        AND ecl.campaign_type = 'invoice_due'
        AND ecl.sent_at > now() - interval '3 days'
    )
  LIMIT 20;
$$;
