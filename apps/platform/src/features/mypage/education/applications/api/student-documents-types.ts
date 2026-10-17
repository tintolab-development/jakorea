/** Portal organization application — student roster & portrait consent (OpenAPI SSOT) */

export type PortalStudentRosterItem = {
  rosterId?: number
  memberId?: number | null
  studentName?: string
  gender?: string
  birthDate?: string
  grade?: string
  className?: string
  studentNo?: number
  maskedPhone?: string | null
  maskedEmail?: string | null
  notes?: string | null
  participantId?: number
  revisionNo?: number
  portraitConsentId?: number | null
  portraitConsentStatus?: string
  portraitConsentSourceArtifactId?: number | null
  portraitConsentUpdatedAt?: string | null
  portraitConsentFileObjectId?: number | null
  satisfactionSurveyCompleted?: boolean | null
}

export type PortalStudentRosterResponse = {
  organizationApplicationId?: number
  programId?: number
  importBatchId?: number | null
  importStatus?: string
  revisionNo?: number
  sourceFileObjectId?: number | null
  totalCount?: number
  committedAt?: string | null
  rows?: PortalStudentRosterItem[]
}

export type PortalStudentDocumentPolicy = {
  organizationApplicationId?: number
  programId?: number
  /** false — 명단·초상권 Portal 기능 미지원 프로그램 */
  studentDocumentsSupported?: boolean
  programStartDate?: string
  /** 기관 신청에 배정된 첫 교육일. 미배정 시 null */
  firstEducationDate?: string | null
  studentRosterUploadDeadline?: string | null
  studentRosterUploadAllowed?: boolean
  portraitConsentUploadDeadline?: string | null
  portraitConsentUploadAllowed?: boolean
}

export type PortalOrganizationPortraitConsent = {
  artifactId?: number
  organizationApplicationId?: number
  programId?: number
  fileObjectId?: number
  status?: string
  revisionNo?: number
  submittedByMemberId?: number
  submittedByAdminId?: number
  submittedAt?: string
  reviewedByAdminId?: number
  reviewedAt?: string
  rejectReason?: string
}

export const PORTAL_FILE_PURPOSE_STUDENT_ROSTER = 'STUDENT_ROSTER'
export const PORTAL_FILE_PURPOSE_PORTRAIT_CONSENT = 'PORTRAIT_CONSENT'
