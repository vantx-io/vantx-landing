import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { notifyTaskEvent } from '@/lib/notifications'

export async function POST(req: Request) {
  const body = await req.json()

  // Validate required fields
  if (!body.client_id || !body.title || !body.priority || !body.type) {
    return NextResponse.json(
      { error: 'Missing required fields: client_id, title, priority, type' },
      { status: 400 },
    )
  }

  const supabase = createServiceClient()

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      client_id: body.client_id,
      title: body.title,
      description: body.description || null,
      priority: body.priority,
      type: body.type,
      status: 'open',
      created_by: body.created_by || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fire-and-forget notification (per D-01, D-02, D-03)
  notifyTaskEvent(task.id, 'task_created', supabase, body.created_by).catch(
    (err) => console.error('[notify] task_created error:', err),
  )

  return NextResponse.json({ task }, { status: 201 })
}
