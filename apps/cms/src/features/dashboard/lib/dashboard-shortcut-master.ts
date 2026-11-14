import { getSessionAdminRoleCode } from '@/shared/lib/session-admin-role'
import { isCmsMasterAdminRole } from '@/shared/lib/cms-global-role-code'
import type { DashboardShortcutSessionOptions } from '@/features/dashboard/model/dashboard-shortcut-contract'

/**
 * 대시보드 바로가기 설정 비활성 6건을 설정할 수 있는 마스터 세션인지 — 기존 세션 역할 판정을 재사용한다.
 * 실행 시점에만 세션을 읽는다(모듈 평가 중 호출 금지 — auth-store 순환 import).
 */
export function isDashboardShortcutMasterSession(): boolean {
  return isCmsMasterAdminRole(getSessionAdminRoleCode())
}

export function sessionDashboardShortcutOptions(): DashboardShortcutSessionOptions {
  return { isMaster: isDashboardShortcutMasterSession() }
}
