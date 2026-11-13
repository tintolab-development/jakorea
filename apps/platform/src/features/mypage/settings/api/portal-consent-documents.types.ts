/** CMS `MemberPortalConsentDocumentCreateRequest` — Portal POST /me/consents/documents */
export type PortalConsentDocumentCreateRequest = {
  consentType: string
  targetType?: string
  targetId?: number
}

/** CMS `MemberPortalConsentDocumentResponse` */
export type PortalConsentSignatureField = {
  fieldId?: number
  fieldKey?: string
  fieldLabel?: string
  displayOrder?: number
  required?: boolean
  signed?: boolean
  signatureProfileId?: number
  signatureFileObjectId?: number
  signedAt?: string
}

/** CMS `MemberPortalConsentEvent` — 문서 상태 전이 이력 */
export type PortalConsentDocumentEvent = {
  eventId?: number
  eventType?: string
  beforeStatus?: string
  afterStatus?: string
  reason?: string
  occurredAt?: string
}

/** CMS `MemberPortalConsentDocumentResponse` (a823 스키마 기준 전체 필드) */
export type PortalConsentDocumentDetail = {
  documentId?: number
  consentType?: string
  title?: string
  documentStatus?: string
  contentFormat?: string
  content?: string
  contentSha256?: string
  termsVersion?: string
  targetType?: string
  targetId?: number
  required?: boolean
  withdrawable?: boolean
  participationRestricted?: boolean
  paymentRestricted?: boolean
  signedAt?: string
  expiresAt?: string
  withdrawnAt?: string
  /** 서명 완료 PDF 파일 객체. bytes는 `download-requests` 1회용 릴레이로만 받는다 */
  signedFileObjectId?: number
  /** 서명 PDF 렌더 작업 ID */
  generatedFileJobId?: number
  schemaJson?: unknown
  renderStatus?: string
  renderFailureReason?: string
  /** PORTRAIT_RIGHTS — `PARTIAL` 등 */
  consentStatus?: string
  /** PORTRAIT_RIGHTS — 1·2번 동의 기반 프로그램 참여 가능 여부(서버 계산) */
  programEligible?: boolean
  signatureFields?: PortalConsentSignatureField[]
  events?: PortalConsentDocumentEvent[]
  filledDocument?: PortalFilledDocumentRequest | null
  formTemplateVersion?: PortalConsentFormTemplateVersion | null
  /** 초상권 — 1·2·3번 모두 agree면 true. 응답 전용(라벨). complete 요청 바디에 넣지 않는다 */
  allItemsAgreed?: boolean | null
}

/**
 * CMS `MemberPortalConsentSignFieldRequest`.
 *
 * 미성년자 영수증 사전동의서의 보호자 서명란(tail)은 이 요청으로 회원이 대리 전송할 수 없다(서버 403).
 * 보호자는 `/api/guardian/receipt-signature/sessions/**` 독립 세션에서 직접 서명한다
 * (`features/guardian-receipt-signature`). `guardian*` 필드는 만 14세 미만 초상권 등 기존 보호자 NICE 흐름 전용이다.
 */
export type PortalConsentSignFieldRequest = {
  signatureProfileId?: number
  /** 회원 세션 보호자 NICE 1회 토큰 (`guardian-verifications`) */
  guardianVerificationToken?: string
  /** 보호자 서명 이미지 fileObjectId (회원 세션 보호자 흐름) */
  guardianSignatureFileObjectId?: number
  /** 보호자 서명 확인 체크 */
  guardianSignConfirmed?: boolean
}

export type PortalFilledDocumentRequest = {
  templateVersionId?: number | null
  templateCode?: string
  schemaJson?: Record<string, unknown>
  paymentBasicInfo?: Record<string, unknown>
}

export type PortalConsentFormTemplateVersion = {
  templateVersionId?: number
  templateCode?: string
  versionNo?: number
  schemaJson?: unknown
  extensionJson?: Record<string, unknown> | null
  settingsJson?: Record<string, unknown> | null
}

/** CMS `MemberPortalConsentCompleteRequest` */
export type PortalConsentCompleteRequest = {
  identityVerificationSessionId?: number
  /** 만 14세 미만 PORTRAIT_RIGHTS complete — 보호자 NICE 1회 토큰 */
  guardianVerificationToken?: string
  /** PORTRAIT_RIGHTS — `PARTIAL` (FULL deprecated) */
  consentStatus?: string
  /** PORTRAIT_RIGHTS — 1·2번 항목 동의 기반 힌트(서버 재계산) */
  programEligible?: boolean
  filledDocument?: PortalFilledDocumentRequest
  /**
   * CRIMINAL_HISTORY_CHECK_CONSENT 전용 필수 원본 PDF.
   * `CRIMINAL_HISTORY_CONSENT_ORIGINAL`로 업로드·confirm 후 CLEAN/AVAILABLE인 파일만.
   * 다른 동의서 유형은 서버가 거부한다.
   */
  evidenceFileObjectId?: number
}

export type PortalSignatureProfileRequest = {
  signatureType: string
  fileObjectId: number
  displayName?: string
  fontStyleCode?: string
}

export type PortalSignatureProfileResponse = {
  signatureProfileId?: number
  signatureType?: string
  fileObjectId?: number
  displayName?: string
  fontStyleCode?: string
}
