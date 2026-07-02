/*
  # Add admin read-all policies

  Adds SELECT policies on every table so that authenticated users with
  is_admin = true in user_profiles can read all rows.  This lets the
  admin panel use the anon/session client instead of the service-role key.

  New policies (SELECT only, no mutations):
    - All tables in the public schema that the admin panel queries
*/

-- Helper: reusable is_admin check
-- (inline in each policy so no function dependency)

-- user_profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- broker_accounts
CREATE POLICY "Admins can view all broker accounts"
  ON broker_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- mt_servers
CREATE POLICY "Admins can view all mt servers"
  ON mt_servers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- telegram_sessions
CREATE POLICY "Admins can view all telegram sessions"
  ON telegram_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- telegram_channels
CREATE POLICY "Admins can view all telegram channels"
  ON telegram_channels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- telegram_auth_pending
CREATE POLICY "Admins can view all telegram auth pending"
  ON telegram_auth_pending FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- channel_signal_profiles
CREATE POLICY "Admins can view all channel signal profiles"
  ON channel_signal_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- signals
CREATE POLICY "Admins can view all signals"
  ON signals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- trades
CREATE POLICY "Admins can view all trades"
  ON trades FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- signal_broker_dispatch_claims
CREATE POLICY "Admins can view all dispatch claims"
  ON signal_broker_dispatch_claims FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- backtest_runs
CREATE POLICY "Admins can view all backtest runs"
  ON backtest_runs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- backtest_trades
CREATE POLICY "Admins can view all backtest trades"
  ON backtest_trades FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- backtest_equity_points
CREATE POLICY "Admins can view all backtest equity points"
  ON backtest_equity_points FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- backtest_run_channels
CREATE POLICY "Admins can view all backtest run channels"
  ON backtest_run_channels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- channel_trading_presets
CREATE POLICY "Admins can view all trading presets"
  ON channel_trading_presets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );

-- stripe_events
CREATE POLICY "Admins can view all stripe events"
  ON stripe_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() AND up.is_admin = true
    )
  );
