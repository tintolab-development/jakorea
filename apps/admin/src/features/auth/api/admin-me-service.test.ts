import { describe, expect, it } from 'vitest'
import { normalizeAdminMeProfile } from './admin-me-service'
import { resolveHomepageActionPermissions } from '@/shared/lib/homepage-action-guard'
import { canAccessHomepageLogs } from '@/shared/lib/homepage-log-access'

describe('normalizeAdminMeProfile — CMS(JABACK) /api/admin/me 형식', () => {
  const jabackMe = {
    adminAccountId: 165003,
    roleCode: 'PROGRAM_MANAGER',
    roleName: 'Program Manager',
    permissionCodes: ['HOMEPAGE_VIEW', 'HOMEPAGE_EDIT', 'HOMEPAGE_PII_VIEW', 'PROGRAM_READ'],
  }

  it('permissionCodes·adminAccountId를 permissions·adminId로 옮긴다', () => {
    const profile = normalizeAdminMeProfile(jabackMe)
    expect(profile.adminId).toBe(165003)
    expect(profile.permissions).toEqual(jabackMe.permissionCodes)
    expect(profile).not.toHaveProperty('permissionCodes')
  })

  it('Program Manager는 홈페이지 편집·개인정보가 허용된다', () => {
    const profile = normalizeAdminMeProfile(jabackMe)
    expect(
      resolveHomepageActionPermissions({
        resolved: true,
        roleCode: profile.roleCode,
        permissions: profile.permissions,
      })
    ).toEqual({ write: true, pii: true })
  })

  it('Master는 로그 관리에 접근한다', () => {
    const profile = normalizeAdminMeProfile({ roleCode: 'MASTER', permissionCodes: ['HOMEPAGE_VIEW'] })
    expect(canAccessHomepageLogs(profile.roleCode, profile.permissions)).toBe(true)
  })

  it('홈페이지 BE 형식(permissions)도 그대로 쓴다', () => {
    const profile = normalizeAdminMeProfile({ adminId: 7, permissions: ['HOMEPAGE_VIEW'] })
    expect(profile.adminId).toBe(7)
    expect(profile.permissions).toEqual(['HOMEPAGE_VIEW'])
  })
})
