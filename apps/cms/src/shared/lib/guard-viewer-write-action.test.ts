import { afterEach, describe, expect, it, vi } from 'vitest'

const showAdminAccessDeniedAlert = vi.fn()
vi.mock('@/shared/lib/admin-role-policy', () => ({
  showAdminAccessDeniedAlert: () => showAdminAccessDeniedAlert(),
}))

let roleCode: string | undefined
vi.mock('@/features/auth/model/auth-store', () => ({
  useAuthStore: { getState: () => ({ user: roleCode ? { roleCode } : null }) },
}))

const { blockViewerWriteAction } = await import('./guard-viewer-write-action')

describe('blockViewerWriteAction', () => {
  afterEach(() => showAdminAccessDeniedAlert.mockClear())

  it.each(['PROGRAM_VIEWER', 'VIEWER'])('%s는 막고 접근 불가 안내를 띄운다', code => {
    roleCode = code
    expect(blockViewerWriteAction()).toBe(true)
    expect(showAdminAccessDeniedAlert).toHaveBeenCalledTimes(1)
  })

  it.each(['MASTER', 'PROGRAM_MANAGER', undefined])('%s는 막지 않는다', code => {
    roleCode = code
    expect(blockViewerWriteAction()).toBe(false)
    expect(showAdminAccessDeniedAlert).not.toHaveBeenCalled()
  })
})
