/*
# Fix campaign email cron job — correct URL and use vault for auth

1. Changes
  - Unschedule the broken `send-campaign-emails-hourly` cron job (pointed to wrong function URL and used null app.settings).
  - Re-create as `send-subscription-campaigns-hourly` with:
    - Correct URL: `/functions/v1/send-subscription-campaigns`
    - Auth: reads service_role_key from `vault.decrypted_secrets`
    - Schedule: every hour at minute 15

2. Why this was broken
  - The old cron called `/functions/v1/send-campaign-emails` but no such function exists (correct name: `send-subscription-campaigns`).
  - The old cron read from `current_setting('app.settings.service_role_key', true)` which returned NULL (never configured), causing the guard clause to skip every invocation.
  - Result: 0 automated emails ever sent (all 40 logged emails were admin_manual triggers).

3. Important Notes
  - The vault already contains a `service_role_key` secret.
  - Timeout set to 55s for batch email processing.
  - Idempotent: uses IF EXISTS on unschedule pattern.
*/

-- Unschedule the broken cron job (safe if it doesn't exist)
SELECT cron.unschedule('send-campaign-emails-hourly');

-- Create the fixed cron job
SELECT cron.schedule(
  'send-subscription-campaigns-hourly',
  '15 * * * *',
  $$
  DO $body$
  DECLARE
    v_url text := 'https://sxkpcovbyaficvtkpsdo.supabase.co';
    v_key text;
  BEGIN
    SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;

    IF v_key IS NULL THEN
      RAISE NOTICE 'Skipping send-subscription-campaigns: service_role_key not found in vault';
      RETURN;
    END IF;

    PERFORM net.http_post(
      url := v_url || '/functions/v1/send-subscription-campaigns',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_key
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 55000
    );
  END
  $body$;
  $$
);
