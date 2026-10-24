import {
  portraitPersonalConsentNameValue,
} from '@jakorea/form-schema/consent'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_NOTICE_SUBJECT_ITEM_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  type WritingFormDraft,
} from '@jakorea/form-schema/writing-form'

function firstText(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return ''
}

/** 제출 양식에 적힌 성명. 없으면 회원 성명(작성 화면과 동일), 그다음 전자서명 표시 이름. */
export function resolveConsentPreviewSignerName(input: {
  draft: WritingFormDraft | null
  paymentName?: string
  memberName?: string
  signatureDisplayName?: string
}): string {
  let portraitName = ''
  let noticeName = ''
  if (input.draft != null) {
    for (const paragraph of input.draft.paragraphs) {
      if (
        paragraph.id === AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable &&
        paragraph.kind === 'single_item' &&
        paragraph.variant === 'vertical_table'
      ) {
        portraitName = portraitPersonalConsentNameValue(paragraph.rows[0]?.cells[0] ?? '')
      }
      if (
        paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.subject &&
        paragraph.kind === 'single_item' &&
        (paragraph.variant === 'short_essay' || paragraph.variant === 'session_plan_short_essay')
      ) {
        noticeName =
          paragraph.items?.find(item => item.id === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.name)?.bodyText ??
          ''
      }
    }
  }
  return firstText(
    portraitName,
    noticeName,
    input.paymentName,
    input.memberName,
    input.signatureDisplayName,
  )
}
