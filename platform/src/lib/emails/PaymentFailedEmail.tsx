import {
  Html,
  Head,
  Body,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";
import React from "react";

interface PaymentFailedEmailProps {
  locale: "en" | "es";
  clientName: string;
  amount: string;
  currency: string;
  billingPortalUrl: string;
}

export function PaymentFailedEmail({
  locale,
  clientName,
  amount,
  currency,
  billingPortalUrl,
}: PaymentFailedEmailProps) {
  const isEs = locale === "es";

  const copy = isEs
    ? {
        preview: "Accion necesaria: problema con el pago",
        heading: "Problema con el pago",
        body: `Hola ${clientName}, No pudimos procesar tu pago de ${currency} ${amount}. Por favor actualiza tu metodo de pago para mantener tu servicio activo.`,
        cta: "Actualizar metodo de pago",
      }
    : {
        preview: "Action needed: payment issue",
        heading: "Payment issue",
        body: `Hi ${clientName}, we couldn't process your ${currency} ${amount} payment. Please update your payment method to keep your service active.`,
        cta: "Update payment method",
      };

  return (
    <Html>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={{ fontFamily: "sans-serif", background: "#f9f9f9" }}>
        <Section
          style={{
            maxWidth: 560,
            margin: "0 auto",
            background: "#fff",
            padding: "32px",
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "bold", color: "#111" }}>
            {copy.heading}
          </Text>
          <Text style={{ fontSize: 15, color: "#444", lineHeight: "1.6" }}>
            {copy.body}
          </Text>
          <Button
            href={billingPortalUrl}
            style={{
              background: "#2563EB",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 6,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            {copy.cta}
          </Button>
          <Hr />
          <Text style={{ fontSize: 12, color: "#888" }}>
            Vantx . vantx.io . hello@vantx.io
          </Text>
        </Section>
      </Body>
    </Html>
  );
}
