import type { StudentCertificateKind } from './resolve-student-certificate-kind'

/**
 * 양식 관리 > 발급 양식 탭 인증서 템플릿명과 동일 (`issuance-form-tab`, `a4-preview-template-options`)
 * - 수료증: `document-3`
 * - 참가인증서: `document-participation-certificate` (동일 FormCertificatePreview 레이아웃)
 */
export const STUDENT_COMPLETION_CERTIFICATE_TEMPLATE_KEY = 'document-3' as const
export const STUDENT_PARTICIPATION_CERTIFICATE_TEMPLATE_KEY =
  'document-participation-certificate' as const

export const STUDENT_CERTIFICATE_ISSUANCE_TEMPLATE_NAME: Record<StudentCertificateKind, string> = {
  completion: '수료증',
  participation: '참가인증서',
}

export function resolveStudentCertificateTemplateName(kind: StudentCertificateKind): string {
  return STUDENT_CERTIFICATE_ISSUANCE_TEMPLATE_NAME[kind]
}

export function resolveStudentCertificateTemplateKey(kind: StudentCertificateKind): string {
  return kind === 'completion'
    ? STUDENT_COMPLETION_CERTIFICATE_TEMPLATE_KEY
    : STUDENT_PARTICIPATION_CERTIFICATE_TEMPLATE_KEY
}
