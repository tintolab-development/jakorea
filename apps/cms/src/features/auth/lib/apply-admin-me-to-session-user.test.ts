import { describe, expect, it } from 'vitest'
import { applyAdminMeToSessionUser } from './apply-admin-me-to-session-user'
import type { User } from '@/types/user'

const current: Omit<User, 'password'> = {
  id: 'social-sso-pending',
  email: '',
  name: '관리자',
  role: 'ADMIN',
  roleCode: 'VIEWER',
  adminLevel: 'GENERAL',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('applyAdminMeToSessionUser', () => {
  it('GET /api/admin/me roleCode를 세션에 반영하고 MASTER로 올리지 않는다', () => {
    const next = applyAdminMeToSessionUser(current, {
      uuid: 'admin-uuid',
      email: 'pm@jakorea.org',
      name: 'PM관리',
      roleCode: 'PM',
      permissionCodes: ['dashboard.view'],
    })
    expect(next.roleCode).toBe('PM')
    expect(next.adminLevel).toBe('ADMIN')
    expect(next.email).toBe('pm@jakorea.org')
    expect(next.permissionCodes).toEqual(['dashboard.view'])
  })

  it('VIEWER는 GENERAL로 매핑한다', () => {
    const next = applyAdminMeToSessionUser(current, { roleCode: 'VIEWER' })
    expect(next.roleCode).toBe('VIEWER')
    expect(next.adminLevel).toBe('GENERAL')
  })
})
