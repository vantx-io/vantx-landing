-- 005_user_management.sql
-- User management: is_active column, auth trigger for auto-creating profiles,
-- and RLS policies for self-select and admin management.

-- ═══ Add is_active column ═══
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ═══ Trigger function: auto-create public.users on auth.users INSERT ═══
-- SECURITY DEFINER: trigger runs as table owner (postgres), bypasses RLS INSERT check.
-- NULLIF: safely converts empty string client_id from invite metadata to NULL.
-- ON CONFLICT DO NOTHING: idempotent — safe if row already exists.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, client_id, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NULLIF(NEW.raw_user_meta_data->>'client_id', '')::UUID,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══ Trigger: fire after auth.users INSERT (invite acceptance) ═══
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══ RLS policies ═══

-- Users can read their own profile (needed for middleware is_active check)
CREATE POLICY "Users can read own profile" ON users FOR SELECT
  USING (id = auth.uid());

-- Admin roles (admin/engineer/seller) can manage all users
CREATE POLICY "Admin roles manage all users" ON users FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer', 'seller'));
