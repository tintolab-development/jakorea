/**
 * CMS 전역 admin roleCode 분류 — 읽기 별칭 SSOT.
 * 쓰기 정본은 N-16 4종(MASTER / ACCOUNTING_MANAGER / PROGRAM_MANAGER / PROGRAM_VIEWER).
 * 응답은 DB 원문(MIDDLE / VIEWER / PM / PARTNER)일 수 있다.
 */

export function normalizeCmsGlobalRoleCode(roleCode: string | undefined | null): string {
  return (roleCode ?? '').trim().toUpperCase().replace(/-/g, '_')
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
