import {
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'

function readBottomConsent(paragraph: WritingFormParagraph): 'agree' | 'disagree' | undefined {
  if (!('showBottomConsent' in paragraph) || paragraph.showBottomConsent !== true) {
    return undefined
  }
  return (paragraph as { bottomConsent?: 'agree' | 'disagree' }).bottomConsent
}

function isTableAgreed(draft: WritingFormDraft, paragraphId: string): boolean {
  const paragraph = draft.paragraphs.find(entry => entry.id === paragraphId)
  if (paragraph == null) return false
  return readBottomConsent(paragraph) === 'agree'
}

/** Portal complete — 서버가 재계산하나 OpenAPI 힌트와 동일하게 전송 */
export function resolvePortraitPortalCompleteHints(draft: WritingFormDraft): {
  consentStatus: 'PARTIAL'
  programEligible: boolean
} {
  const item1Agree = isTableAgreed(draft, AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable)
  const item2Agree = isTableAgreed(draft, AGREEMENT_PORTRAIT_PARAGRAPH_IDS.delegatedConsentTable)
  return {
    consentStatus: 'PARTIAL',
    programEligible: item1Agree && item2Agree,
  }
}
