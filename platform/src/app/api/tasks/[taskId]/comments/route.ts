import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  const body = await req.json()
  const { taskId } = params

  if (!body.content?.trim() && (!body.attachments || body.attachments.length === 0)) {
    return NextResponse.json(
      { error: 'Comment must have content or attachments' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  // Verify task exists
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .single()

  if (taskError || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const { data: comment, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: body.user_id,
      content: body.content || '',
      attachments: body.attachments?.length > 0 ? body.attachments : null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comment }, { status: 201 })
}
