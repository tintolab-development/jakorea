import type { GeminiInstitutionApprovalStatus } from '../model/recruitment/institution-application-types'
import type { GeminiInstructorApplicationApprovalStatus } from '../model/approved/instructor-application-types'

/** 기관 승인과 강사 승인은 서로 다른 업무축. 현행 문구·승인색 차이를 명시적으로 보존한다. */
export const GEMINI_INSTITUTION_APPROVAL_STATUS_LABEL: Record<GeminiInstitutionApprovalStatus, string> = {
  PENDING: '승인 대기', APPROVED: '승인', REJECTED: '신청 반려',
}
export const GEMINI_INSTRUCTOR_APPROVAL_STATUS_LABEL: Record<GeminiInstructorApplicationApprovalStatus, string> = {
  PENDING: '승인 대기', APPROVED: '승인 완료', REJECTED: '신청 반려', UNKNOWN: '상태 확인 필요',
}
const INSTITUTION_ACCENT: Record<GeminiInstitutionApprovalStatus, string> = {
  PENDING: 'var(--color-green, #1e8c29)',
  APPROVED: 'var(--Brand-500, #00a0af)',
  REJECTED: 'var(--Status-red-main, #c32f4a)',
}
const INSTRUCTOR_ACCENT: Record<GeminiInstructorApplicationApprovalStatus, string> = {
  PENDING: 'var(--color-green, #1e8c29)',
  APPROVED: 'var(--color-blue, #017eaf)',
  REJECTED: 'var(--color-red, #c32f4a)',
  UNKNOWN: 'var(--color-text-secondary, #8c8c8c)',
}
export function getGeminiInstitutionApprovalStatusPresentation(status: GeminiInstitutionApprovalStatus) {
  return { label: GEMINI_INSTITUTION_APPROVAL_STATUS_LABEL[status], accentColor: INSTITUTION_ACCENT[status] }
}
export function getGeminiInstructorApprovalStatusPresentation(status: GeminiInstructorApplicationApprovalStatus) {
  return { label: GEMINI_INSTRUCTOR_APPROVAL_STATUS_LABEL[status], accentColor: INSTRUCTOR_ACCENT[status] }
}
