import type { PortalStudentDocumentPolicy } from '../api/student-documents-types'

export const STUDENT_DOCUMENTS_UNSUPPORTED_MESSAGE =
  '이 프로그램은 학생 명단 및 초상권 동의서 제출 대상이 아닙니다.'

export function isPortalStudentDocumentsSupported(
  policy: PortalStudentDocumentPolicy | null | undefined,
): boolean {
  if (policy?.studentDocumentsSupported === false) return false
  if (policy?.studentDocumentsSupported === true) return true
  // BE 배포 전 policy(필드 없음) — 기존 화면 유지, import 실패는 error.code로 안내
  return policy != null
}

export function isPortalStudentDocumentsUnsupported(
  policy: PortalStudentDocumentPolicy | null | undefined,
): boolean {
  return policy?.studentDocumentsSupported === false
}

/** 교사 교육현황 — 학생 명단(·출석 관리) 탭 노출. `GET .../student-documents/policy` SSOT */
export function shouldShowTeacherStudentDocumentDependentTabs(
  policy: PortalStudentDocumentPolicy | null | undefined,
  options: { policyQueryEnabled: boolean; policyLoading: boolean },
): boolean {
  if (!options.policyQueryEnabled) {
    return true
  }
  if (options.policyLoading || policy == null) {
    return false
  }
  return !isPortalStudentDocumentsUnsupported(policy)
}

/** `studentDocumentsSupported === true`일 때만 호출 */
export function resolveRosterUploadBlockedMessage(
  policy: PortalStudentDocumentPolicy | null | undefined,
): string | null {
  if (!isPortalStudentDocumentsSupported(policy)) return null
  if (policy?.studentRosterUploadAllowed !== false) return null
  if (!policy.firstEducationDate?.trim()) {
    return '교육 일정이 배정되면 학생 명단을 제출할 수 있습니다.'
  }
  return '학생 명단 제출 및 수정 기한이 지났습니다.'
}

export function resolvePortraitUploadBlockedMessage(
  policy: PortalStudentDocumentPolicy | null | undefined,
): string | null {
  if (!isPortalStudentDocumentsSupported(policy)) return null
  if (policy?.portraitConsentUploadAllowed !== false) return null
  if (!policy.firstEducationDate?.trim()) {
    return '교육 일정이 배정되면 초상권 동의서를 제출할 수 있습니다.'
  }
  return '초상권 동의서 제출 및 수정 기한이 지났습니다.'
}
