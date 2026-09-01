import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: vi.fn(() => true),
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: vi.fn((key: string) => key === 'geminiPerformance'),
}))

import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import {
  GEMINI_PERFORMANCE_LIST_ENDPOINT,
  shouldUseGeminiPerformanceRemoteApi,
} from './capabilities'

describe('gemini performance capabilities', () => {
  beforeEach(() => {
    vi.mocked(hasRemoteAdminJwt).mockReturnValue(true)
    vi.mocked(isRealApiModuleEnabled).mockImplementation(
      (key: string) => key === 'geminiPerformance'
    )
  })

  it('uses training-reports as list SSOT', () => {
    expect(GEMINI_PERFORMANCE_LIST_ENDPOINT).toBe('training-reports')
  })

  it('requires jwt + geminiPerformance module', () => {
    expect(shouldUseGeminiPerformanceRemoteApi()).toBe(true)
    vi.mocked(hasRemoteAdminJwt).mockReturnValue(false)
    expect(shouldUseGeminiPerformanceRemoteApi()).toBe(false)
  })
})
