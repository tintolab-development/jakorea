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

export type PortalConsentDocumentDetail = {
  documentId?: number
  consentType?: string
  title?: string
  documentStatus?: string
  contentFormat?: string
  content?: string
  schemaJson?: unknown
  renderStatus?: string
  signatureFields?: PortalConsentSignatureField[]
  filledDocument?: PortalFilledDocumentRequest | null
  formTemplateVersion?: PortalConsentFormTemplateVersion | null
}

export type PortalConsentSignFieldRequest = {
  signatureProfileId?: number
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
