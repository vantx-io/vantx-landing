import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  const body = await req.json()
  const { taskId } = params

  const supabase = createServiceClient()

  // Only allow updating title and status
  const updates: Record<string, string> = {}
  if (body.title !== undefined) updates.title = body.title
  if (body.status !== undefined) updates.status = body.status

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ task })
}
