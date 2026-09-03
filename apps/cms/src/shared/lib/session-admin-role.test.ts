import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import {
  getSessionAdminRoleCode,
  guardAdminDownload,
} from '@/shared/lib/session-admin-role'

vi.mock('@/shared/ui/cms-alert-modal-api', () => ({
  cmsAlertModal: { show: vi.fn() },
}))

const viewerUser = {
  id: 'viewer-1',
  email: 'viewer1@jakorea.org',
  name: '뷰어관리',
  role: 'ADMIN' as const,
  roleCode: 'VIEWER' as const,
  adminLevel: 'GENERAL' as const,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const masterUser = {
  id: 'master-1',
  email: 'admin1@jakorea.org',
  name: '김관리',
  role: 'ADMIN' as const,
  roleCode: 'MASTER' as const,
  adminLevel: 'MASTER' as const,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('getSessionAdminRoleCode', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null })
  })

  it('세션 user roleCode를 반환한다', () => {
    useAuthStore.setState({ user: viewerUser })
    expect(getSessionAdminRoleCode()).toBe('VIEWER')
  })
})

describe('guardAdminDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: null })
  })

  it('VIEWER는 차단하고 알림을 띄운다', () => {
    useAuthStore.setState({ user: viewerUser })
    expect(guardAdminDownload()).toBe(false)
    expect(cmsAlertModal.show).toHaveBeenCalledTimes(1)
  })

  it('MASTER는 허용한다', () => {
    useAuthStore.setState({ user: masterUser })
    expect(guardAdminDownload()).toBe(true)
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
  })

  it('명시 roleCode를 우선한다', () => {
    useAuthStore.setState({ user: masterUser })
    expect(guardAdminDownload({ roleCode: 'VIEWER' })).toBe(false)
  })
})
