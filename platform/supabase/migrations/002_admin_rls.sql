-- 002_admin_rls.sql
-- Add seller role to existing admin policies and create admin bypass for remaining tables.

-- Fix existing policies: add seller role
DROP POLICY "Admins see all clients" ON clients;
CREATE POLICY "Admin roles see all clients" ON clients FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer', 'seller'));

DROP POLICY "Admins see all tasks" ON tasks;
CREATE POLICY "Admin roles see all tasks" ON tasks FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer', 'seller'));

-- Add admin bypass for subscriptions
CREATE POLICY "Admin roles see all subscriptions" ON subscriptions FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer', 'seller'));

-- Add admin bypass for payments
CREATE POLICY "Admin roles see all payments" ON payments FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer', 'seller'));

-- Add admin bypass for test_results
CREATE POLICY "Admin roles see all test results" ON test_results FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer', 'seller'));

-- Add admin bypass for monthly_metrics
CREATE POLICY "Admin roles see all monthly metrics" ON monthly_metrics FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer', 'seller'));

-- Add admin bypass for weekly_metrics
CREATE POLICY "Admin roles see all weekly metrics" ON weekly_metrics FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer', 'seller'));

-- Add admin bypass for reports
CREATE POLICY "Admin roles see all reports" ON reports FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer', 'seller'));
