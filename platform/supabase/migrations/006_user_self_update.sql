-- 006_user_self_update.sql
-- Allow authenticated users to update their own profile (full_name).
-- Field restriction (full_name only) enforced in the API layer.
-- The existing "Admin roles manage all users" FOR ALL policy already covers admin/engineer/seller.

CREATE POLICY "Users can update own profile" ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
