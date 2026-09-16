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
    expect(next.listMetrics?.adminPermissionVariant).toBe('partner')
    expect(next.email).toBe('pm@jakorea.org')
    expect(next.permissionCodes).toEqual(['dashboard.view'])
  })

  it('VIEWER는 GENERAL로 매핑한다', () => {
    const next = applyAdminMeToSessionUser(current, { roleCode: 'VIEWER' })
    expect(next.roleCode).toBe('VIEWER')
    expect(next.adminLevel).toBe('GENERAL')
    expect(next.listMetrics?.adminPermissionVariant).toBe('viewer')
  })

  it('MASTER roleCode는 마스터 권한 유형으로 반영한다', () => {
    const next = applyAdminMeToSessionUser(current, { roleCode: 'MASTER' })
    expect(next.roleCode).toBe('MASTER')
    expect(next.listMetrics?.adminPermissionVariant).toBe('manager')
  })

  it('gender·birthDate를 세션에 반영한다', () => {
    const next = applyAdminMeToSessionUser(current, {
      gender: 'FEMALE',
      birthDate: '1990-09-15',
    })
    expect(next.gender).toBe('F')
    expect(next.birthDate).toBe('1990-09-15')
  })
})
