import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: vi.fn(() => true),
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: vi.fn(() => true),
}))

vi.mock('@/features/program/general/api/general-programs-remote-capabilities', () => ({
  shouldUseGeneralProgramsRemoteApi: vi.fn(() => false),
}))

vi.mock('@/features/program/1c-1s/api/capabilities', () => ({
  shouldUseCompanySchoolApplicationsRemoteApi: vi.fn(() => true),
}))

import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { shouldUseCompanySchoolApplicationsRemoteApi } from '@/features/program/1c-1s/api/capabilities'
import {
  shouldUseGeneralApplicationsRemoteApi,
  shouldUseOrganizationApplicationRemoteApi,
} from './applications-remote-capabilities'

describe('shouldUseOrganizationApplicationRemoteApi', () => {
  beforeEach(() => {
    vi.mocked(hasRemoteAdminJwt).mockReturnValue(true)
    vi.mocked(isRealApiModuleEnabled).mockReturnValue(true)
    vi.mocked(shouldUseGeneralProgramsRemoteApi).mockReturnValue(false)
    vi.mocked(shouldUseCompanySchoolApplicationsRemoteApi).mockReturnValue(true)
  })

  it('allows 1사1교 institution and instructor detail when general programs remote is off', () => {
    expect(shouldUseGeneralApplicationsRemoteApi()).toBe(false)
    expect(shouldUseOrganizationApplicationRemoteApi()).toBe(true)
  })
})
