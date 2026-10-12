import {
  hasMemberConsentIncompleteRequiredFields,
  MEMBER_CONSENT_TEMPLATE_MAP,
} from '@jakorea/form-schema/consent'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import type { SignupFilledDocumentRequest, TermsAgreementRequest } from '../model/types/signup-api.types'

const PORTRAIT_TEMPLATE_ID = MEMBER_CONSENT_TEMPLATE_MAP.consentPortrait.templateId

const PORTRAIT_FILLED_DOCUMENT_TERMS_TYPES = new Set([
  'PORTRAIT_RIGHTS',
  'PORTRAIT',
  'IMAGE_RIGHTS',
  'RIGHTS_OF_PUBLICITY',
])

/** CMS `mapAgreementSnapshotToFilledDocument` — 작성 완료 draft를 그대로 제출 (bottomConsent 유지) */
export function buildPortraitFilledDocument(draft: WritingFormDraft): SignupFilledDocumentRequest {
  return {
    templateCode: 'agreement-portrait',
    schemaJson: draft as unknown as Record<string, unknown>,
  }
}

export function isPortraitConsentDraftReadyForSubmit(draft: WritingFormDraft): boolean {
  return !hasMemberConsentIncompleteRequiredFields(draft, { templateId: PORTRAIT_TEMPLATE_ID })
}

/** `agreed: true`인 초상권 약관 행에 CMS와 동일한 `filledDocument`를 붙인다. */
export function attachPortraitFilledDocumentToTermsAgreements(
  rows: TermsAgreementRequest[],
  portraitDraft: WritingFormDraft | null | undefined
): TermsAgreementRequest[] {
  if (portraitDraft == null) return rows

  const filledDocument = buildPortraitFilledDocument(portraitDraft)

  return rows.map(row => {
    const termsType = row.termsType?.trim().toUpperCase() ?? ''
    if (row.agreed !== true || !PORTRAIT_FILLED_DOCUMENT_TERMS_TYPES.has(termsType)) {
      return row
    }
    return { ...row, filledDocument }
  })
}
