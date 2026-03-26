import { Html, Head, Body, Preview, Section, Text, Button, Hr } from '@react-email/components'
import React from 'react'

interface WeeklyDigestEmailProps {
  locale: 'en' | 'es'
  taskSummary: { new: number; in_progress: number; completed: number }
  recentTasks: Array<{ title: string; status: string }>
  totalTasks: number
  portalUrl: string
  dateRange: string
}

export function WeeklyDigestEmail({
  locale,
  taskSummary,
  recentTasks,
  totalTasks,
  portalUrl,
  dateRange,
}: WeeklyDigestEmailProps) {
  const isEs = locale === 'es'

  const copy = isEs
    ? {
        preview: 'Actividad de tareas de la semana pasada',
        heading: 'Tu semana de un vistazo',
        subheading: 'Actividad reciente de tareas',
        statusNew: 'Nuevas',
        statusInProgress: 'En progreso',
        statusCompleted: 'Completadas',
        cta: 'Ir al portal',
        truncation: (n: number) => `y ${n} m\u00e1s`,
      }
    : {
        preview: 'Task activity from the past week',
        heading: 'Your week at a glance',
        subheading: 'Recent task activity',
        statusNew: 'New',
        statusInProgress: 'In Progress',
        statusCompleted: 'Completed',
        cta: 'Go to portal',
        truncation: (n: number) => `and ${n} more`,
      }

  const truncated = totalTasks > recentTasks.length

  return (
    <Html>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={{ fontFamily: 'sans-serif', background: '#f9f9f9' }}>
        <Section
          style={{
            maxWidth: 560,
            margin: '0 auto',
            background: '#fff',
            padding: '32px',
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111' }}>
            {copy.heading}
          </Text>
          <Text style={{ fontSize: 16, color: '#333' }}>
            {dateRange}
          </Text>

          {/* Status counts */}
          <Section style={{ margin: '16px 0' }}>
            <Text style={{ fontSize: 14, color: '#444' }}>
              {copy.statusNew}: {taskSummary.new} | {copy.statusInProgress}: {taskSummary.in_progress} | {copy.statusCompleted}: {taskSummary.completed}
            </Text>
          </Section>

          {/* Task list */}
          {recentTasks.length > 0 && (
            <>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>
                {copy.subheading}
              </Text>
              {recentTasks.map((task, i) => (
                <Text key={i} style={{ fontSize: 13, color: '#444', margin: '4px 0' }}>
                  {task.title} — {task.status}
                </Text>
              ))}
              {truncated && (
                <Text style={{ fontSize: 13, color: '#888', fontStyle: 'italic' }}>
                  {copy.truncation(totalTasks - recentTasks.length)}
                </Text>
              )}
            </>
          )}

          <Button
            href={portalUrl}
            style={{
              background: '#2563EB',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 6,
              textDecoration: 'none',
              display: 'inline-block',
              marginTop: 16,
            }}
          >
            {copy.cta}
          </Button>
          <Hr />
          <Text style={{ fontSize: 12, color: '#888' }}>
            Vantx . vantx.io . hello@vantx.io
          </Text>
        </Section>
      </Body>
    </Html>
  )
}
