/*
# Create RPC functions for email campaign recipient queries

1. New Functions

- `get_no_subscription_nudge_recipients()` - Returns users eligible for the "no subscription" nudge email:
  - Onboarded at least 1 hour ago
  - No subscription with status 'active' or 'trialing'
  - Not in email_unsubscribes table
  - Last email of type 'no_subscription_nudge' was sent more than 3 days ago (or never)
  - Returns: user_id, email, display_name, first_name

- `get_trial_expired_recipients()` - Returns users eligible for the "trial expired" email:
  - Subscription status is 'canceled' OR trial_ends_at is in the past and status is not 'active'/'trialing'
  - Not in email_unsubscribes table
  - Have NOT already received a 'trial_expired' email
  - Returns: user_id, email, display_name, first_name

2. Security
  - Both functions are SECURITY DEFINER to bypass RLS (called by edge function with service role).
  - Limited to 50 recipients per batch to avoid timeout.
*/

-- Function: get_no_subscription_nudge_recipients
CREATE OR REPLACE FUNCTION public.get_no_subscription_nudge_recipients()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  first_name text
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
    up.first_name
  FROM user_profiles up
  JOIN auth.users au ON au.id = up.user_id
  WHERE
    -- Onboarded at least 1 hour ago
    up.onboarding_completed_at IS NOT NULL
    AND up.onboarding_completed_at <= now() - interval '1 hour'
    -- No active or trialing subscription
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.user_id = up.user_id
        AND s.status IN ('active', 'trialing')
    )
    -- Not unsubscribed from emails
    AND NOT EXISTS (
      SELECT 1 FROM email_unsubscribes eu
      WHERE eu.user_id = up.user_id
    )
    -- Last nudge email was more than 3 days ago or never sent
    AND NOT EXISTS (
      SELECT 1 FROM email_campaign_log ecl
      WHERE ecl.user_id = up.user_id
        AND ecl.campaign_type = 'no_subscription_nudge'
        AND ecl.sent_at > now() - interval '3 days'
    )
  LIMIT 50;
$$;

-- Function: get_trial_expired_recipients
CREATE OR REPLACE FUNCTION public.get_trial_expired_recipients()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  first_name text
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
    up.first_name
  FROM user_profiles up
  JOIN auth.users au ON au.id = up.user_id
  JOIN subscriptions s ON s.user_id = up.user_id
  WHERE
    -- Trial expired: status canceled or trial_ends_at in the past without active status
    (
      s.status = 'canceled'
      OR (s.trial_ends_at IS NOT NULL AND s.trial_ends_at < now() AND s.status NOT IN ('active', 'trialing'))
    )
    -- Not unsubscribed from emails
    AND NOT EXISTS (
      SELECT 1 FROM email_unsubscribes eu
      WHERE eu.user_id = up.user_id
    )
    -- Have NOT already received a trial_expired email
    AND NOT EXISTS (
      SELECT 1 FROM email_campaign_log ecl
      WHERE ecl.user_id = up.user_id
        AND ecl.campaign_type = 'trial_expired'
    )
  LIMIT 50;
$$;
