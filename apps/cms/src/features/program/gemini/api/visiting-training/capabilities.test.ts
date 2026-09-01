import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: vi.fn(() => true),
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: vi.fn((key: string) => key === 'geminiVisitingTraining'),
}))

import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import {
  GEMINI_VISITING_TRAINING_PROGRAM_TYPE,
  shouldUseGeminiVisitingTrainingRemoteApi,
} from './capabilities'

describe('gemini visiting-training capabilities', () => {
  beforeEach(() => {
    vi.mocked(hasRemoteAdminJwt).mockReturnValue(true)
    vi.mocked(isRealApiModuleEnabled).mockImplementation(
      (key: string) => key === 'geminiVisitingTraining'
    )
  })

  it('uses provisional GEMINI_TRAINING program type', () => {
    expect(GEMINI_VISITING_TRAINING_PROGRAM_TYPE).toBe('GEMINI_TRAINING')
  })

  it('requires jwt + geminiVisitingTraining module', () => {
    expect(shouldUseGeminiVisitingTrainingRemoteApi()).toBe(true)
    vi.mocked(hasRemoteAdminJwt).mockReturnValue(false)
    expect(shouldUseGeminiVisitingTrainingRemoteApi()).toBe(false)
  })

  it('does not enable with unrelated modules', () => {
    vi.mocked(isRealApiModuleEnabled).mockImplementation((key: string) => key === 'programs')
    expect(shouldUseGeminiVisitingTrainingRemoteApi()).toBe(false)
  })
})
