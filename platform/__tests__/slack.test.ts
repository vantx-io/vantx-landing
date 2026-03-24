import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { provisionSlack } from '@/lib/slack'

const mockClient = {
  short_name: 'acme',
  name: 'Acme Corp',
}

describe('provisionSlack — no SLACK_BOT_TOKEN', () => {
  beforeEach(() => {
    vi.stubEnv('SLACK_BOT_TOKEN', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('skips all steps when SLACK_BOT_TOKEN is empty', async () => {
    const results = await provisionSlack(mockClient)
    expect(results).toHaveLength(2)
    expect(results[0].status).toBe('skipped')
    expect(results[1].status).toBe('skipped')
  })

  it('returns skipped steps with slack-create-channel and slack-welcome-message step names', async () => {
    const results = await provisionSlack(mockClient)
    expect(results[0].step).toBe('slack-create-channel')
    expect(results[1].step).toBe('slack-welcome-message')
  })

  it('includes explanatory message in skipped steps', async () => {
    const results = await provisionSlack(mockClient)
    expect(results[0].message).toContain('SLACK_BOT_TOKEN')
    expect(results[1].message).toContain('SLACK_BOT_TOKEN')
  })

  it('does not call fetch when token is missing', async () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    await provisionSlack(mockClient)
    expect(mockFetch).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})

describe('provisionSlack — with SLACK_BOT_TOKEN', () => {
  beforeEach(() => {
    vi.stubEnv('SLACK_BOT_TOKEN', 'xoxb-test-token-12345')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('calls conversations.list to check for existing channels', async () => {
    const mockFetch = vi.fn()
    // conversations.list response (no existing channel)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        channels: [],
        response_metadata: { next_cursor: '' },
      }),
    })
    // conversations.create response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        channel: { id: 'C123456', name: 'vantx-acme' },
      }),
    })
    // conversations.setTopic
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    })
    // conversations.setPurpose
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    })
    // chat.postMessage
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    })

    vi.stubGlobal('fetch', mockFetch)
    const results = await provisionSlack(mockClient)

    expect(mockFetch).toHaveBeenCalled()
    // First call should be conversations.list
    const firstCall = mockFetch.mock.calls[0]
    expect(firstCall[0]).toContain('conversations.list')
  })

  it('returns success steps when Slack API succeeds', async () => {
    const mockFetch = vi.fn()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        channels: [],
        response_metadata: { next_cursor: '' },
      }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        channel: { id: 'C123456', name: 'vantx-acme' },
      }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    })

    vi.stubGlobal('fetch', mockFetch)
    const results = await provisionSlack(mockClient)

    expect(results).toHaveLength(2)
    expect(results[0].step).toBe('slack-create-channel')
    expect(results[0].status).toBe('success')
    expect(results[1].step).toBe('slack-welcome-message')
    expect(results[1].status).toBe('success')
  })

  it('handles existing channel gracefully (name_taken from conversations.create)', async () => {
    const mockFetch = vi.fn()
    // conversations.list — no existing channel found
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        channels: [],
        response_metadata: { next_cursor: '' },
      }),
    })
    // conversations.create returns name_taken
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: false,
        error: 'name_taken',
      }),
    })
    // Retry findChannel via conversations.list — returns the existing channel
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        channels: [{ id: 'C999', name: 'vantx-acme' }],
        response_metadata: { next_cursor: '' },
      }),
    })
    // chat.postMessage (welcome message)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    })

    vi.stubGlobal('fetch', mockFetch)
    const results = await provisionSlack(mockClient)

    // Should succeed — name_taken is handled by retrying findChannel
    expect(results[0].step).toBe('slack-create-channel')
    expect(results[0].status).toBe('success')
  })

  it('returns failed step when channel creation fails with non-name_taken error', async () => {
    const mockFetch = vi.fn()
    // conversations.list — empty
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        channels: [],
        response_metadata: { next_cursor: '' },
      }),
    })
    // conversations.create fails with generic error
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: false,
        error: 'not_authed',
      }),
    })

    vi.stubGlobal('fetch', mockFetch)
    const results = await provisionSlack(mockClient)

    expect(results[0].step).toBe('slack-create-channel')
    expect(results[0].status).toBe('failed')
    // Should stop after channel creation fails
    expect(results).toHaveLength(1)
  })

  it('returns failed welcome message step but does not throw when postMessage fails', async () => {
    const mockFetch = vi.fn()
    // conversations.list
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        channels: [],
        response_metadata: { next_cursor: '' },
      }),
    })
    // conversations.create — success
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        channel: { id: 'C123456', name: 'vantx-acme' },
      }),
    })
    // conversations.setTopic
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    })
    // conversations.setPurpose
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    })
    // chat.postMessage — fails
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: false,
        error: 'channel_not_found',
      }),
    })

    vi.stubGlobal('fetch', mockFetch)
    const results = await provisionSlack(mockClient)

    expect(results).toHaveLength(2)
    expect(results[0].status).toBe('success')
    expect(results[1].step).toBe('slack-welcome-message')
    expect(results[1].status).toBe('failed')
  })
})
