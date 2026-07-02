/*
# Create Email Campaign Tables

1. New Tables

- `email_campaign_log`
  - `id` (uuid, primary key) - unique identifier for each sent email
  - `user_id` (uuid, not null) - references auth.users
  - `campaign_type` (text, not null) - e.g. 'no_subscription_nudge', 'trial_expired'
  - `sent_at` (timestamptz, not null) - when the email was sent
  - `email_address` (text, not null) - the recipient email address
  - `metadata` (jsonb) - optional extra data (template version, etc.)

- `email_unsubscribes`
  - `id` (uuid, primary key) - unique identifier
  - `user_id` (uuid, not null, unique) - references auth.users, one row per user
  - `unsubscribed_at` (timestamptz, not null) - when the user unsubscribed
  - `reason` (text) - optional reason

2. Security
  - RLS enabled on both tables.
  - Service-role (edge functions) performs all writes; no end-user policies needed.
  - Admin read policies using public.is_admin() for the admin panel.

3. Indexes
  - Composite index on (user_id, campaign_type, sent_at DESC) for efficient "last email sent" lookups.
  - Unique index on email_unsubscribes(user_id) to prevent duplicate opt-outs.
*/

-- email_campaign_log
CREATE TABLE IF NOT EXISTS email_campaign_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_type text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  email_address text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE email_campaign_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_email_campaign_log_user_type_sent
  ON email_campaign_log (user_id, campaign_type, sent_at DESC);

-- Admin read policy
DROP POLICY IF EXISTS "Admins can view all email campaign logs" ON email_campaign_log;
CREATE POLICY "Admins can view all email campaign logs"
  ON email_campaign_log FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- email_unsubscribes
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  unsubscribed_at timestamptz NOT NULL DEFAULT now(),
  reason text
);

ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Admin read policy
DROP POLICY IF EXISTS "Admins can view all email unsubscribes" ON email_unsubscribes;
CREATE POLICY "Admins can view all email unsubscribes"
  ON email_unsubscribes FOR SELECT
  TO authenticated
  USING (public.is_admin());
