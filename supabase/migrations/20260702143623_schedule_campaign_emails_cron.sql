/*
# Schedule hourly email campaign cron job

1. New cron job
  - Name: 'send-campaign-emails-hourly'
  - Schedule: every hour at minute 15 ('15 * * * *')
  - Action: calls the send-campaign-emails edge function via pg_net HTTP POST
  - Uses app.settings for supabase_url and service_role_key (same pattern as existing cron jobs)

2. Important Notes
  - The edge function itself handles all interval logic (1-hour initial delay, 3-day repeat gap)
  - Running hourly ensures timely delivery without over-sending
  - Batched to 50 recipients per campaign type per run to avoid timeouts
*/

SELECT cron.schedule(
  'send-campaign-emails-hourly',
  '15 * * * *',
  $$
  DO $body$
  DECLARE
    v_url text := current_setting('app.settings.supabase_url', true);
    v_key text := current_setting('app.settings.service_role_key', true);
  BEGIN
    IF v_url IS NULL OR v_key IS NULL THEN
      RAISE NOTICE 'Skipping send-campaign-emails: missing app.settings.supabase_url or app.settings.service_role_key';
      RETURN;
    END IF;

    PERFORM net.http_post(
      url := v_url || '/functions/v1/send-campaign-emails',
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
