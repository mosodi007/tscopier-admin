/*
  # Fix admin RLS policies - use security definer function

  ## Problem
  All admin SELECT policies used a subquery against user_profiles to check is_admin.
  But user_profiles itself has RLS enabled, so the subquery was also filtered by RLS,
  creating a circular dependency. The is_admin check always returned 0 rows, so no
  admin policy ever passed and all queries returned empty.

  ## Fix
  1. Create a SECURITY DEFINER function `is_admin()` that bypasses RLS to check the
     is_admin flag for the current user. This runs with elevated privileges so it can
     always read user_profiles regardless of RLS.
  2. Drop and recreate all admin SELECT policies to use `is_admin()` instead of the
     recursive subquery.
*/

-- Create a security definer helper that bypasses RLS for the is_admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND is_admin = true
  );
$$;

-- Drop and recreate all admin policies using the new function

-- user_profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- subscriptions
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- broker_accounts
DROP POLICY IF EXISTS "Admins can view all broker accounts" ON broker_accounts;
CREATE POLICY "Admins can view all broker accounts"
  ON broker_accounts FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- mt_servers
DROP POLICY IF EXISTS "Admins can view all mt servers" ON mt_servers;
CREATE POLICY "Admins can view all mt servers"
  ON mt_servers FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- telegram_sessions
DROP POLICY IF EXISTS "Admins can view all telegram sessions" ON telegram_sessions;
CREATE POLICY "Admins can view all telegram sessions"
  ON telegram_sessions FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- telegram_channels
DROP POLICY IF EXISTS "Admins can view all telegram channels" ON telegram_channels;
CREATE POLICY "Admins can view all telegram channels"
  ON telegram_channels FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- telegram_auth_pending
DROP POLICY IF EXISTS "Admins can view all telegram auth pending" ON telegram_auth_pending;
CREATE POLICY "Admins can view all telegram auth pending"
  ON telegram_auth_pending FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- channel_signal_profiles
DROP POLICY IF EXISTS "Admins can view all channel signal profiles" ON channel_signal_profiles;
CREATE POLICY "Admins can view all channel signal profiles"
  ON channel_signal_profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- signals
DROP POLICY IF EXISTS "Admins can view all signals" ON signals;
CREATE POLICY "Admins can view all signals"
  ON signals FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- trades
DROP POLICY IF EXISTS "Admins can view all trades" ON trades;
CREATE POLICY "Admins can view all trades"
  ON trades FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- signal_broker_dispatch_claims
DROP POLICY IF EXISTS "Admins can view all dispatch claims" ON signal_broker_dispatch_claims;
CREATE POLICY "Admins can view all dispatch claims"
  ON signal_broker_dispatch_claims FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- backtest_runs
DROP POLICY IF EXISTS "Admins can view all backtest runs" ON backtest_runs;
CREATE POLICY "Admins can view all backtest runs"
  ON backtest_runs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- backtest_trades
DROP POLICY IF EXISTS "Admins can view all backtest trades" ON backtest_trades;
CREATE POLICY "Admins can view all backtest trades"
  ON backtest_trades FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- backtest_equity_points
DROP POLICY IF EXISTS "Admins can view all backtest equity points" ON backtest_equity_points;
CREATE POLICY "Admins can view all backtest equity points"
  ON backtest_equity_points FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- backtest_run_channels
DROP POLICY IF EXISTS "Admins can view all backtest run channels" ON backtest_run_channels;
CREATE POLICY "Admins can view all backtest run channels"
  ON backtest_run_channels FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- channel_trading_presets
DROP POLICY IF EXISTS "Admins can view all trading presets" ON channel_trading_presets;
CREATE POLICY "Admins can view all trading presets"
  ON channel_trading_presets FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- stripe_events
DROP POLICY IF EXISTS "Admins can view all stripe events" ON stripe_events;
CREATE POLICY "Admins can view all stripe events"
  ON stripe_events FOR SELECT
  TO authenticated
  USING (public.is_admin());
