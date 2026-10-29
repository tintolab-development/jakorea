/**
 * CMS 관리자 역할(MASTER / ACCOUNTING_MANAGER / PROGRAM_MANAGER / PROGRAM_VIEWER + 레거시) 화면 가드.
 * 메뉴·버튼은 숨기지 않고, 차단 시 AlertModal만 띄운다.
 */

import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import type { AdminLevel, AdminRoleCode, User } from '@/types/user'
import { isAdminSessionRoleSyncPending } from '@/features/auth/lib/admin-session-sync-state'
import { isAdminFirstLoginOnboardingIncomplete } from '@/shared/utils/post-auth-redirect'
import {
  isCmsOperableProgramOwnerRole,
  isCmsViewerAdminRole,
} from '@/shared/lib/cms-global-role-code'

export type { AdminRoleCode }

/** 조회 전용 — 레거시 VIEWER 포함 */
export function isReadOnlyAdminRoleCode(roleCode: AdminRoleCode | null | undefined): boolean {
  return isCmsViewerAdminRole(roleCode)
}

/** 프로그램 운영·회계 등 write 가능 역할(마스터 제외 실무) — 레거시 MIDDLE 포함 */
export function isProgramOperableAdminRoleCode(roleCode: AdminRoleCode | null | undefined): boolean {
  return isCmsOperableProgramOwnerRole(roleCode)
}

export type AdminActionKind =
  | 'view'
  | 'write'
  | 'dashboardWrite'
  | 'delete'
  | 'approve'
  | 'send'
  | 'download'
  | 'sponsorWrite'
  | 'sponsorContactWrite'
  | 'pii'
  | 'piiRrn'
  | 'piiAccount'

export type AdminPolicyScreen =
  | 'default'
  | 'security-logs'
  | 'admin-permission-approval'
  | 'permission-settings'
  | 'template-management'

export const ADMIN_ACCESS_DENIED_ALERT_TITLE = '접근 권한이 없습니다.'
export const ADMIN_ACCESS_DENIED_ALERT_CONTENT =
  '해당 화면은 권한이 있는 사용자만 이용할 수 있습니다.\n접근이 필요하신 경우 마스터 관리자에게 문의해 주세요.'

export function isAdminAccessDeniedAlert(options: {
  title?: string
  content?: unknown
}): boolean {
  return (
    options.title === ADMIN_ACCESS_DENIED_ALERT_TITLE &&
    options.content === ADMIN_ACCESS_DENIED_ALERT_CONTENT
  )
}

export const SECURITY_LOG_PATHS = [
  '/logs/member-login-history',
  '/logs/file-download-history',
  '/logs/personal-info-access-history',
  '/logs/bug-issue-history',
] as const

const ADMIN_ROLE_CODES: readonly AdminRoleCode[] = [
  'MASTER',
  'ACCOUNTING_MANAGER',
  'PROGRAM_MANAGER',
  'PROGRAM_VIEWER',
  'PM',
  'PARTNER',
  'VIEWER',
]

export function parseAdminRoleCode(value: string | undefined | null): AdminRoleCode | null {
  const raw = (value ?? '').trim()
  if (!raw) return null
  const upper = raw.toUpperCase().replace(/-/g, '_')
  if ((ADMIN_ROLE_CODES as readonly string[]).includes(upper)) {
    return upper as AdminRoleCode
  }
  if (upper === 'ACCOUNTING') return 'ACCOUNTING_MANAGER'
  // 레거시 MIDDLE(중간 관리자) → 정본 Program Manager
  if (upper === 'MIDDLE') return 'PROGRAM_MANAGER'
  return null
}

export function adminRoleCodeToLegacyAdminLevel(roleCode: AdminRoleCode): AdminLevel {
  switch (roleCode) {
    case 'MASTER':
      return 'MASTER'
    case 'ACCOUNTING_MANAGER':
    case 'PROGRAM_MANAGER':
    case 'MIDDLE':
    case 'PM':
    case 'PARTNER':
      return 'ADMIN'
    case 'PROGRAM_VIEWER':
    case 'VIEWER':
      return 'GENERAL'
  }
}

export function resolveAdminRoleCodeFromUser(
  user: Pick<User, 'role' | 'roleCode' | 'adminLevel' | 'listMetrics'> | null | undefined
): AdminRoleCode | null {
  if (!user || user.role !== 'ADMIN') return null
  const parsed = parseAdminRoleCode(user.roleCode)
  if (parsed) return parsed

  const variant = user.listMetrics?.adminPermissionVariant
  if (variant === 'manager') return 'MASTER'
  if (variant === 'accounting') return 'ACCOUNTING_MANAGER'
  if (variant === 'partner') return 'PROGRAM_MANAGER'
  if (variant === 'viewer') return 'PROGRAM_VIEWER'

  if (user.adminLevel === 'MASTER') return 'MASTER'
  if (user.adminLevel === 'GENERAL') return 'PROGRAM_VIEWER'
  if (user.adminLevel === 'ADMIN') return 'PROGRAM_MANAGER'
  return 'PROGRAM_VIEWER'
}

/** 로그인·스토리지 복원 시 역할과 레거시 adminLevel을 맞춘다. MASTER로 올리지 않는다. */
export function withSessionAdminRole(user: Omit<User, 'password'>): Omit<User, 'password'> {
  if (user.role !== 'ADMIN') return user
  const roleCode = resolveAdminRoleCodeFromUser(user) ?? 'PROGRAM_VIEWER'
  return {
    ...user,
    roleCode,
    adminLevel: adminRoleCodeToLegacyAdminLevel(roleCode),
  }
}

export function isSecurityLogPath(pathname: string): boolean {
  const normalized = pathname === '/' ? pathname : pathname.replace(/\/$/, '')
  return SECURITY_LOG_PATHS.some(path => normalized === path || normalized.startsWith(`${path}/`))
}

export function isPermissionSettingsPath(pathname: string): boolean {
  const normalized = pathname === '/' ? pathname : pathname.replace(/\/$/, '')
  return (
    normalized === '/admin/settings/permissions' ||
    normalized.startsWith('/admin/settings/permissions/')
  )
}

export function isProgramManagerPermissionSettingsPath(pathname: string): boolean {
  const normalized = pathname === '/' ? pathname : pathname.replace(/\/$/, '')
  return (
    normalized === '/admin/settings/program-manager-permissions' ||
    normalized.startsWith('/admin/settings/program-manager-permissions/')
  )
}

export function isMemberPermissionSettingsPath(pathname: string): boolean {
  return isPermissionSettingsPath(pathname) || isProgramManagerPermissionSettingsPath(pathname)
}

export function isPermissionRequestsPath(pathname: string): boolean {
  const normalized = pathname === '/' ? pathname : pathname.replace(/\/$/, '')
  return (
    normalized === '/admin/permission-requests' ||
    normalized.startsWith('/admin/permission-requests/')
  )
}

/** 템플릿 관리(`/templates`, form-management·레거시 program-forms 등) */
export function isTemplateManagementPath(pathname: string): boolean {
  const normalized = pathname === '/' ? pathname : pathname.replace(/\/$/, '')
  return normalized === '/templates' || normalized.startsWith('/templates/')
}

export function resolveAdminPolicyScreen(pathname: string | undefined): AdminPolicyScreen {
  if (!pathname) return 'default'
  const normalized = pathname === '/' ? pathname : pathname.replace(/\/$/, '')
  if (isSecurityLogPath(normalized)) return 'security-logs'
  if (isMemberPermissionSettingsPath(normalized)) {
    return 'permission-settings'
  }
  if (isPermissionRequestsPath(normalized)) {
    return 'admin-permission-approval'
  }
  if (isTemplateManagementPath(normalized)) {
    return 'template-management'
  }
  return 'default'
}

export function canAdminAction(input: {
  roleCode?: AdminRoleCode | null
  action: AdminActionKind
  screen?: AdminPolicyScreen
  pathname?: string
}): boolean {
  const roleCode = parseAdminRoleCode(input.roleCode) ?? input.roleCode ?? null
  const screen = input.screen ?? resolveAdminPolicyScreen(input.pathname)

  if (roleCode == null) {
    return (
      input.action === 'view' &&
      screen !== 'security-logs' &&
      screen !== 'permission-settings' &&
      screen !== 'admin-permission-approval' &&
      screen !== 'template-management'
    )
  }

  switch (input.action) {
    case 'view':
      if (screen === 'security-logs') return roleCode === 'MASTER'
      // 관리자 권한 설정·회원 권한 승인·템플릿 관리: 뷰어는 화면 조회 자체 불가
      if (
        screen === 'permission-settings' ||
        screen === 'admin-permission-approval' ||
        screen === 'template-management'
      ) {
        return !isReadOnlyAdminRoleCode(roleCode)
      }
      return true
    case 'write':
    case 'delete':
    case 'send':
    case 'download':
      return !isReadOnlyAdminRoleCode(roleCode)
    case 'dashboardWrite':
      // DASHBOARD_WRITE: 본인 레이아웃·설정만. PROGRAM_WRITE와 묶지 않음.
      // 레거시 PARTNER는 서버 미부여. 정본 ACCOUNTING/PROGRAM_MANAGER·PM·뷰어는 허용.
      return (
        roleCode === 'MASTER' ||
        roleCode === 'ACCOUNTING_MANAGER' ||
        roleCode === 'PROGRAM_MANAGER' ||
        roleCode === 'PM' ||
        isReadOnlyAdminRoleCode(roleCode)
      )
    case 'sponsorContactWrite':
      // 후원사 상세 > 담당자 목록 CRUD: VIEWER는 조회만.
      return !isReadOnlyAdminRoleCode(roleCode)
    case 'sponsorWrite':
      // 후원사 기본정보·후원상태 수정: VIEWER는 조회만.
      // 엑셀 다운로드와 후원사 삭제는 각각 download/delete 정책으로 별도 판정.
      return !isReadOnlyAdminRoleCode(roleCode)
    case 'approve':
      if (screen === 'admin-permission-approval' || screen === 'permission-settings') {
        return roleCode === 'MASTER'
      }
      return !isReadOnlyAdminRoleCode(roleCode)
    case 'pii':
      return !isReadOnlyAdminRoleCode(roleCode)
    case 'piiRrn':
    case 'piiAccount':
      return roleCode === 'MASTER' || isCmsOperableProgramOwnerRole(roleCode)
  }
}

/**
 * React Router가 남긴 `history.state.idx`.
 * 브라우저 `history.length`는 다른 사이트 방문까지 포함하므로 전체 페이지 로드에서 -1 하면 SPA가 내려간다.
 */
export function canNavigateBackInAppHistory(historyState: unknown): boolean {
  if (!historyState || typeof historyState !== 'object') return false
  const idx = (historyState as { idx?: unknown }).idx
  return typeof idx === 'number' && Number.isInteger(idx) && idx > 0
}

export function showAdminAccessDeniedAlert(options?: { onConfirm?: () => void }): boolean {
  if (isAdminFirstLoginOnboardingIncomplete()) return false
  cmsAlertModal.show({
    title: ADMIN_ACCESS_DENIED_ALERT_TITLE,
    content: ADMIN_ACCESS_DENIED_ALERT_CONTENT,
    onConfirm: options?.onConfirm,
  })
  return true
}

export function guardAdminAction(input: {
  roleCode?: AdminRoleCode | null
  action: AdminActionKind
  screen?: AdminPolicyScreen
  pathname?: string
}): boolean {
  if (isAdminSessionRoleSyncPending()) return false
  if (canAdminAction(input)) return true
  showAdminAccessDeniedAlert()
  return false
}

type DomClickEvent = {
  target: EventTarget | null
  preventDefault: () => void
  stopPropagation: () => void
  nativeEvent?: { stopImmediatePropagation?: () => void }
}

function isInteractiveClickTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (target.closest('.excel-button, .filter-table-layout__toolbar-excel')) return false
  return Boolean(target.closest('button, a[href], [role="button"]'))
}

function stopDeniedClick(event: DomClickEvent): void {
  event.preventDefault()
  event.stopPropagation()
  event.nativeEvent?.stopImmediatePropagation?.()
}

/** false면 허용. true면 이미 차단·알림 처리됨. */
export function denyAdminActionEvent(
  event: DomClickEvent,
  input: {
    roleCode?: AdminRoleCode | null
    action: AdminActionKind
    screen?: AdminPolicyScreen
    pathname?: string
  }
): boolean {
  if (canAdminAction(input)) return false
  stopDeniedClick(event)
  showAdminAccessDeniedAlert()
  return true
}

/** 목록 툴바·상세 헤더 등 공유 액션 영역의 클릭을 write로 가로챈다. */
export function onAdminWriteClickCapture(
  event: DomClickEvent,
  roleCode?: AdminRoleCode | null,
  action: AdminActionKind = 'write'
): void {
  if (!isInteractiveClickTarget(event.target)) return
  denyAdminActionEvent(event, { roleCode, action })
}
