import type { PortraitConsentResponse } from '@/shared/api/generated/dashboard/schemas/portraitConsentResponse'
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
  row: Pick<SchoolDetailStudentRow, 'portraitConsentSubmission' | 'portraitConsentFileObjectId'>
): boolean {
  if (row.portraitConsentFileObjectId != null && row.portraitConsentFileObjectId > 0) {
    return true
  }
  return (
    row.portraitConsentSubmission?.templateId === PORTRAIT_CONSENT_AGREEMENT_TEMPLATE_ID &&
    Boolean(row.portraitConsentSubmission.submittedAt?.trim())
  )
}

/** 기관 단위 제출 1건. 학생 행·테이블 체크와 무관. */
export function resolveOrganizationPortraitConsentDownload(
  consent: PortraitConsentResponse | null | undefined
): { fileObjectId: number; fileName: string } | null {
  const fileObjectId = consent?.fileObjectId
  if (typeof fileObjectId !== 'number' || !Number.isFinite(fileObjectId) || fileObjectId <= 0) {
    return null
  }
  const original = consent?.originalFileName?.trim()
  return {
    fileObjectId,
    fileName: original || '초상권동의서',
  }
}
