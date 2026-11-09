/**
 * React/비React 공통 세션 역할 조회 및 다운로드 가드.
 * auth-store ↔ admin-role-policy 순환 import 방지를 위해 분리.
 */

import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  guardAdminAction,
  resolveAdminRoleCodeFromUser,
  type AdminActionKind,
  type AdminRoleCode,
} from '@/shared/lib/admin-role-policy'
import type { User } from '@/types/user'

export function getSessionAdminRoleCode(): AdminRoleCode | null {
  return resolveAdminRoleCodeFromUser(useAuthStore.getState().user)
}

/** false면 차단됨(알림 표시됨). */
export function guardAdminDownload(options?: {
  roleCode?: AdminRoleCode | null
  /** 기본 `download`. 관리자 목록처럼 Master 전용 다운로드는 `adminAccountManage`. */
  action?: AdminActionKind
}): boolean {
  const roleCode = options?.roleCode ?? getSessionAdminRoleCode()
  return guardAdminAction({ roleCode, action: options?.action ?? 'download' })
}

/** 테스트·스토어 미초기화 시 localStorage auth_user fallback */
export function resolveAdminRoleCodeFromStorage(): AdminRoleCode | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  const raw = window.localStorage.getItem('auth_user')
  if (!raw) return null
  try {
    const user = JSON.parse(raw) as Pick<User, 'role' | 'roleCode' | 'adminLevel' | 'listMetrics'>
    return resolveAdminRoleCodeFromUser(user)
  } catch {
    return null
  }
}
