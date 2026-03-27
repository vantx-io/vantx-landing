import { createServiceClient } from './supabase/server'

export type AuditAction =
  | 'user.invite'
  | 'user.role_change'
  | 'user.deactivate'
  | 'user.reactivate'

export interface AuditEventParams {
  actor_id: string
  action: AuditAction
  target_id: string | null
  metadata?: Record<string, unknown>
  ip_address?: string
}

export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const supabase = createServiceClient()
    await (supabase as any).from('audit_logs').insert({
      actor_id: params.actor_id,
      action: params.action,
      target_id: params.target_id ?? null,
      metadata: params.metadata ?? null,
      ip_address: params.ip_address ?? null,
    })
  } catch {
    // Fail silently — audit logging must never block admin actions
    if (process.env.NODE_ENV === 'development') {
      console.error('[audit] logAuditEvent failed silently', params)
    }
  }
}
