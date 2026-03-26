import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// ─── Mock setup using vi.hoisted (required for variables referenced in vi.mock factories) ──
const { mockLimit } = vi.hoisted(() => {
  const mockLimit = vi.fn()
  return { mockLimit }
})

// ─── Mock @upstash/redis ─────────────────────────────────────────────────────
vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {
    constructor(_config: any) {}
  },
}))

// ─── Mock @upstash/ratelimit ─────────────────────────────────────────────────
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class MockRatelimit {
    static slidingWindow = vi.fn()
    limit: typeof mockLimit
    constructor(_config: any) {
      this.limit = mockLimit
    }
  },
}))

import { rateLimit, getRateLimitIdentifier, rateLimitResponse, rateLimitHeaders } from '@/lib/rate-limit'
import type { RateLimitResult } from '@/lib/rate-limit'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('https://app.vantx.io/api/test', { headers })
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('rateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns success:true with correct limit and remaining when under limit', async () => {
    const mockReset = Date.now() + 60_000
    mockLimit.mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: mockReset })

    const result = await rateLimit('user:123', { requests: 5, window: '1 m', prefix: 'rl:test' })

    expect(result.success).toBe(true)
    expect(result.limit).toBe(5)
    expect(result.remaining).toBe(4)
    expect(result.reset).toBe(mockReset)
  })

  it('returns success:false with remaining:0 when over limit', async () => {
    const mockReset = Date.now() + 45_000
    mockLimit.mockResolvedValue({ success: false, limit: 5, remaining: 0, reset: mockReset })

    const result = await rateLimit('user:123', { requests: 5, window: '1 m', prefix: 'rl:test' })

    expect(result.success).toBe(false)
    expect(result.limit).toBe(5)
    expect(result.remaining).toBe(0)
    expect(result.reset).toBe(mockReset)
  })

  it('fails open (returns success:true) when Redis throws', async () => {
    mockLimit.mockRejectedValue(new Error('Redis connection refused'))

    const result = await rateLimit('user:123', { requests: 5, window: '1 m', prefix: 'rl:test' })

    expect(result.success).toBe(true)
    expect(result.limit).toBe(5)
    expect(result.remaining).toBe(5)
  })
})

describe('getRateLimitIdentifier', () => {
  it('prefers userId over IP when both are present', () => {
    const req = makeRequest({ 'x-forwarded-for': '1.2.3.4' })
    const result = getRateLimitIdentifier(req, 'user-abc')
    expect(result).toBe('user:user-abc')
  })

  it('falls back to first IP from x-forwarded-for when userId is undefined', () => {
    const req = makeRequest({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' })
    const result = getRateLimitIdentifier(req, undefined)
    expect(result).toBe('ip:1.2.3.4')
  })

  it('returns ip:anonymous when no x-forwarded-for header and no userId', () => {
    const req = makeRequest()
    const result = getRateLimitIdentifier(req, undefined)
    expect(result).toBe('ip:anonymous')
  })
})

describe('rateLimitResponse', () => {
  it('returns 429 response with correct headers and JSON body', async () => {
    const reset = Date.now() + 30_000
    const result: RateLimitResult = { success: false, limit: 5, remaining: 0, reset }

    const response = rateLimitResponse(result)

    expect(response.status).toBe(429)
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')

    const retryAfter = response.headers.get('Retry-After')
    expect(retryAfter).not.toBeNull()
    const retryAfterNum = parseInt(retryAfter!, 10)
    expect(retryAfterNum).toBeGreaterThan(0)
    expect(Number.isInteger(retryAfterNum)).toBe(true)

    const body = await response.json()
    expect(body.error).toBe('Rate limit exceeded')
    expect(typeof body.retryAfter).toBe('number')
    expect(body.retryAfter).toBeGreaterThan(0)
  })
})

describe('rateLimitHeaders', () => {
  it('returns object with X-RateLimit-Limit and X-RateLimit-Remaining as string values', () => {
    const result: RateLimitResult = { success: true, limit: 20, remaining: 17, reset: Date.now() + 60_000 }

    const headers = rateLimitHeaders(result)

    expect(headers['X-RateLimit-Limit']).toBe('20')
    expect(headers['X-RateLimit-Remaining']).toBe('17')
    expect(typeof headers['X-RateLimit-Limit']).toBe('string')
    expect(typeof headers['X-RateLimit-Remaining']).toBe('string')
  })
})
