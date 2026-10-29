import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_NOTICE_SUBJECT_ITEM_IDS,
  type WritingFormDraft,
} from '../writing-form/draft-schema.js'

/**
 * 행정정보 대상자 본인 성명 — 화면 잠금 표시값(`lockedBasic.name`)을
 * validator가 보는 `agreement-notice-subj-name`.bodyText 에 맞춘다.
 */
export function applyAgreementNoticeSubjectMemberName(
  draft: WritingFormDraft,
  memberName: string
): WritingFormDraft {
  const name = memberName.trim()
  if (!name) return draft

  let changed = false
  const paragraphs = draft.paragraphs.map(paragraph => {
    if (
      paragraph.id !== AGREEMENT_NOTICE_PARAGRAPH_IDS.subject ||
      paragraph.kind !== 'single_item' ||
      paragraph.variant !== 'short_essay'
    ) {
      return paragraph
    }

    const items = paragraph.items ?? []
    if (items.length === 0) {
      if (paragraph.bodyText === name) return paragraph
      changed = true
      return { ...paragraph, bodyText: name }
    }

    let paragraphChanged = false
    const nextItems = items.map(item => {
      if (item.id !== AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.name || item.bodyText === name) {
        return item
      }
      paragraphChanged = true
      return { ...item, bodyText: name }
    })
    if (!paragraphChanged) return paragraph
    changed = true
    const nameItem = nextItems.find(item => item.id === AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.name)
    return {
      ...paragraph,
      items: nextItems,
      bodyText: nameItem?.bodyText ?? paragraph.bodyText,
    }
  })

  return changed ? { ...draft, paragraphs } : draft
}
