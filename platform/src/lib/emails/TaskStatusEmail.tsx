import { Html, Head, Body, Preview, Section, Text, Button, Hr } from '@react-email/components'
import React from 'react'

interface TaskStatusEmailProps {
  locale: 'en' | 'es'
  taskTitle: string
  newStatus: string
  changedByName: string
  taskUrl: string
}

export function TaskStatusEmail({
  locale,
  taskTitle,
  newStatus,
  changedByName,
  taskUrl,
}: TaskStatusEmailProps) {
  const isEs = locale === 'es'

  const copy = isEs
    ? {
        preview: `Actualizacion de tarea: ${taskTitle}`,
        heading: 'Estado de tarea actualizado',
        body: `"${taskTitle}" fue cambiado a ${newStatus} por ${changedByName}.`,
        cta: 'Ver tarea',
      }
    : {
        preview: `Task update: ${taskTitle}`,
        heading: 'Task status updated',
        body: `"${taskTitle}" was changed to ${newStatus} by ${changedByName}.`,
        cta: 'View task',
      }

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
          <Text style={{ fontSize: 15, color: '#444', lineHeight: '1.6' }}>
            {copy.body}
          </Text>
          <Button
            href={taskUrl}
            style={{
              background: '#2563EB',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 6,
              textDecoration: 'none',
              display: 'inline-block',
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
