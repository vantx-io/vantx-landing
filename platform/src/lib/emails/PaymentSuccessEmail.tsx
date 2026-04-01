import { Html, Head, Body, Preview, Section, Text, Button, Hr } from '@react-email/components'
import React from 'react'

interface PaymentSuccessEmailProps {
  locale: 'en' | 'es'
  clientName: string
  amount: string
  currency: string
  period: string
  billingPortalUrl: string
}

export function PaymentSuccessEmail({
  locale,
  clientName,
  amount,
  currency,
  period,
  billingPortalUrl,
}: PaymentSuccessEmailProps) {
  const isEs = locale === 'es'

  const copy = isEs
    ? {
        preview: 'Pago recibido — gracias!',
        heading: 'Pago recibido',
        body: `Hola ${clientName}, recibimos tu pago de ${currency} ${amount} por ${period}.`,
        cta: 'Ver portal de facturacion',
      }
    : {
        preview: 'Payment received — thank you!',
        heading: 'Payment received',
        body: `Hi ${clientName}, we received your ${currency} ${amount} payment for ${period}.`,
        cta: 'View billing portal',
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
            href={billingPortalUrl}
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
