/**
 * CMS 전역 admin roleCode 분류 — 읽기 별칭 SSOT.
 * 쓰기 정본은 N-16 4종(MASTER / ACCOUNTING_MANAGER / PROGRAM_MANAGER / PROGRAM_VIEWER).
 * 응답은 DB 원문(MIDDLE / VIEWER / PM / PARTNER)일 수 있다.
 */

export function normalizeCmsGlobalRoleCode(roleCode: string | undefined | null): string {
  return (roleCode ?? '').trim().toUpperCase().replace(/-/g, '_')
}

export type CmsGlobalAdminRole =
  | 'MASTER'
  | 'ACCOUNTING_MANAGER'
  | 'PROGRAM_MANAGER'
  | 'PROGRAM_VIEWER'

/**
 * 전역(어드민 기본) 역할만 정본 4종으로 해석한다. 레거시 전역 별칭(ACCOUNTING·MIDDLE·VIEWER)은 정본으로 바꾼다.
 * PM(현 Program Owner)·PARTNER(현 Program Assistant)는 V1.2 이전 프로그램 역할 코드라 전역 역할이 아니므로 null.
 */
export function resolveCmsGlobalAdminRole(
  roleCode: string | undefined | null
): CmsGlobalAdminRole | null {
  switch (normalizeCmsGlobalRoleCode(roleCode)) {
    case 'MASTER':
      return 'MASTER'
    case 'ACCOUNTING_MANAGER':
    case 'ACCOUNTING':
      return 'ACCOUNTING_MANAGER'
    case 'PROGRAM_MANAGER':
    case 'MIDDLE':
      return 'PROGRAM_MANAGER'
    case 'PROGRAM_VIEWER':
    case 'VIEWER':
      return 'PROGRAM_VIEWER'
    default:
      return null
  }
}

/** 권한 설정 V1.2 계좌 지급 확인(메뉴·처리·대량이체·세금신고 양식): Master·Accounting Manager 전용 */
export function isCmsAccountPaymentsAdminRole(roleCode: string | undefined | null): boolean {
  const role = resolveCmsGlobalAdminRole(roleCode)
  return role === 'MASTER' || role === 'ACCOUNTING_MANAGER'
}

/** 권한 설정 V1.2 '회원 기본 개인정보 확인': Master·Accounting Manager·Program Manager(전역 역할 기준) */
export function isCmsMemberPiiAdminRole(roleCode: string | undefined | null): boolean {
  const role = resolveCmsGlobalAdminRole(roleCode)
  return role === 'MASTER' || role === 'ACCOUNTING_MANAGER' || role === 'PROGRAM_MANAGER'
}

export function isCmsViewerAdminRole(roleCode: string | undefined | null): boolean {
  const upper = normalizeCmsGlobalRoleCode(roleCode)
  return upper === 'VIEWER' || upper === 'PROGRAM_VIEWER'
}

export function isCmsMasterAdminRole(roleCode: string | undefined | null): boolean {
  return normalizeCmsGlobalRoleCode(roleCode) === 'MASTER'
}

/** PM/PARTNER 배정 가능한 전역 역할 + 로컬 레거시 MIDDLE·PM·PARTNER */
export function isCmsOperableProgramOwnerRole(roleCode: string | undefined | null): boolean {
  const upper = normalizeCmsGlobalRoleCode(roleCode)
  return (
    upper === 'ACCOUNTING_MANAGER' ||
    upper === 'PROGRAM_MANAGER' ||
    upper === 'MIDDLE' ||
    upper === 'PM' ||
    upper === 'PARTNER'
  )
}

export const isCmsRoleEligibleProgramOwner = isCmsOperableProgramOwnerRole

export function isCmsRoleForbiddenProgramOwner(roleCode: string | undefined | null): boolean {
  return isCmsMasterAdminRole(roleCode) || isCmsViewerAdminRole(roleCode)
}
