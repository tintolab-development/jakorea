import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { AdminActionKind, AdminPolicyScreen, AdminRoleCode } from './admin-role-policy'
import {
  ADMIN_ACCESS_DENIED_ALERT_CONTENT,
  ADMIN_ACCESS_DENIED_ALERT_TITLE,
  adminRoleCodeToLegacyAdminLevel,
  canAdminAction,
  isAdminAccessDeniedAlert,
  isPermissionRequestsPath,
  isPermissionSettingsPath,
  isProgramManagerPermissionSettingsPath,
  isSecurityLogPath,
  isTemplateManagementPath,
  isProgramOperableAdminRoleCode,
  parseAdminRoleCode,
  resolveAdminPolicyScreen,
  resolveAdminRoleCodeFromUser,
  showAdminAccessDeniedAlert,
  canNavigateBackInAppHistory,
  withSessionAdminRole,
} from './admin-role-policy'
import type { User } from '@/types/user'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

vi.mock('@/shared/ui/cms-alert-modal-api', () => ({
  cmsAlertModal: { show: vi.fn() },
}))

const onboarding = vi.hoisted(() => ({ incomplete: false }))

vi.mock('@/shared/utils/post-auth-redirect', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/utils/post-auth-redirect')>()
  return {
    ...actual,
    isAdminFirstLoginOnboardingIncomplete: () => onboarding.incomplete,
  }
})

const ROLES: AdminRoleCode[] = ['MASTER', 'PM', 'PARTNER', 'VIEWER']

function allowed(
  roleCode: AdminRoleCode,
  action: AdminActionKind,
  screen: AdminPolicyScreen = 'default'
): boolean {
  return canAdminAction({ roleCode, action, screen })
}

describe('parseAdminRoleCode', () => {
  it('정본·레거시 역할을 인식한다', () => {
    expect(parseAdminRoleCode('master')).toBe('MASTER')
    expect(parseAdminRoleCode('PM')).toBe('PM')
    expect(parseAdminRoleCode('PROGRAM_MANAGER')).toBe('PROGRAM_MANAGER')
    expect(parseAdminRoleCode('ACCOUNTING_MANAGER')).toBe('ACCOUNTING_MANAGER')
    expect(parseAdminRoleCode('PROGRAM_VIEWER')).toBe('PROGRAM_VIEWER')
    expect(parseAdminRoleCode('ADMIN')).toBeNull()
  })

  it('OpenAPI MIDDLE(중간 관리자)는 PROGRAM_MANAGER로 정규화한다', () => {
    expect(parseAdminRoleCode('MIDDLE')).toBe('PROGRAM_MANAGER')
    expect(parseAdminRoleCode('middle')).toBe('PROGRAM_MANAGER')
  })

  it('로컬 /me 원문을 세션 정본으로 접는다', () => {
    expect(parseAdminRoleCode('MASTER')).toBe('MASTER')
    expect(parseAdminRoleCode('MIDDLE')).toBe('PROGRAM_MANAGER')
    expect(parseAdminRoleCode('VIEWER')).toBe('VIEWER')
  })
})

describe('isProgramOperableAdminRoleCode', () => {
  it('includes N-16 managers and legacy MIDDLE/PM/PARTNER', () => {
    expect(isProgramOperableAdminRoleCode('PROGRAM_MANAGER')).toBe(true)
    expect(isProgramOperableAdminRoleCode('ACCOUNTING_MANAGER')).toBe(true)
    expect(isProgramOperableAdminRoleCode('MIDDLE')).toBe(true)
    expect(isProgramOperableAdminRoleCode('PM')).toBe(true)
    expect(isProgramOperableAdminRoleCode('PARTNER')).toBe(true)
    expect(isProgramOperableAdminRoleCode('MASTER')).toBe(false)
    expect(isProgramOperableAdminRoleCode('VIEWER')).toBe(false)
  })
})

describe('adminRoleCodeToLegacyAdminLevel', () => {
  it('레거시 3단계로 접는다', () => {
    expect(adminRoleCodeToLegacyAdminLevel('MASTER')).toBe('MASTER')
    expect(adminRoleCodeToLegacyAdminLevel('PM')).toBe('ADMIN')
    expect(adminRoleCodeToLegacyAdminLevel('PROGRAM_MANAGER')).toBe('ADMIN')
    expect(adminRoleCodeToLegacyAdminLevel('MIDDLE')).toBe('ADMIN')
    expect(adminRoleCodeToLegacyAdminLevel('ACCOUNTING_MANAGER')).toBe('ADMIN')
    expect(adminRoleCodeToLegacyAdminLevel('PARTNER')).toBe('ADMIN')
    expect(adminRoleCodeToLegacyAdminLevel('VIEWER')).toBe('GENERAL')
    expect(adminRoleCodeToLegacyAdminLevel('PROGRAM_VIEWER')).toBe('GENERAL')
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
    expect(partner.roleCode).toBe('PROGRAM_MANAGER')
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
    expect(viewer.roleCode).toBe('PROGRAM_VIEWER')
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
  it('로그·권한 설정·회원 권한 승인 경로를 매핑한다', () => {
    expect(resolveAdminPolicyScreen('/logs/member-login-history')).toBe('security-logs')
    expect(resolveAdminPolicyScreen('/admin/settings/permissions')).toBe('permission-settings')
    expect(resolveAdminPolicyScreen('/admin/permission-requests')).toBe('admin-permission-approval')
    expect(resolveAdminPolicyScreen('/templates/form-management')).toBe('template-management')
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

  it('대시보드 개인화 저장은 VIEWER 허용, PARTNER 차단', () => {
    expect(allowed('MASTER', 'dashboardWrite')).toBe(true)
    expect(allowed('PM', 'dashboardWrite')).toBe(true)
    expect(allowed('PROGRAM_MANAGER', 'dashboardWrite')).toBe(true)
    expect(allowed('MIDDLE', 'dashboardWrite')).toBe(true)
    expect(allowed('VIEWER', 'dashboardWrite')).toBe(true)
    expect(allowed('PARTNER', 'dashboardWrite')).toBe(false)
  })

  it('후원사 담당자 CRUD는 파트너 이상 허용, 뷰어는 조회만', () => {
    expect(allowed('MASTER', 'sponsorContactWrite')).toBe(true)
    expect(allowed('PM', 'sponsorContactWrite')).toBe(true)
    expect(allowed('PARTNER', 'sponsorContactWrite')).toBe(true)
    expect(allowed('VIEWER', 'sponsorContactWrite')).toBe(false)
    expect(canAdminAction({ roleCode: null, action: 'sponsorContactWrite' })).toBe(false)
    expect(allowed('VIEWER', 'download')).toBe(false)
  })

  it('후원사 기본정보·후원상태 수정은 파트너 이상 허용, 뷰어는 수정·다운로드 차단', () => {
    expect(allowed('MASTER', 'sponsorWrite')).toBe(true)
    expect(allowed('PM', 'sponsorWrite')).toBe(true)
    expect(allowed('PARTNER', 'sponsorWrite')).toBe(true)
    expect(allowed('VIEWER', 'sponsorWrite')).toBe(false)
    expect(canAdminAction({ roleCode: null, action: 'sponsorWrite' })).toBe(false)
    expect(allowed('VIEWER', 'download')).toBe(false)
    expect(allowed('PARTNER', 'download')).toBe(true)
  })

  it('회원 관리 일반 개인정보는 Master·Accounting·Program Manager만', () => {
    expect(allowed('MASTER', 'pii')).toBe(true)
    expect(allowed('ACCOUNTING_MANAGER', 'pii')).toBe(true)
    expect(allowed('PROGRAM_MANAGER', 'pii')).toBe(true)
    expect(allowed('PM', 'pii')).toBe(false)
    expect(allowed('PARTNER', 'pii')).toBe(false)
    // 읽기 별칭. 신규 쓰기 경로의 MIDDLE 거절과 별개다.
    expect(allowed('MIDDLE', 'pii')).toBe(true)
    expect(allowed('VIEWER', 'pii')).toBe(false)
    expect(allowed('PROGRAM_VIEWER', 'pii')).toBe(false)
  })

  it('전역 주민번호·계좌 원문은 Master만', () => {
    for (const action of ['piiRrn', 'piiAccount'] as const) {
      expect(allowed('MASTER', action)).toBe(true)
      expect(allowed('ACCOUNTING_MANAGER', action)).toBe(false)
      expect(allowed('PROGRAM_MANAGER', action)).toBe(false)
      expect(allowed('PM', action)).toBe(false)
      expect(allowed('PARTNER', action)).toBe(false)
      expect(allowed('MIDDLE', action)).toBe(false)
      expect(allowed('VIEWER', action)).toBe(false)
      expect(allowed('PROGRAM_VIEWER', action)).toBe(false)
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

  it('회원 권한 승인 조회는 뷰어만 차단', () => {
    expect(allowed('MASTER', 'view', 'admin-permission-approval')).toBe(true)
    expect(allowed('PM', 'view', 'admin-permission-approval')).toBe(true)
    expect(allowed('PARTNER', 'view', 'admin-permission-approval')).toBe(true)
    expect(allowed('VIEWER', 'view', 'admin-permission-approval')).toBe(false)
  })

  it('관리자 권한 설정·프로그램 담당자 권한 설정 조회·저장·승인은 마스터만', () => {
    for (const action of ['view', 'write', 'approve'] as const) {
      expect(allowed('MASTER', action, 'permission-settings')).toBe(true)
      expect(allowed('ACCOUNTING_MANAGER', action, 'permission-settings')).toBe(false)
      expect(allowed('PROGRAM_MANAGER', action, 'permission-settings')).toBe(false)
      expect(allowed('PM', action, 'permission-settings')).toBe(false)
      expect(allowed('PARTNER', action, 'permission-settings')).toBe(false)
      expect(allowed('VIEWER', action, 'permission-settings')).toBe(false)
    }
  })

  it('관리자 계정 관리(adminAccountManage)는 마스터만', () => {
    expect(allowed('MASTER', 'adminAccountManage')).toBe(true)
    expect(allowed('ACCOUNTING_MANAGER', 'adminAccountManage')).toBe(false)
    expect(allowed('PROGRAM_MANAGER', 'adminAccountManage')).toBe(false)
    expect(allowed('PROGRAM_VIEWER', 'adminAccountManage')).toBe(false)
  })

  it('정산 항목 설정 조회는 뷰어만 차단', () => {
    expect(resolveAdminPolicyScreen('/settlement-management/item-settings')).toBe(
      'settlement-item-settings'
    )
    expect(allowed('MASTER', 'view', 'settlement-item-settings')).toBe(true)
    expect(allowed('ACCOUNTING_MANAGER', 'view', 'settlement-item-settings')).toBe(true)
    expect(allowed('PROGRAM_MANAGER', 'view', 'settlement-item-settings')).toBe(true)
    expect(allowed('PROGRAM_VIEWER', 'view', 'settlement-item-settings')).toBe(false)
    expect(allowed('VIEWER', 'view', 'settlement-item-settings')).toBe(false)
  })

  it('isPermissionSettingsPath는 권한 설정 경로만 인식한다', () => {
    expect(isPermissionSettingsPath('/admin/settings/permissions')).toBe(true)
    expect(isPermissionSettingsPath('/admin/settings/permissions/')).toBe(true)
    expect(isPermissionSettingsPath('/admin/permission-requests')).toBe(false)
    expect(isProgramManagerPermissionSettingsPath('/admin/settings/program-manager-permissions')).toBe(
      true
    )
    expect(resolveAdminPolicyScreen('/admin/settings/program-manager-permissions')).toBe(
      'permission-settings'
    )
  })

  it('isPermissionRequestsPath는 회원 권한 승인 경로만 인식한다', () => {
    expect(isPermissionRequestsPath('/admin/permission-requests')).toBe(true)
    expect(isPermissionRequestsPath('/admin/permission-requests/')).toBe(true)
    expect(isPermissionRequestsPath('/admin/settings/permissions')).toBe(false)
  })

  it('템플릿 관리 조회는 뷰어만 차단', () => {
    expect(allowed('MASTER', 'view', 'template-management')).toBe(true)
    expect(allowed('PM', 'view', 'template-management')).toBe(true)
    expect(allowed('PARTNER', 'view', 'template-management')).toBe(true)
    expect(allowed('VIEWER', 'view', 'template-management')).toBe(false)
  })

  it('isTemplateManagementPath는 템플릿 경로만 인식한다', () => {
    expect(isTemplateManagementPath('/templates')).toBe(true)
    expect(isTemplateManagementPath('/templates/form-management')).toBe(true)
    expect(isTemplateManagementPath('/templates/program-forms')).toBe(true)
    expect(isTemplateManagementPath('/admin/settings/permissions')).toBe(false)
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

describe('isAdminAccessDeniedAlert', () => {
  it('권한 안내 카피만 인식한다', () => {
    expect(
      isAdminAccessDeniedAlert({
        title: ADMIN_ACCESS_DENIED_ALERT_TITLE,
        content: ADMIN_ACCESS_DENIED_ALERT_CONTENT,
      })
    ).toBe(true)
    expect(
      isAdminAccessDeniedAlert({
        title: '안내',
        content: '현재 계정에 필요한 권한 또는 접근 범위가 없습니다.',
      })
    ).toBe(false)
  })
})

describe('showAdminAccessDeniedAlert', () => {
  beforeEach(() => {
    onboarding.incomplete = false
    vi.mocked(cmsAlertModal.show).mockClear()
  })

  it('온보딩 미완료면 권한 안내를 띄우지 않는다', () => {
    onboarding.incomplete = true
    expect(showAdminAccessDeniedAlert()).toBe(false)
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
  })

  it('온보딩이 끝났으면 권한 안내를 띄운다', () => {
    expect(showAdminAccessDeniedAlert()).toBe(true)
    expect(cmsAlertModal.show).toHaveBeenCalledWith({
      title: ADMIN_ACCESS_DENIED_ALERT_TITLE,
      content: ADMIN_ACCESS_DENIED_ALERT_CONTENT,
      onConfirm: undefined,
    })
  })

  it('확인 콜백을 안내 모달에 넘긴다', () => {
    const onConfirm = vi.fn()
    expect(showAdminAccessDeniedAlert({ onConfirm })).toBe(true)
    expect(cmsAlertModal.show).toHaveBeenCalledWith({
      title: ADMIN_ACCESS_DENIED_ALERT_TITLE,
      content: ADMIN_ACCESS_DENIED_ALERT_CONTENT,
      onConfirm,
    })
  })
})

describe('canNavigateBackInAppHistory', () => {
  it('React Router idx가 있을 때만 앱 안에서 뒤로 간다', () => {
    expect(canNavigateBackInAppHistory(undefined)).toBe(false)
    expect(canNavigateBackInAppHistory({ idx: 0 })).toBe(false)
    expect(canNavigateBackInAppHistory({ idx: 1 })).toBe(true)
  })
})
