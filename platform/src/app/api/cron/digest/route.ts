import type { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { WeeklyDigestEmail } from '@/lib/emails/WeeklyDigestEmail'
import { subDays } from 'date-fns'
import React from 'react'

export async function GET(request: NextRequest) {
  // CRON_SECRET verification (per D-17)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createServiceClient()
  const since = subDays(new Date(), 7).toISOString()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Fetch all users (service role bypasses RLS)
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, email, full_name, role, client_id')

  if (!allUsers || allUsers.length === 0) {
    return Response.json({ success: true, sent: 0, reason: 'no users' })
  }

  // Fetch all clients for locale determination
  const { data: allClients } = await supabase
    .from('clients')
    .select('id, name, market')

  const clientMap = new Map((allClients ?? []).map((c: any) => [c.id, c]))

  // Process each user
  const sendPromises = allUsers.map(async (user: any) => {
    // Check digest preference (opt-out model per D-18)
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('digest_enabled')
      .eq('user_id', user.id)
      .maybeSingle()

    if (prefs?.digest_enabled === false) {
      return { user: user.email, status: 'skipped', reason: 'digest_disabled' }
    }

    // Determine locale and fetch tasks
    let tasks: any[] = []
    let locale: 'en' | 'es' = 'en'

    if (user.role === 'client' && user.client_id) {
      // Client user: scoped to their client's tasks (per D-10)
      const client = clientMap.get(user.client_id)
      locale = client?.market === 'LATAM' ? 'es' : 'en'

      const { data } = await supabase
        .from('tasks')
        .select('id, title, status, client_id, updated_at')
        .eq('client_id', user.client_id)
        .gte('updated_at', since)
        .order('updated_at', { ascending: false })

      tasks = data ?? []
    } else {
      // Admin/engineer/seller: cross-client view (per D-10)
      // Sellers receive cross-client digest — they have cross-client access via RLS
      const { data } = await supabase
        .from('tasks')
        .select('id, title, status, client_id, updated_at')
        .gte('updated_at', since)
        .order('updated_at', { ascending: false })

      tasks = data ?? []
    }

    // Skip if zero activity (per D-08)
    if (tasks.length === 0) {
      return { user: user.email, status: 'skipped', reason: 'no_activity' }
    }

    // Build summary
    const taskSummary = {
      new: tasks.filter((t: any) => t.status === 'open').length,
      in_progress: tasks.filter((t: any) => t.status === 'in_progress').length,
      completed: tasks.filter((t: any) => t.status === 'completed').length,
    }

    const recentTasks = tasks.slice(0, 10).map((t: any) => ({
      title: t.title,
      status: t.status,
    }))

    const portalUrl = `${appUrl}/${locale}/portal`

    // Date range for subject/display
    const now = new Date()
    const weekAgo = subDays(now, 7)
    const fmt = (d: Date) =>
      d.toLocaleDateString(locale === 'es' ? 'es-CL' : 'en-US', {
        month: 'short',
        day: 'numeric',
      })
    const dateRange = `${fmt(weekAgo)} - ${fmt(now)}`

    const subject =
      locale === 'es'
        ? `Tu semana en Vantx: ${dateRange}`
        : `Your Vantx week: ${dateRange}`

    await sendEmail({
      to: user.email,
      subject,
      react: React.createElement(WeeklyDigestEmail, {
        locale,
        taskSummary,
        recentTasks,
        totalTasks: tasks.length,
        portalUrl,
        dateRange,
      }),
    })

    return { user: user.email, status: 'sent' }
  })

  // Promise.allSettled — one failure doesn't block others (per D-19)
  const results = await Promise.allSettled(sendPromises)

  const sent = results.filter(
    (r) => r.status === 'fulfilled' && (r as any).value?.status === 'sent'
  ).length
  const skipped = results.filter(
    (r) => r.status === 'fulfilled' && (r as any).value?.status === 'skipped'
  ).length
  const failed = results.filter((r) => r.status === 'rejected').length

  return Response.json({ success: true, sent, skipped, failed })
}
