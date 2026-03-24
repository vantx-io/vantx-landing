-- ═══════════════════════════════════════════════════════
-- VANTIX CONSULTING — MIGRATION 003
-- task-attachments storage bucket with private access
-- and RLS policies scoped to client_id path segment
-- ═══════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments',
  'task-attachments',
  false,
  52428800,
  NULL
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Clients can upload own attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = (
      SELECT client_id::text FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Clients can read own attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND (storage.foldername(name))[1] = (
      SELECT client_id::text FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all attachments" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer')
  );
