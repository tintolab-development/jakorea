import { AxiosError, AxiosHeaders } from 'axios'
import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchProgramMyAssignment = vi.fn()
const showAdminAccessDeniedAlert = vi.fn(() => true)
let checkRequired = true
let roleCode = 'PROGRAM_MANAGER'

vi.mock('@/features/auth/model/auth-store', () => ({
  useAuthStore: { getState: () => ({ user: { adminAccountId: 7 } }) },
}))
vi.mock('@/features/program/shared/lib/program-detail-access', () => ({
  isProgramDetailAccessCheckRequired: () => checkRequired,
}))
vi.mock('@/features/program/shared/lib/program-my-assignment', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/features/program/shared/lib/program-my-assignment')>()
  return { ...actual, fetchProgramMyAssignment: (id: string) => fetchProgramMyAssignment(id) }
})
vi.mock('@/shared/lib/admin-role-policy', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/lib/admin-role-policy')>()
  return {
    ...actual,
    resolveAdminRoleCodeFromUser: () => roleCode,
    showAdminAccessDeniedAlert: () => showAdminAccessDeniedAlert(),
  }
})

import { ensureProgramWriteAllowed } from './program-role-action-check'

const editor = { assigned: true, assignmentRole: 'PARTNER', capabilities: ['PROGRAM_VIEW', 'PROGRAM_EDIT'] }
const viewer = { assigned: true, assignmentRole: 'VIEWER', capabilities: ['PROGRAM_VIEW'] }

describe('ensureProgramWriteAllowed — 역할 연동 처리 사전 확인', () => {
  let client: QueryClient
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    fetchProgramMyAssignment.mockReset()
    showAdminAccessDeniedAlert.mockClear()
    checkRequired = true
    roleCode = 'PROGRAM_MANAGER'
  })

  it('모든 대상이 Owner·Assistant면 허용한다(중복 id는 한 번만 조회)', async () => {
    fetchProgramMyAssignment.mockResolvedValue(editor)
    await expect(ensureProgramWriteAllowed(['1', 1, '2', null], client)).resolves.toBe(true)
    expect(fetchProgramMyAssignment).toHaveBeenCalledTimes(2)
    expect(showAdminAccessDeniedAlert).not.toHaveBeenCalled()
  })

  it('하나라도 Program Viewer(프로그램 상세)면 안내를 띄우고 막는다', async () => {
    fetchProgramMyAssignment.mockImplementation((id: string) =>
      Promise.resolve(id === '2' ? viewer : editor)
    )
    await expect(ensureProgramWriteAllowed(['1', '2'], client)).resolves.toBe(false)
    expect(showAdminAccessDeniedAlert).toHaveBeenCalledTimes(1)
  })

  it('미배정(403)은 공통 403 안내에 맡기고 추가 안내 없이 막는다', async () => {
    fetchProgramMyAssignment.mockRejectedValue(
      new AxiosError('forbidden', '403', undefined, undefined, {
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: {},
      })
    )
    await expect(ensureProgramWriteAllowed(['3'], client)).resolves.toBe(false)
    expect(showAdminAccessDeniedAlert).not.toHaveBeenCalled()
  })

  it('Master·원격 미사용은 확인 없이 허용하고, 그 밖의 조회 실패는 서버 판정에 맡긴다', async () => {
    checkRequired = false
    await expect(ensureProgramWriteAllowed(['1'], client)).resolves.toBe(true)
    expect(fetchProgramMyAssignment).not.toHaveBeenCalled()
    checkRequired = true
    fetchProgramMyAssignment.mockRejectedValue(new Error('network'))
    await expect(ensureProgramWriteAllowed(['1'], client)).resolves.toBe(true)
  })
})
