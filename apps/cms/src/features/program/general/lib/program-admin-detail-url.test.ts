import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  getProgramAdminDetailInfoTabUrlForProgramType,
  tryGetProgramAdminDetailInfoTabUrlByIdPrefix,
} from './program-admin-detail-url'

vi.mock('@/features/program/general/api/programs-api-client', () => ({
  fetchAdminProgramNavigationRemote: vi.fn(),
}))

vi.mock('@/features/program/general/api/general-programs-remote-capabilities', () => ({
  shouldUseProgramsHttpRemoteApi: vi.fn(() => true),
}))

describe('getProgramAdminDetailInfoTabUrlForProgramType', () => {
  it('maps COMPANY_SCHOOL to company-school list', () => {
    expect(getProgramAdminDetailInfoTabUrlForProgramType('167001', 'COMPANY_SCHOOL')).toBe(
      '/programs/company-school?programId=167001&lnb=info&tab=info'
    )
  })

  it('maps TRAINED_TEACHER to trained-teachers list', () => {
    expect(getProgramAdminDetailInfoTabUrlForProgramType('169208', 'TRAINED_TEACHER')).toBe(
      '/programs/trained-teachers?programId=169208&lnb=info&tab=info'
    )
  })

  it('maps UJAT to ujat list', () => {
    expect(getProgramAdminDetailInfoTabUrlForProgramType('169105', 'UJAT')).toBe(
      '/programs/ujat?programId=169105&lnb=info&tab=info'
    )
  })

  it('maps GENERAL to general list', () => {
    expect(getProgramAdminDetailInfoTabUrlForProgramType('170307', 'GENERAL')).toBe(
      '/programs/general?programId=170307&lnb=info&tab=info'
    )
  })
})

describe('tryGetProgramAdminDetailInfoTabUrlByIdPrefix', () => {
  it('returns null for bare numeric BE ids', () => {
    expect(tryGetProgramAdminDetailInfoTabUrlByIdPrefix('167001')).toBeNull()
  })

  it('returns company-school for economy-prog prefix', () => {
    expect(tryGetProgramAdminDetailInfoTabUrlByIdPrefix('economy-prog-001')).toBe(
      '/programs/company-school?programId=economy-prog-001&lnb=info&tab=info'
    )
  })
})

describe('resolveProgramAdminDetailInfoTabUrl', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('uses navigation canonicalProgramType for numeric ids', async () => {
    const { fetchAdminProgramNavigationRemote } = await import(
      '@/features/program/general/api/programs-api-client'
    )
    vi.mocked(fetchAdminProgramNavigationRemote).mockResolvedValue({
      programId: 167001,
      canonicalProgramType: 'COMPANY_SCHOOL',
      rawProgramType: 'COMPANY_SCHOOL',
    })

    const { resolveProgramAdminDetailInfoTabUrl } = await import('./resolve-program-admin-detail-url')
    await expect(resolveProgramAdminDetailInfoTabUrl('167001')).resolves.toBe(
      '/programs/company-school?programId=167001&lnb=info&tab=info'
    )
  })

  it('falls back to general when navigation fails', async () => {
    const { fetchAdminProgramNavigationRemote } = await import(
      '@/features/program/general/api/programs-api-client'
    )
    vi.mocked(fetchAdminProgramNavigationRemote).mockRejectedValue(new Error('not found'))

    const { resolveProgramAdminDetailInfoTabUrl } = await import('./resolve-program-admin-detail-url')
    await expect(resolveProgramAdminDetailInfoTabUrl('167808')).resolves.toBe(
      '/programs/general?programId=167808&lnb=info&tab=info'
    )
  })
})
