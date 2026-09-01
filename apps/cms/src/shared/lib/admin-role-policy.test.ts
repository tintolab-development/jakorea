import { describe, expect, it } from 'vitest'
import type { AdminActionKind, AdminPolicyScreen, AdminRoleCode } from './admin-role-policy'
import {
  adminRoleCodeToLegacyAdminLevel,
  canAdminAction,
  isSecurityLogPath,
  parseAdminRoleCode,
  resolveAdminPolicyScreen,
  resolveAdminRoleCodeFromUser,
  withSessionAdminRole,
} from './admin-role-policy'
import type { User } from '@/types/user'

const ROLES: AdminRoleCode[] = ['MASTER', 'PM', 'PARTNER', 'VIEWER']

function allowed(
  roleCode: AdminRoleCode,
  action: AdminActionKind,
  screen: AdminPolicyScreen = 'default'
): boolean {
  return canAdminAction({ roleCode, action, screen })
}

describe('parseAdminRoleCode', () => {
  it('4역할만 인식한다', () => {
    expect(parseAdminRoleCode('master')).toBe('MASTER')
    expect(parseAdminRoleCode('PM')).toBe('PM')
    expect(parseAdminRoleCode('ADMIN')).toBeNull()
  })
})

describe('adminRoleCodeToLegacyAdminLevel', () => {
  it('레거시 3단계로 접는다', () => {
    expect(adminRoleCodeToLegacyAdminLevel('MASTER')).toBe('MASTER')
    expect(adminRoleCodeToLegacyAdminLevel('PM')).toBe('ADMIN')
    expect(adminRoleCodeToLegacyAdminLevel('PARTNER')).toBe('ADMIN')
    expect(adminRoleCodeToLegacyAdminLevel('VIEWER')).toBe('GENERAL')
  })
})

describe('withSessionAdminRole', () => {
  it('관리자를 MASTER로 올리지 않고 mock 레벨을 유지한다', () => {
    const partner = withSessionAdminRole({
      id: 'admin-2',
      email: 'admin2@jakorea.org',
      name: '이운영',
      role: 'ADMIN',
      adminLevel: 'ADMIN',
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      listMetrics: { adminPermissionVariant: 'partner' },
    })
    expect(partner.roleCode).toBe('PARTNER')
    expect(partner.adminLevel).toBe('ADMIN')

    const viewer = withSessionAdminRole({
      id: 'admin-3',
      email: 'admin3@jakorea.org',
      name: '박시스템',
      role: 'ADMIN',
      adminLevel: 'GENERAL',
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      listMetrics: { adminPermissionVariant: 'viewer' },
    })
    expect(viewer.roleCode).toBe('VIEWER')
    expect(viewer.adminLevel).toBe('GENERAL')
  })
})

describe('resolveAdminRoleCodeFromUser', () => {
  it('roleCode가 있으면 우선한다', () => {
    const user = { role: 'ADMIN' as const, roleCode: 'PM' as const, adminLevel: 'MASTER' as const }
    expect(resolveAdminRoleCodeFromUser(user)).toBe('PM')
  })
})

describe('resolveAdminPolicyScreen', () => {
  it('로그·권한 설정 경로를 매핑한다', () => {
    expect(resolveAdminPolicyScreen('/logs/member-login-history')).toBe('security-logs')
    expect(resolveAdminPolicyScreen('/admin/settings/permissions')).toBe('permission-settings')
    expect(resolveAdminPolicyScreen('/users/list')).toBe('default')
  })
})

describe('isSecurityLogPath', () => {
  it('보안 로그 4종만 true', () => {
    expect(isSecurityLogPath('/logs/member-login-history')).toBe(true)
    expect(isSecurityLogPath('/logs/bug-issue-history/detail')).toBe(true)
    expect(isSecurityLogPath('/logs/other')).toBe(false)
  })
})

describe('canAdminAction 표 규칙', () => {
  it('조회(기본)는 4역할 모두 허용', () => {
    for (const role of ROLES) {
      expect(allowed(role, 'view')).toBe(true)
    }
  })

  it('등록·수정 / 삭제 / 발송 / 다운로드는 뷰어만 차단', () => {
    for (const action of ['write', 'delete', 'send', 'download'] as const) {
      expect(allowed('MASTER', action)).toBe(true)
      expect(allowed('PM', action)).toBe(true)
      expect(allowed('PARTNER', action)).toBe(true)
      expect(allowed('VIEWER', action)).toBe(false)
    }
  })

  it('일반 개인정보 열람은 뷰어만 차단', () => {
    expect(allowed('MASTER', 'pii')).toBe(true)
    expect(allowed('PM', 'pii')).toBe(true)
    expect(allowed('PARTNER', 'pii')).toBe(true)
    expect(allowed('VIEWER', 'pii')).toBe(false)
  })

  it('주민번호·계좌는 파트너·뷰어 차단', () => {
    for (const action of ['piiRrn', 'piiAccount'] as const) {
      expect(allowed('MASTER', action)).toBe(true)
      expect(allowed('PM', action)).toBe(true)
      expect(allowed('PARTNER', action)).toBe(false)
      expect(allowed('VIEWER', action)).toBe(false)
    }
  })

  it('보안 로그 조회는 마스터만', () => {
    expect(allowed('MASTER', 'view', 'security-logs')).toBe(true)
    expect(allowed('PM', 'view', 'security-logs')).toBe(false)
    expect(allowed('PARTNER', 'view', 'security-logs')).toBe(false)
    expect(allowed('VIEWER', 'view', 'security-logs')).toBe(false)
  })

  it('관리자 권한 승인·반려는 마스터만', () => {
    expect(allowed('MASTER', 'approve', 'admin-permission-approval')).toBe(true)
    expect(allowed('PM', 'approve', 'admin-permission-approval')).toBe(false)
    expect(allowed('PARTNER', 'approve', 'admin-permission-approval')).toBe(false)
    expect(allowed('VIEWER', 'approve', 'admin-permission-approval')).toBe(false)
  })

  it('권한 설정 저장은 뷰어만 차단, 승인·반려는 마스터만', () => {
    expect(allowed('MASTER', 'write', 'permission-settings')).toBe(true)
    expect(allowed('PM', 'write', 'permission-settings')).toBe(true)
    expect(allowed('PARTNER', 'write', 'permission-settings')).toBe(true)
    expect(allowed('VIEWER', 'write', 'permission-settings')).toBe(false)

    expect(allowed('MASTER', 'approve', 'permission-settings')).toBe(true)
    expect(allowed('PM', 'approve', 'permission-settings')).toBe(false)
    expect(allowed('PARTNER', 'approve', 'permission-settings')).toBe(false)
    expect(allowed('VIEWER', 'approve', 'permission-settings')).toBe(false)
  })

  it('강사 권한 승인은 뷰어만 차단', () => {
    expect(allowed('MASTER', 'approve')).toBe(true)
    expect(allowed('PM', 'approve')).toBe(true)
    expect(allowed('PARTNER', 'approve')).toBe(true)
    expect(allowed('VIEWER', 'approve')).toBe(false)
  })
})

describe('resolveAdminRoleCodeFromUser 타입 스모크', () => {
  it('비관리자는 null', () => {
    const user = { role: 'INSTRUCTOR' } as Pick<User, 'role'>
    expect(resolveAdminRoleCodeFromUser(user)).toBeNull()
  })
})
