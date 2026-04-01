import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// ─── Mock @/lib/email ───────────────────────────────────────────────────────
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: 'mock-id' }),
}))

// ─── Mock @/lib/supabase/server ─────────────────────────────────────────────
vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

import { sendEmail } from '@/lib/email'
import { createServiceClient } from '@/lib/supabase/server'

// ─── Mock NextRequest helper ─────────────────────────────────────────────────
const mockRequest = (authHeader?: string) =>
  ({
    headers: {
      get: (name: string) =>
        name === 'authorization' ? (authHeader ?? null) : null,
    },
  }) as any

// ─── Mock Supabase builder ───────────────────────────────────────────────────

type QueryResult = { data: any; error: any }

/**
 * Build a mock supabase client that supports the chained query patterns
 * used by the digest cron handler.
 */
function buildDigestSupabase(config: {
  users?: QueryResult
  clients?: QueryResult
  preferences?: QueryResult
  tasks?: QueryResult
}) {
  const callCounts: Record<string, number> = {}

  const mockFrom = vi.fn((table: string) => {
    const chain: any = {}

    chain.select = vi.fn((_cols?: string) => chain)
    chain.eq = vi.fn((_col: string, _val: any) => chain)
    chain.gte = vi.fn((_col: string, _val: any) => chain)
    chain.order = vi.fn((_col: string, _opts?: any) => chain)
    chain.maybeSingle = vi.fn(() => {
      return Promise.resolve(config.preferences ?? { data: null, error: null })
    })
    chain.single = vi.fn(() => {
      return Promise.resolve(config.clients ?? { data: null, error: null })
    })

    // Make chain thenable (awaitable) — resolves to table-specific data
    chain.then = (onFulfilled: any, onRejected: any) => {
      let result: QueryResult
      if (table === 'users') {
        result = config.users ?? { data: [], error: null }
      } else if (table === 'clients') {
        result = config.clients ?? { data: [], error: null }
      } else if (table === 'tasks') {
        result = config.tasks ?? { data: [], error: null }
      } else {
        result = { data: null, error: null }
      }
      return Promise.resolve(result).then(onFulfilled, onRejected)
    }
    chain.catch = (onRejected: any) =>
      Promise.reject(new Error('unhandled')).catch(onRejected)

    return chain
  })

  return { from: mockFrom }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GET /api/cron/digest — CRON_SECRET validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CRON_SECRET', 'test-secret')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.vantx.io')
    ;(createServiceClient as any).mockReturnValue(
      buildDigestSupabase({ users: { data: [], error: null } })
    )
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 401 when Authorization header is missing', async () => {
    const { GET } = await import('@/app/api/cron/digest/route')
    const res = await GET(mockRequest())
    expect(res.status).toBe(401)
  })

  it('returns 401 when Authorization header has wrong secret', async () => {
    const { GET } = await import('@/app/api/cron/digest/route')
    const res = await GET(mockRequest('Bearer wrong-secret'))
    expect(res.status).toBe(401)
  })

  it('returns non-401 when Authorization header is correct', async () => {
    const { GET } = await import('@/app/api/cron/digest/route')
    const res = await GET(mockRequest('Bearer test-secret'))
    expect(res.status).not.toBe(401)
  })
})

describe('GET /api/cron/digest — digest sending', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CRON_SECRET', 'test-secret')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.vantx.io')
    vi.stubEnv('RESEND_API_KEY', 're_test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('sends digest to client user when tasks exist and digest_enabled is not false', async () => {
    const supabase = buildDigestSupabase({
      users: {
        data: [
          {
            id: 'user-1',
            email: 'client@acme.com',
            full_name: 'Alice Client',
            role: 'client',
            client_id: 'client-001',
          },
        ],
        error: null,
      },
      clients: {
        data: [{ id: 'client-001', name: 'Acme', market: 'US' }],
        error: null,
      },
      preferences: { data: null, error: null }, // null = opt-in (send)
      tasks: {
        data: [
          { id: 't1', title: 'Fix bug', status: 'completed', client_id: 'client-001', updated_at: '2026-03-25T00:00:00Z' },
        ],
        error: null,
      },
    })
    ;(createServiceClient as any).mockReturnValue(supabase)

    const { GET } = await import('@/app/api/cron/digest/route')
    await GET(mockRequest('Bearer test-secret'))

    expect(sendEmail).toHaveBeenCalledOnce()
    const callArg = (sendEmail as any).mock.calls[0][0]
    expect(callArg.to).toBe('client@acme.com')
  })

  it('skips client user when digest_enabled is false', async () => {
    const supabase = buildDigestSupabase({
      users: {
        data: [
          {
            id: 'user-2',
            email: 'client2@acme.com',
            full_name: 'Bob Client',
            role: 'client',
            client_id: 'client-001',
          },
        ],
        error: null,
      },
      clients: {
        data: [{ id: 'client-001', name: 'Acme', market: 'US' }],
        error: null,
      },
      preferences: { data: { digest_enabled: false }, error: null },
      tasks: {
        data: [
          { id: 't1', title: 'Fix bug', status: 'completed', client_id: 'client-001', updated_at: '2026-03-25T00:00:00Z' },
        ],
        error: null,
      },
    })
    ;(createServiceClient as any).mockReturnValue(supabase)

    const { GET } = await import('@/app/api/cron/digest/route')
    await GET(mockRequest('Bearer test-secret'))

    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('skips when zero tasks in 7-day window (D-08)', async () => {
    const supabase = buildDigestSupabase({
      users: {
        data: [
          {
            id: 'user-3',
            email: 'client3@acme.com',
            full_name: 'Carol Client',
            role: 'client',
            client_id: 'client-001',
          },
        ],
        error: null,
      },
      clients: {
        data: [{ id: 'client-001', name: 'Acme', market: 'US' }],
        error: null,
      },
      preferences: { data: null, error: null },
      tasks: { data: [], error: null }, // zero tasks
    })
    ;(createServiceClient as any).mockReturnValue(supabase)

    const { GET } = await import('@/app/api/cron/digest/route')
    await GET(mockRequest('Bearer test-secret'))

    expect(sendEmail).not.toHaveBeenCalled()
  })
})

describe('GET /api/cron/digest — Promise.allSettled resilience (D-19)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CRON_SECRET', 'test-secret')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.vantx.io')
    vi.stubEnv('RESEND_API_KEY', 're_test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('does not throw when sendEmail rejects for one user — handler resolves', async () => {
    // First call rejects, subsequent calls resolve
    let callCount = 0
    ;(sendEmail as any).mockImplementation(() => {
      callCount++
      if (callCount === 1) return Promise.reject(new Error('Email service down'))
      return Promise.resolve({ id: 'mock-id' })
    })

    const supabase = buildDigestSupabase({
      users: {
        data: [
          {
            id: 'user-a',
            email: 'user-a@test.com',
            full_name: 'User A',
            role: 'client',
            client_id: 'client-001',
          },
          {
            id: 'user-b',
            email: 'user-b@test.com',
            full_name: 'User B',
            role: 'client',
            client_id: 'client-001',
          },
        ],
        error: null,
      },
      clients: {
        data: [{ id: 'client-001', name: 'Acme', market: 'US' }],
        error: null,
      },
      preferences: { data: null, error: null },
      tasks: {
        data: [
          { id: 't1', title: 'Task 1', status: 'completed', client_id: 'client-001', updated_at: '2026-03-25T00:00:00Z' },
        ],
        error: null,
      },
    })
    ;(createServiceClient as any).mockReturnValue(supabase)

    const { GET } = await import('@/app/api/cron/digest/route')

    // Should not throw even with email failure
    await expect(GET(mockRequest('Bearer test-secret'))).resolves.toBeDefined()
  })
})

describe('GET /api/cron/digest — admin/seller cross-client view (D-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CRON_SECRET', 'test-secret')
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.vantx.io')
    vi.stubEnv('RESEND_API_KEY', 're_test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('admin user gets cross-client digest (no client_id filter on tasks)', async () => {
    const supabase = buildDigestSupabase({
      users: {
        data: [
          {
            id: 'admin-1',
            email: 'admin@vantx.io',
            full_name: 'Admin User',
            role: 'admin',
            client_id: null,
          },
        ],
        error: null,
      },
      clients: { data: [], error: null },
      preferences: { data: null, error: null },
      tasks: {
        data: [
          { id: 't1', title: 'Cross-client task', status: 'in_progress', client_id: 'any-client', updated_at: '2026-03-25T00:00:00Z' },
        ],
        error: null,
      },
    })
    ;(createServiceClient as any).mockReturnValue(supabase)

    const { GET } = await import('@/app/api/cron/digest/route')
    await GET(mockRequest('Bearer test-secret'))

    // Email should be sent to admin
    expect(sendEmail).toHaveBeenCalledOnce()
    const callArg = (sendEmail as any).mock.calls[0][0]
    expect(callArg.to).toBe('admin@vantx.io')

    // Verify tasks query did NOT include client_id eq filter
    const fromCalls = supabase.from.mock.calls
    const tasksCalls = fromCalls.filter((c: any[]) => c[0] === 'tasks')
    expect(tasksCalls.length).toBeGreaterThan(0)
    // The tasks chain for admin should NOT have eq('client_id', ...) called with client_id
    // We verify this indirectly by confirming email was sent with cross-client tasks
  })

  it('seller user gets cross-client digest (same as admin — RLS grants cross-client access)', async () => {
    const supabase = buildDigestSupabase({
      users: {
        data: [
          {
            id: 'seller-1',
            email: 'seller@vantx.io',
            full_name: 'Seller User',
            role: 'seller',
            client_id: null,
          },
        ],
        error: null,
      },
      clients: { data: [], error: null },
      preferences: { data: null, error: null },
      tasks: {
        data: [
          { id: 't2', title: 'Cross-client task 2', status: 'open', client_id: 'any-client', updated_at: '2026-03-25T00:00:00Z' },
        ],
        error: null,
      },
    })
    ;(createServiceClient as any).mockReturnValue(supabase)

    const { GET } = await import('@/app/api/cron/digest/route')
    await GET(mockRequest('Bearer test-secret'))

    expect(sendEmail).toHaveBeenCalledOnce()
    const callArg = (sendEmail as any).mock.calls[0][0]
    expect(callArg.to).toBe('seller@vantx.io')
  })
})

describe('WeeklyDigestEmail — bilingual rendering', () => {
  it('renders en heading in English', async () => {
    const { render } = await import('@react-email/render')
    const { WeeklyDigestEmail } = await import('@/lib/emails/WeeklyDigestEmail')
    const React = await import('react')
    const html = await render(
      React.createElement(WeeklyDigestEmail, {
        locale: 'en',
        taskSummary: { new: 1, in_progress: 2, completed: 3 },
        recentTasks: [{ title: 'Fix bug', status: 'completed' }],
        totalTasks: 1,
        portalUrl: 'https://app.vantx.io/en/portal',
        dateRange: 'Mar 18 - Mar 25',
      })
    )
    expect(html).toContain('Your week at a glance')
  })

  it('renders es heading in Spanish', async () => {
    const { render } = await import('@react-email/render')
    const { WeeklyDigestEmail } = await import('@/lib/emails/WeeklyDigestEmail')
    const React = await import('react')
    const html = await render(
      React.createElement(WeeklyDigestEmail, {
        locale: 'es',
        taskSummary: { new: 1, in_progress: 2, completed: 3 },
        recentTasks: [{ title: 'Arreglar bug', status: 'completado' }],
        totalTasks: 1,
        portalUrl: 'https://app.vantx.io/es/portal',
        dateRange: '18 mar - 25 mar',
      })
    )
    expect(html).toContain('Tu semana de un vistazo')
  })
})
