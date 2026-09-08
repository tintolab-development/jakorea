import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  createAgreementNoticeDraft,
  ensureAgreementNoticeConfirmationClosing,
  ensureAgreementNoticeInstitutionPurposeParagraphs,
  normalizeNoticeIdTypeResidentInputInDraft,
  overlayAgreementNoticeSeedHorizontalTable,
  type IdTypeWithInputParagraph,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

function findNoticeTableIdTypeSeed(): IdTypeWithInputParagraph | null {
  const table = createAgreementNoticeDraft().paragraphs.find(
    p => p.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.table
  )
  if (table?.kind !== 'single_item' || table.variant !== 'horizontal_table') return null
  return table.idTypeWithInput ?? null
}

function findLegacyStandaloneIdTypeParagraph(
  draft: WritingFormDraft
): IdTypeWithInputParagraph | null {
  const paragraph = draft.paragraphs.find(
    item =>
      item.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.idType &&
      item.kind === 'single_item' &&
      item.variant === 'id_type_with_input'
  )
  if (paragraph?.kind !== 'single_item' || paragraph.variant !== 'id_type_with_input') {
    return null
  }
  return paragraph
}

/**
 * filled-document 조회본 — 행정정보 표·식별번호(주민등록번호) 입력값 복원.
 * BE가 `idTypeWithInput`을 누락하거나 구버전 단락 id에만 저장한 경우를 보정한다.
 */
export function restoreAgreementNoticeFilledDocumentDraft(
  draft: WritingFormDraft
): WritingFormDraft {
  let next = ensureAgreementNoticeConfirmationClosing(draft)
  next = ensureAgreementNoticeInstitutionPurposeParagraphs(next)
  next = overlayAgreementNoticeSeedHorizontalTable(next)

  const legacy = findLegacyStandaloneIdTypeParagraph(next)
  const legacyValue = legacy?.inputValue?.trim() ?? ''
  if (!legacyValue) {
    return normalizeNoticeIdTypeResidentInputInDraft(next)
  }

  const seed = findNoticeTableIdTypeSeed()
  next = {
    ...next,
    paragraphs: next.paragraphs.map(paragraph => {
      if (
        paragraph.id !== AGREEMENT_NOTICE_PARAGRAPH_IDS.table ||
        paragraph.kind !== 'single_item' ||
        paragraph.variant !== 'horizontal_table'
      ) {
        return paragraph
      }
      const currentValue = paragraph.idTypeWithInput?.inputValue?.trim() ?? ''
      if (currentValue) return paragraph
      const base = paragraph.idTypeWithInput ?? seed ?? legacy
      if (base == null) return paragraph
      return {
        ...paragraph,
        idTypeWithInput: {
          ...base,
          inputValue: legacy?.inputValue ?? base.inputValue ?? '',
        },
      }
    }),
  }

  return normalizeNoticeIdTypeResidentInputInDraft(next)
}
