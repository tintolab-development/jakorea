import type { SchoolDetailStudentRow } from '../model/school-detail-types'

/** 동의 양식 템플릿 — `agreement-portrait` (초상권 수집·이용 동의서) */
export const PORTRAIT_CONSENT_AGREEMENT_TEMPLATE_ID = 'agreement-portrait' as const

export const PORTRAIT_CONSENT_DOCUMENT_TITLE = '초상권 수집·이용 동의서'

export interface StudentPortraitConsentSubmission {
  templateId: typeof PORTRAIT_CONSENT_AGREEMENT_TEMPLATE_ID
  /** 교사(담당자) 제출 일시 */
  submittedAt: string
}

export function hasStudentPortraitConsentSubmission(
  row: Pick<SchoolDetailStudentRow, 'portraitConsentSubmission'>
): boolean {
  return (
    row.portraitConsentSubmission?.templateId === PORTRAIT_CONSENT_AGREEMENT_TEMPLATE_ID &&
    Boolean(row.portraitConsentSubmission.submittedAt?.trim())
  )
}
