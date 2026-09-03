/**
 * CMS 관리자 4역할(MASTER / PM / PARTNER / VIEWER) 화면 가드.
 * 메뉴·버튼은 숨기지 않고, 차단 시 AlertModal만 띄운다.
 */

import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import type { AdminLevel, AdminRoleCode, User } from '@/types/user'

export type { AdminRoleCode }

export type AdminActionKind =
  | 'view'
  | 'write'
  | 'delete'
  | 'approve'
  | 'send'
  | 'download'
  | 'pii'
  | 'piiRrn'
  | 'piiAccount'

export type AdminPolicyScreen =
  | 'default'
  | 'security-logs'
  | 'admin-permission-approval'
  | 'permission-settings'

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

const ADMIN_ROLE_CODES: readonly AdminRoleCode[] = ['MASTER', 'PM', 'PARTNER', 'VIEWER']

export function parseAdminRoleCode(value: string | undefined | null): AdminRoleCode | null {
  const upper = (value ?? '').trim().toUpperCase()
  if ((ADMIN_ROLE_CODES as readonly string[]).includes(upper)) {
    return upper as AdminRoleCode
  }
  return null
}

export function adminRoleCodeToLegacyAdminLevel(roleCode: AdminRoleCode): AdminLevel {
  switch (roleCode) {
    case 'MASTER':
      return 'MASTER'
    case 'PM':
    case 'PARTNER':
      return 'ADMIN'
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
  if (variant === 'partner') return 'PARTNER'
  if (variant === 'viewer') return 'VIEWER'

  if (user.adminLevel === 'MASTER') return 'MASTER'
  if (user.adminLevel === 'GENERAL') return 'VIEWER'
  if (user.adminLevel === 'ADMIN') return 'PARTNER'
  return 'VIEWER'
}

/** 로그인·스토리지 복원 시 4역할과 레거시 adminLevel을 맞춘다. MASTER로 올리지 않는다. */
export function withSessionAdminRole(user: Omit<User, 'password'>): Omit<User, 'password'> {
  if (user.role !== 'ADMIN') return user
  const roleCode = resolveAdminRoleCodeFromUser(user) ?? 'VIEWER'
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

export function resolveAdminPolicyScreen(pathname: string | undefined): AdminPolicyScreen {
  if (!pathname) return 'default'
  const normalized = pathname === '/' ? pathname : pathname.replace(/\/$/, '')
  if (isSecurityLogPath(normalized)) return 'security-logs'
  if (isPermissionSettingsPath(normalized)) {
    return 'permission-settings'
  }
  return 'default'
}

export function canAdminAction(input: {
  roleCode?: AdminRoleCode | null
  action: AdminActionKind
  screen?: AdminPolicyScreen
  pathname?: string
}): boolean {
  const roleCode = input.roleCode ?? null
  const screen = input.screen ?? resolveAdminPolicyScreen(input.pathname)

  if (roleCode == null) {
    return (
      input.action === 'view' && screen !== 'security-logs' && screen !== 'permission-settings'
    )
  }

  switch (input.action) {
    case 'view':
      if (screen === 'security-logs') return roleCode === 'MASTER'
      // 관리자 권한 설정: 뷰어는 화면 조회 자체 불가 (메뉴 클릭 시 권한 없음 모달)
      if (screen === 'permission-settings') return roleCode !== 'VIEWER'
      return true
    case 'write':
    case 'delete':
    case 'send':
    case 'download':
      return roleCode !== 'VIEWER'
    case 'approve':
      if (screen === 'admin-permission-approval' || screen === 'permission-settings') {
        return roleCode === 'MASTER'
      }
      return roleCode !== 'VIEWER'
    case 'pii':
      return roleCode !== 'VIEWER'
    case 'piiRrn':
    case 'piiAccount':
      return roleCode === 'MASTER' || roleCode === 'PM'
  }
}

export function showAdminAccessDeniedAlert(): void {
  cmsAlertModal.show({
    title: ADMIN_ACCESS_DENIED_ALERT_TITLE,
    content: ADMIN_ACCESS_DENIED_ALERT_CONTENT,
  })
}

export function guardAdminAction(input: {
  roleCode?: AdminRoleCode | null
  action: AdminActionKind
  screen?: AdminPolicyScreen
  pathname?: string
}): boolean {
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
  roleCode?: AdminRoleCode | null
): void {
  if (!isInteractiveClickTarget(event.target)) return
  denyAdminActionEvent(event, { roleCode, action: 'write' })
}
