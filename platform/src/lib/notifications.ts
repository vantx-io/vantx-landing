import type { NotificationType } from '@/lib/types'

// Use loose type to avoid SDK version mismatch between @supabase/ssr and @supabase/supabase-js
type SupabaseAdmin = { from: (table: string) => any }

export async function createNotification(
  supabase: SupabaseAdmin,
  params: {
    userId: string
    type: NotificationType
    title: string
    body: string
    actionLink?: string
  },
): Promise<void> {
  await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    action_link: params.actionLink ?? null,
  })
}
