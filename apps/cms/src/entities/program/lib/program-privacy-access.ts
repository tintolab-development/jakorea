import type { ProgramRole } from '@/types/user'
import { useAuthStore } from '@/features/auth/model/auth-store'

export type ProgramPrivacyField = 'general' | 'rrn' | 'account'

/**
 * 프로그램 상세 원문. 전역 roleCode로 부여하지 않는다.
 * - 일반 개인정보: 해당 프로그램 PM(OWNER) 또는 PARTNER
 * - 주민번호·계좌: 해당 프로그램 PM만
 * - VIEWER(ASSISTANT)와 역할 없음: 불가
 */
export function canRevealProgramPrivacy(
  programRole: ProgramRole | null | undefined,
  field: ProgramPrivacyField
): boolean {
  if (programRole === 'OWNER') return true
  if (programRole === 'PARTNER') return field === 'general'
  return false
}

/**
 * 담당자 목록에서 로그인 관리자 본인 역할만 고른다.
 * `adminId === adminAccountId`만 비교한다. 이름·이메일·전역 역할로는 역할을 만들지 않는다.
 * 본인 행이 없거나 둘 이상이면 원문 불가로 닫는다.
 */
export function findMyProgramRole(
  rows: ReadonlyArray<{ adminId?: number | null; role?: string | null }>,
  adminAccountId: number | null | undefined,
  mapRole: (role: string | null | undefined) => ProgramRole | null
): ProgramRole | null {
  if (typeof adminAccountId !== 'number' || !Number.isSafeInteger(adminAccountId)) return null
  const matches = rows.filter(row => row.adminId === adminAccountId)
  if (matches.length !== 1) return null
  return mapRole(matches[0]?.role)
}

export function resolveSessionProgramRole(
  programId: string | number | null | undefined
): ProgramRole | null {
  const id = programId == null ? '' : String(programId).trim()
  if (!id) return null
  const role = useAuthStore.getState().user?.programRoles?.[id]
  if (role === 'OWNER' || role === 'PARTNER' || role === 'ASSISTANT') return role
  return null
}
