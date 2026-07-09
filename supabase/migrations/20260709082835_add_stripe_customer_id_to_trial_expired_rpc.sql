/*
# Add stripe_customer_id to trial expired recipients RPC

1. Modified Functions
  - `get_trial_expired_recipients()` — now also returns `stripe_customer_id` from the subscriptions table
    so the edge function can fetch the user's open Stripe invoice and include a direct payment link
    in the trial expired email.

2. Important Notes
  - The JOIN to `subscriptions` already existed; this just adds the column to the SELECT and RETURNS clause.
  - `stripe_customer_id` may be NULL for users who never entered payment info during trial.
    The edge function handles this gracefully by falling back to the pricing page CTA.
  - DROP + CREATE required because Postgres cannot alter OUT parameter types in-place.
*/

DROP FUNCTION IF EXISTS public.get_trial_expired_recipients();

CREATE OR REPLACE FUNCTION public.get_trial_expired_recipients()
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
    (
      s.status = 'canceled'
      OR (s.trial_ends_at IS NOT NULL AND s.trial_ends_at < now() AND s.status NOT IN ('active', 'trialing'))
    )
    AND NOT EXISTS (
      SELECT 1 FROM email_unsubscribes eu
      WHERE eu.user_id = up.user_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM email_campaign_log ecl
      WHERE ecl.user_id = up.user_id
        AND ecl.campaign_type = 'trial_expired'
    )
  LIMIT 50;
$$;
