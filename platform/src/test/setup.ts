import { vi } from 'vitest'
import '@testing-library/jest-dom'

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}))
