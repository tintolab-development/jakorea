/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

vi.mock('@/features/program/general/api/admin-general-programs-service', () => ({
  fetchGeneralProgramManagers: vi.fn(),
  addGeneralProgramManager: vi.fn(),
  updateGeneralProgramManager: vi.fn(),
  deleteGeneralProgramManager: vi.fn(),
}))

vi.mock('@/features/program/general/api/manager-candidates-query', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/features/program/general/api/manager-candidates-query')>()
  return { ...actual, fetchAssignableManagerCandidates: vi.fn() }
})

vi.mock('@/features/user/detail/lib/use-my-program-privacy-role', () => ({
  useMyProgramPrivacyRole: () => ({
    assignment: { role: 'PM' },
    pending: false,
    canRevealGeneral: true,
    canRevealSensitive: true,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/features/program/shared/lib/program-my-assignment', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/features/program/shared/lib/program-my-assignment')>()
  return {
    ...actual,
    canListProgramManagers: () => true,
    canManageProgramManagers: () => true,
    canDownloadProgramFiles: () => true,
  }
})

vi.mock('@/features/program/1c-1s/lib/use-company-school-surface-remote', () => ({
  useProgramsReadsRemoteEnabledForSurface: () => true,
}))

vi.mock('@/features/program/shared/lib/program-api-unavailable', () => ({
  useNotifyProgramApiUnavailableOnce: () => undefined,
}))

import { fetchGeneralProgramManagers } from '@/features/program/general/api/admin-general-programs-service'
import { fetchAssignableManagerCandidates } from '@/features/program/general/api/manager-candidates-query'
import { useProgramManagers } from './use-program-managers'

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('useProgramManagers', () => {
  beforeEach(() => {
    vi.mocked(fetchGeneralProgramManagers).mockReset()
    vi.mocked(fetchAssignableManagerCandidates).mockReset()
    vi.mocked(fetchGeneralProgramManagers).mockResolvedValue([
      {
        id: '1',
        no: 1,
        name: 'N1관리자99101',
        role: 'OWNER',
        phone: '010-****-5678',
        email: 'n1-99101@example.test',
        registeredAt: '2026.01.01 10:00',
        adminId: 99101,
        cmsRoleCode: 'MASTER',
        removableYn: false,
      },
    ])
    vi.mocked(fetchAssignableManagerCandidates).mockResolvedValue([
      { id: '5', name: '후보', email: '', phone: '', adminId: 5, cmsRoleCode: 'ADMIN' },
      { id: '99101', name: '중복', email: '', phone: '', adminId: 99101 },
    ])
  })

  it('does not fetch admin candidates on tab entry; rows keep server phone/role', async () => {
    const { result } = renderHook(() => useProgramManagers('99201'), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.managers).toHaveLength(1))
    expect(result.current.managers[0]).toMatchObject({
      phone: '010-****-5678',
      cmsRoleCode: 'MASTER',
      email: 'n1-99101@example.test',
    })
    expect(fetchAssignableManagerCandidates).not.toHaveBeenCalled()
  })

  it('fetches candidates by keyword only when the add modal search is enabled', async () => {
    const { result } = renderHook(
      () => useProgramManagers('99201', {}, { enabled: true, keyword: ' 후보 ' }),
      { wrapper: createWrapper() }
    )
    await waitFor(() => expect(fetchAssignableManagerCandidates).toHaveBeenCalledWith('후보'))
    await waitFor(() => expect(result.current.managers).toHaveLength(1))
    await waitFor(() =>
      expect(result.current.getAssignableCandidates([]).map(c => c.id)).toEqual(['5'])
    )
  })
})
