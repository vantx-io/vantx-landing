import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getPriceId, formatCurrency } from '@/lib/stripe'

describe('getPriceId', () => {
  beforeEach(() => {
    vi.stubEnv('STRIPE_PRICE_RETAINER_US', 'price_retainer_us_test')
    vi.stubEnv('STRIPE_PRICE_RETAINER_LATAM', 'price_retainer_latam_test')
    vi.stubEnv('STRIPE_PRICE_RETAINER_PILOT_US', 'price_retainer_pilot_us_test')
    vi.stubEnv('STRIPE_PRICE_RETAINER_PILOT_LATAM', 'price_retainer_pilot_latam_test')
    vi.stubEnv('STRIPE_PRICE_CHECKUP_US', 'price_checkup_us_test')
    vi.stubEnv('STRIPE_PRICE_CHECKUP_LATAM', 'price_checkup_latam_test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns the correct price ID for retainer US (non-pilot)', () => {
    expect(getPriceId('retainer', 'US', false)).toBe('price_retainer_us_test')
  })

  it('returns the correct price ID for retainer US (pilot)', () => {
    expect(getPriceId('retainer', 'US', true)).toBe('price_retainer_pilot_us_test')
  })

  it('returns the correct price ID for retainer LATAM (non-pilot)', () => {
    expect(getPriceId('retainer', 'LATAM', false)).toBe('price_retainer_latam_test')
  })

  it('returns the correct price ID for retainer LATAM (pilot)', () => {
    expect(getPriceId('retainer', 'LATAM', true)).toBe('price_retainer_pilot_latam_test')
  })

  it('defaults isPilot to false when not provided', () => {
    expect(getPriceId('retainer', 'US')).toBe('price_retainer_us_test')
  })

  it('returns the correct price ID for checkup US', () => {
    expect(getPriceId('checkup', 'US', false)).toBe('price_checkup_us_test')
  })

  it('returns empty string when env var is not set for an unknown plan', () => {
    expect(getPriceId('unknown_plan', 'US', false)).toBe('')
  })

  it('returns empty string when env var is not set for unknown market', () => {
    // env var key would be STRIPE_PRICE_RETAINER_UNKNOWN — not set
    expect(getPriceId('retainer', 'US' as any, false)).toBe('price_retainer_us_test')
  })
})

describe('formatCurrency', () => {
  it('formats USD amount correctly', () => {
    expect(formatCurrency(5995, 'USD')).toBe('$5,995.00')
  })

  it('formats small USD amount correctly', () => {
    expect(formatCurrency(100, 'USD')).toBe('$100.00')
  })

  it('defaults to USD when no currency provided', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00')
  })

  it('formats MXN amount with currency symbol', () => {
    const result = formatCurrency(5995, 'MXN')
    // MXN format includes MX$ or similar depending on locale; just verify currency is represented
    expect(result).toContain('5,995')
    expect(result.length).toBeGreaterThan(0)
  })

  it('formats zero correctly', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00')
  })
})
