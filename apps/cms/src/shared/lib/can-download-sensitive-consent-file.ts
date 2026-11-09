import {
  isCmsMasterAdminRole,
  isCmsOperableProgramOwnerRole,
  isCmsViewerAdminRole,
} from '@/shared/lib/cms-global-role-code'

/**
 * 권한 설정 V1.2 원칙 9 — 성범죄경력 조회 동의서·행정정보 공동이용 사전동의서(주민등록번호 포함) 열람·다운로드.
 * - Master: 항상 허용
 * - CMS 기본 화면(회원 상세 등, 프로그램 맥락 없음): Master만
 * - 담당 프로그램 상세: 해당 프로그램 Program Owner(Accounting Manager·Program Manager)만
 * - Program Assistant·Program Viewer(프로그램 상세)·Program Viewer(CMS 기본): 동의 상태만 조회
 */
export function canDownloadSensitiveConsentFile(input: {
  roleCode?: string | null
  /** 프로그램 상세 맥락에서 로그인 관리자가 해당 프로그램 Program Owner인지. 미지정이면 CMS 기본 화면으로 본다. */
  isProgramOwner?: boolean | null
}): boolean {
  if (isCmsMasterAdminRole(input.roleCode)) return true
  if (isCmsViewerAdminRole(input.roleCode)) return false
  if (!isCmsOperableProgramOwnerRole(input.roleCode)) return false
  return input.isProgramOwner === true
}

export function isProgramOwnerAssignmentRole(assignmentRole?: string | null): boolean {
  return assignmentRole?.trim().toUpperCase() === 'PM'
}
