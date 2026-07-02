-- Add admin read policy for trade_execution_logs so the admin panel can see all records
CREATE POLICY "Admins can view all trade execution logs"
  ON trade_execution_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());
