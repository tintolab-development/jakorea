import { describe, expect, it, vi, beforeEach } from 'vitest'
import { navigateToProgramAdminDetail } from './navigate-to-program-admin-detail'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'

const resolveMock = vi.fn(async (id: string) => {
  if (id === '167001') {
    return '/programs/company-school?programId=167001&lnb=info&tab=info'
  }
  return `/programs/general?programId=${id}&lnb=info&tab=info`
})

vi.mock('./resolve-program-admin-detail-url', () => ({
  resolveProgramAdminDetailInfoTabUrl: (id: string, _qc?: unknown) => resolveMock(id),
}))

describe('navigateToProgramAdminDetail', () => {
  beforeEach(() => {
    resolveMock.mockClear()
  })

  it('calls onBeforeNavigate before navigating known prefix', () => {
    const navigate = vi.fn()
    const onBeforeNavigate = vi.fn()

    navigateToProgramAdminDetail(navigate, 'economy-prog-001', { onBeforeNavigate })

    expect(onBeforeNavigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(
      '/programs/company-school?programId=economy-prog-001&lnb=info&tab=info'
    )
    expect(onBeforeNavigate.mock.invocationCallOrder[0]).toBeLessThan(
      navigate.mock.invocationCallOrder[0]!
    )
  })

  it('navigates sync from queryClient navigation cache', () => {
    const navigate = vi.fn()
    const getQueryData = vi.fn(() => ({
      canonicalProgramType: 'COMPANY_SCHOOL',
      rawProgramType: 'COMPANY_SCHOOL',
    }))
    const queryClient = { getQueryData } as never

    navigateToProgramAdminDetail(navigate, '167001', { queryClient })

    expect(getQueryData).toHaveBeenCalledWith(generalProgramQueryKeys.navigation('167001'))
    expect(navigate).toHaveBeenCalledWith(
      '/programs/company-school?programId=167001&lnb=info&tab=info'
    )
    expect(resolveMock).not.toHaveBeenCalled()
  })

  it('falls back to async resolve once when cache misses', async () => {
    const navigate = vi.fn()
    const queryClient = { getQueryData: vi.fn(() => undefined) } as never

    navigateToProgramAdminDetail(navigate, '167001', { queryClient })

    expect(navigate).not.toHaveBeenCalled()
    await vi.waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1)
    })
    expect(navigate).toHaveBeenCalledWith(
      '/programs/company-school?programId=167001&lnb=info&tab=info'
    )
  })
})
