-- 008_audit_logs.sql — Audit log for admin actions

CREATE TABLE public.audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   UUID NOT NULL REFERENCES public.users(id),
  action     TEXT NOT NULL,
  target_id  UUID,
  metadata   JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for dashboard query: most recent entries first
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT policy (uses role from public.users)
CREATE POLICY "Admins can read audit logs" ON public.audit_logs
  FOR SELECT
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- No INSERT policy — service role client bypasses RLS
