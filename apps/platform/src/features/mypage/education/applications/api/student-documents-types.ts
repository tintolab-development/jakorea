/** Portal organization application — student roster & portrait consent (OpenAPI SSOT) */

export type PortalStudentRosterItem = {
  rosterId?: number
  memberId?: number | null
  studentName?: string
  gender?: string
  birthDate?: string
  grade?: string | null
  className?: string | null
  studentNo?: number | null
  /** 소유 기관 Portal 조회에서만 원문. 화면 표시는 maskedPhone/maskedEmail 기준 */
  phone?: string | null
  email?: string | null
  maskedPhone?: string | null
  maskedEmail?: string | null
  notes?: string | null
  participantId?: number | null
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

/**
 * PUT .../student-roster 요청.
 * phone·email은 신규 행만 필수. 기존 행(rosterId 또는 natural key 매칭)은 생략·null이면 저장된 값을 유지하며,
 * 조회 응답의 maskedPhone/maskedEmail을 넣으면 형식 검증에 걸린다.
 */
export type PortalStudentRosterRowRequest = {
  rosterId?: number | null
  studentName: string
  gender: string
  birthDate: string
  className: string
  phone?: string | null
  email?: string | null
  grade?: string | null
  studentNo?: number | null
  notes?: string | null
}

export type PortalStudentRosterCommitRequest = {
  sourceFileObjectId?: number | null
  expectedRevisionNo?: number | null
  rows: PortalStudentRosterRowRequest[]
}

export type PortalStudentDocumentPolicy = {
  organizationApplicationId?: number
  programId?: number
  /** false — 명단·초상권 Portal 기능 미지원 프로그램 */
  studentDocumentsSupported?: boolean
  programStartDate?: string | null
  /** 기관 신청에 배정된 첫 교육일. 미배정 시 null */
  firstEducationDate?: string | null
  studentRosterUploadDeadline?: string | null
  studentRosterUploadAllowed?: boolean
  portraitConsentUploadDeadline?: string | null
  portraitConsentUploadAllowed?: boolean
}

/** OpenAPI `PortraitConsentResponse` — GET 빈 본문(미제출·취소)은 null로 정규화합니다. */
export type PortalOrganizationPortraitConsent = {
  artifactId?: number
  organizationApplicationId?: number
  programId?: number
  fileObjectId?: number
  originalFileName?: string | null
  /** byte */
  fileSize?: number | null
  updatedAt?: string | null
  /** SUBMITTED | APPROVED | REJECTED */
  status?: string
  revisionNo?: number
  submittedByMemberId?: number
  submittedByAdminId?: number
  submittedAt?: string
  reviewedByAdminId?: number
  reviewedAt?: string
  rejectReason?: string
}

/**
 * OpenAPI `PortalCertificateBulkDownloadRequest` (operationId `downloadPortalStudentCertificateZip`)
 * rosterIds: minItems 1 · maxItems 100 · 현재 기관 신청 roster의 rosterId
 */
export type PortalCertificateBulkDownloadRequest = {
  rosterIds: number[]
  certificateType: 'COMPLETION'
}

export const PORTAL_FILE_PURPOSE_STUDENT_ROSTER = 'STUDENT_ROSTER'
export const PORTAL_FILE_PURPOSE_PORTRAIT_CONSENT = 'PORTRAIT_CONSENT'
