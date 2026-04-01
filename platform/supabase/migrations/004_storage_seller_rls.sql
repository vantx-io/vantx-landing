-- ═══════════════════════════════════════════════════════
-- VANTIX CONSULTING — MIGRATION 004
-- Add seller role to storage admin policy
-- (consistent with 002_admin_rls.sql pattern)
-- ═══════════════════════════════════════════════════════

-- Drop and recreate the admin storage policy to include seller
DROP POLICY IF EXISTS "Admins can read all attachments" ON storage.objects;

CREATE POLICY "Admins can read all attachments" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer', 'seller')
  );
