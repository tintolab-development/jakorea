import { isAccountingManagerRoleCode } from '@/shared/lib/account-payments-access'
import {
  isCmsMasterAdminRole,
  isCmsOperableProgramOwnerRole,
  isCmsViewerAdminRole,
  normalizeCmsGlobalRoleCode,
} from '@/shared/lib/cms-global-role-code'

/**
 * 운영 정책 4-3 — 성범죄·행정정보 동의서 열람·다운로드.
 * Master와 해당 프로그램 Program Owner만. Accounting Manager·Viewer는 동의 상태만.
 */
export function canDownloadSensitiveConsentFile(input: {
  roleCode?: string | null
  /** 프로그램 맥락. false면 거부. 미지정 시 Program Manager는 허용, Partner는 거부. */
  isProgramOwner?: boolean | null
}): boolean {
  if (isCmsMasterAdminRole(input.roleCode)) return true
  if (isAccountingManagerRoleCode(input.roleCode)) return false
  if (isCmsViewerAdminRole(input.roleCode)) return false
  if (input.isProgramOwner === false) return false

  const role = normalizeCmsGlobalRoleCode(input.roleCode)
  if (role === 'PARTNER') return input.isProgramOwner === true
  return isCmsOperableProgramOwnerRole(input.roleCode)
}

export function isProgramOwnerAssignmentRole(assignmentRole?: string | null): boolean {
  return assignmentRole?.trim().toUpperCase() === 'PM'
}
