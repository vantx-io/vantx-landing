import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";

// ─── Mock resend before importing email module ───────────────────────────────
const mockSend = vi.fn();
vi.mock("resend", () => {
  return {
    Resend: class MockResend {
      emails = { send: mockSend };
      constructor(_apiKey: string) {}
    },
  };
});

import { sendEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { PaymentSuccessEmail } from "@/lib/emails/PaymentSuccessEmail";
import { PaymentFailedEmail } from "@/lib/emails/PaymentFailedEmail";
import { render } from "@react-email/render";

// ─── sendEmail ────────────────────────────────────────────────────────────────

describe("sendEmail", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "test-api-key-123");
    mockSend.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("calls resend.emails.send with from: Vantx <hello@vantx.io> and returns { id }", async () => {
    mockSend.mockResolvedValueOnce({
      data: { id: "email-id-abc" },
      error: null,
    });

    const result = await sendEmail({
      to: "client@test.com",
      subject: "Test",
      react: React.createElement("div", null, "hello"),
    });

    expect(mockSend).toHaveBeenCalledOnce();
    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.from).toBe("Vantx <hello@vantx.io>");
    expect(callArg.to).toBe("client@test.com");
    expect(result).toEqual({ id: "email-id-abc" });
  });

  it("returns { error } when Resend returns an error object", async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid API key" },
    });

    const result = await sendEmail({
      to: "client@test.com",
      subject: "Test",
      react: React.createElement("div", null, "hello"),
    });

    expect(result).toHaveProperty("error");
    expect((result as { error: string }).error).toBe("Invalid API key");
  });

  it("returns { error: RESEND_API_KEY not configured } when env var missing", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("RESEND_API_KEY", "");

    const result = await sendEmail({
      to: "client@test.com",
      subject: "Test",
      react: React.createElement("div", null, "hello"),
    });

    expect(result).toEqual({ error: "RESEND_API_KEY not configured" });
    expect(mockSend).not.toHaveBeenCalled();
  });
});

// ─── createNotification ───────────────────────────────────────────────────────

describe("createNotification", () => {
  it("calls supabase.from(notifications).insert with correct shape", async () => {
    const mockInsert = vi.fn().mockResolvedValueOnce({ error: null });
    const mockSupabase = {
      from: vi.fn().mockReturnValue({ insert: mockInsert }),
    };

    await createNotification(mockSupabase, {
      userId: "user-123",
      type: "payment_success",
      title: "Payment received",
      body: "We received your $500 payment",
      actionLink: "https://billing.stripe.com/test",
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("notifications");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-123",
      type: "payment_success",
      title: "Payment received",
      body: "We received your $500 payment",
      action_link: "https://billing.stripe.com/test",
    });
  });

  it("uses null for action_link when actionLink is not provided", async () => {
    const mockInsert = vi.fn().mockResolvedValueOnce({ error: null });
    const mockSupabase = {
      from: vi.fn().mockReturnValue({ insert: mockInsert }),
    };

    await createNotification(mockSupabase, {
      userId: "user-456",
      type: "payment_failed",
      title: "Payment issue",
      body: "We could not process your payment",
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ action_link: null }),
    );
  });
});

// ─── PaymentSuccessEmail ──────────────────────────────────────────────────────

describe("PaymentSuccessEmail", () => {
  const baseProps = {
    clientName: "Acme Corp",
    amount: "$5,995.00",
    currency: "USD",
    period: "March 2026",
    billingPortalUrl: "https://billing.stripe.com/test",
  };

  it("locale=en renders HTML containing Payment received", async () => {
    const html = await render(
      React.createElement(PaymentSuccessEmail, { ...baseProps, locale: "en" }),
    );
    expect(html).toContain("Payment received");
  });

  it("locale=es renders HTML containing Pago recibido", async () => {
    const html = await render(
      React.createElement(PaymentSuccessEmail, { ...baseProps, locale: "es" }),
    );
    expect(html).toContain("Pago recibido");
  });
});

// ─── PaymentFailedEmail ───────────────────────────────────────────────────────

describe("PaymentFailedEmail", () => {
  const baseProps = {
    clientName: "Acme Corp",
    amount: "$5,995.00",
    currency: "USD",
    billingPortalUrl: "https://billing.stripe.com/test",
  };

  it("locale=en renders HTML containing couldn't process your payment", async () => {
    const html = await render(
      React.createElement(PaymentFailedEmail, { ...baseProps, locale: "en" }),
    );
    // @react-email/render encodes apostrophes as &#x27; — also body includes amount between "process your" and "payment"
    // Check for the key phrase parts that are present in the rendered HTML
    const hasCantProcess =
      html.includes("couldn\u2019t process") ||
      html.includes("couldn&#x27;t process") ||
      html.includes("couldn&#39;t process") ||
      html.includes("couldn't process") ||
      html.includes("could not process");
    expect(hasCantProcess).toBe(true);
  });

  it("locale=es renders HTML containing No pudimos procesar tu pago", async () => {
    const html = await render(
      React.createElement(PaymentFailedEmail, { ...baseProps, locale: "es" }),
    );
    expect(html).toContain("No pudimos procesar tu pago");
  });
});
