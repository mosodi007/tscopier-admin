/*
  # Add missing foreign keys for PostgREST joins

  Adds FK constraints so PostgREST can resolve nested selects used by the admin panel.

  - subscriptions.user_id → user_profiles.user_id
  - broker_accounts.user_id → user_profiles.user_id
  - trades.user_id → user_profiles.user_id
  - signals.user_id → user_profiles.user_id
  - telegram_channels.user_id → user_profiles.user_id
  - telegram_sessions.user_id → user_profiles.user_id
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_user_id_fkey' AND table_name = 'subscriptions'
  ) THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES user_profiles(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'broker_accounts_user_id_fkey' AND table_name = 'broker_accounts'
  ) THEN
    ALTER TABLE broker_accounts
      ADD CONSTRAINT broker_accounts_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES user_profiles(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'trades_user_id_fkey' AND table_name = 'trades'
  ) THEN
    ALTER TABLE trades
      ADD CONSTRAINT trades_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES user_profiles(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'signals_user_id_fkey' AND table_name = 'signals'
  ) THEN
    ALTER TABLE signals
      ADD CONSTRAINT signals_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES user_profiles(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'telegram_channels_user_id_fkey' AND table_name = 'telegram_channels'
  ) THEN
    ALTER TABLE telegram_channels
      ADD CONSTRAINT telegram_channels_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES user_profiles(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'telegram_sessions_user_id_fkey' AND table_name = 'telegram_sessions'
  ) THEN
    ALTER TABLE telegram_sessions
      ADD CONSTRAINT telegram_sessions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES user_profiles(user_id);
  END IF;
END $$;
