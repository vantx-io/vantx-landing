import { Resend } from 'resend'
import React from 'react'

// Lazy singleton — re-created when API key is set
// Note: Not cached as a permanent singleton so tests can reset via vi.stubEnv
export async function sendEmail(params: {
  to: string
  subject: string
  react: React.ReactElement
}): Promise<{ id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { error: 'RESEND_API_KEY not configured' }
  }

  const resend = new Resend(apiKey)

  try {
    const { data, error } = await resend.emails.send({
      from: 'Vantx <hello@vantx.io>',
      to: params.to,
      subject: params.subject,
      react: params.react,
    })

    if (error) {
      return { error: (error as { message: string }).message }
    }

    return { id: data?.id }
  } catch (err: any) {
    return { error: err.message ?? 'Unknown error sending email' }
  }
}
