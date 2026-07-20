import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: vi.fn(() => true),
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: vi.fn((key: string) =>
    ['programs', 'applications', 'programProgress'].includes(key)
  ),
}))

import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import {
  isCompanySchoolRemoteOptedIn,
  shouldUseCompanySchoolApplicationsRemoteApi,
  shouldUseCompanySchoolProgramProgressRemoteApi,
  shouldUseCompanySchoolRemoteApi,
} from './capabilities'

describe('company-school capabilities', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED', 'true')
    vi.mocked(hasRemoteAdminJwt).mockReturnValue(true)
    vi.mocked(isRealApiModuleEnabled).mockImplementation((key: string) =>
      ['programs', 'applications', 'programProgress'].includes(key)
    )
  })

  it('opts in only when env is exactly true after trim/lowercase', () => {
    vi.stubEnv('VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED', ' true ')
    expect(isCompanySchoolRemoteOptedIn()).toBe(true)
    vi.stubEnv('VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED', '1')
    expect(isCompanySchoolRemoteOptedIn()).toBe(false)
  })

  it('requires jwt + programs + opt-in for core remote', () => {
    expect(shouldUseCompanySchoolRemoteApi()).toBe(true)
    vi.mocked(hasRemoteAdminJwt).mockReturnValue(false)
    expect(shouldUseCompanySchoolRemoteApi()).toBe(false)
  })

  it('applications and progress require their modules', () => {
    expect(shouldUseCompanySchoolApplicationsRemoteApi()).toBe(true)
    expect(shouldUseCompanySchoolProgramProgressRemoteApi()).toBe(true)
    vi.mocked(isRealApiModuleEnabled).mockImplementation((key: string) => key === 'programs')
    expect(shouldUseCompanySchoolApplicationsRemoteApi()).toBe(false)
    expect(shouldUseCompanySchoolProgramProgressRemoteApi()).toBe(false)
  })
})
