import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: vi.fn(() => true),
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: vi.fn((key: string) => key === 'programs'),
}))

import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import {
  isTrainedTeacherRemoteOptedIn,
  shouldUseTrainedTeacherProgramsRemoteApi,
} from './capabilities'

describe('trained-teachers capabilities', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED', 'true')
    vi.mocked(hasRemoteAdminJwt).mockReturnValue(true)
    vi.mocked(isRealApiModuleEnabled).mockImplementation((key: string) => key === 'programs')
  })

  it('opts in only when env is exactly true after trim/lowercase', () => {
    vi.stubEnv('VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED', ' true ')
    expect(isTrainedTeacherRemoteOptedIn()).toBe(true)
    vi.stubEnv('VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED', '1')
    expect(isTrainedTeacherRemoteOptedIn()).toBe(false)
  })

  it('requires jwt + programs + opt-in for core remote', () => {
    expect(shouldUseTrainedTeacherProgramsRemoteApi()).toBe(true)
    vi.mocked(hasRemoteAdminJwt).mockReturnValue(false)
    expect(shouldUseTrainedTeacherProgramsRemoteApi()).toBe(false)
  })

  it('does not enable with programs alone when opt-in is off', () => {
    vi.stubEnv('VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED', 'false')
    expect(shouldUseTrainedTeacherProgramsRemoteApi()).toBe(false)
  })

  it('allows trainedTeacherPrograms module as opt-in alternative', () => {
    vi.stubEnv('VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED', 'false')
    vi.mocked(isRealApiModuleEnabled).mockImplementation((key: string) =>
      ['programs', 'trainedTeacherPrograms'].includes(key)
    )
    expect(shouldUseTrainedTeacherProgramsRemoteApi()).toBe(true)
  })
})
