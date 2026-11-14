import type {
  PortalOrganizationPortraitConsent,
  PortalStudentDocumentPolicy,
} from '../api/student-documents-types'
import { hasOrganizationPortraitConsentSubmission } from './student-documents-display'

export const STUDENT_DOCUMENTS_UNSUPPORTED_MESSAGE =
  '이 프로그램은 학생 명단 및 초상권 동의서 제출 대상이 아닙니다.'

export function isPortalStudentDocumentsSupported(
  policy: PortalStudentDocumentPolicy | null | undefined,
): boolean {
  return policy?.studentDocumentsSupported === true
}

export function isPortalStudentDocumentsUnsupported(
  policy: PortalStudentDocumentPolicy | null | undefined,
): boolean {
  return policy?.studentDocumentsSupported === false
}

/** 교사 교육현황 — 학생 명단(·출석 관리) 탭 노출. `GET .../student-documents/policy` SSOT */
export function shouldShowTeacherStudentDocumentDependentTabs(
  policy: PortalStudentDocumentPolicy | null | undefined,
  options: { policyQueryEnabled: boolean; policyLoading: boolean; policyError?: boolean },
): boolean {
  if (
    !options.policyQueryEnabled ||
    options.policyLoading ||
    options.policyError ||
    policy == null
  ) {
    return false
  }
  return isPortalStudentDocumentsSupported(policy)
}

/** 「업로드 취소」: 현재 제출 있음 + 기한 내(`portraitConsentUploadAllowed === true`) + 미승인 */
export function canCancelOrganizationPortraitConsent(
  consent: PortalOrganizationPortraitConsent | null | undefined,
  policy: PortalStudentDocumentPolicy | null | undefined,
): boolean {
  if (!hasOrganizationPortraitConsentSubmission(consent)) return false
  if (policy?.portraitConsentUploadAllowed !== true) return false
  return consent?.status?.trim().toUpperCase() !== 'APPROVED'
}

export function resolveRosterUploadBlockedMessage(
  policy: PortalStudentDocumentPolicy | null | undefined,
): string | null {
  if (!isPortalStudentDocumentsSupported(policy)) return null
  if (policy?.studentRosterUploadAllowed !== false) return null
  if (!policy.firstEducationDate?.trim()) {
    return '교육 일정이 배정되면 학생 명단을 제출할 수 있습니다.'
  }
  return '학생 명단은 해당 기관의 첫 교육일 6일 전까지만 업로드·수정할 수 있어요.'
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
