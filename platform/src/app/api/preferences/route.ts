import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('notification_preferences')
    .select('email_enabled, in_app_enabled, digest_enabled')
    .eq('user_id', user.id)
    .maybeSingle()

  // null = no row = all enabled (opt-out model per D-03)
  return NextResponse.json({
    email_enabled: data?.email_enabled !== false,
    in_app_enabled: data?.in_app_enabled !== false,
    digest_enabled: data?.digest_enabled !== false,
  })
}

export async function PATCH(req: Request) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowed = ['email_enabled', 'in_app_enabled', 'digest_enabled'] as const
  const patch: Record<string, boolean> = {}
  for (const key of allowed) {
    if (key in body && typeof body[key] === 'boolean') patch[key] = body[key]
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  }

  const { error } = await supabase
    .from('notification_preferences')
    .upsert({ user_id: user.id, ...patch, updated_at: new Date().toISOString() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
