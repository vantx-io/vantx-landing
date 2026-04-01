-- ═══════════════════════════════════════════════════════
-- VANTIX CONSULTING — MIGRATION 002
-- Notifications table with RLS policies and indexes
-- ═══════════════════════════════════════════════════════

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payment_success', 'payment_failed', 'task_updated', 'task_created')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  action_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins see all notifications" ON notifications FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'engineer'));

CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
