import {
  AGREEMENT_NOTICE_ID_TYPE_RESIDENT_OPTION_ID,
  type WritingFormDraft,
} from './draft-schema.js'

export function isIdTypeResidentOptionId(optionId: string | null | undefined): boolean {
  return optionId === AGREEMENT_NOTICE_ID_TYPE_RESIDENT_OPTION_ID
}

export function splitIdTypeResidentInputValue(raw: string): { front: string; back: string } {
  const digits = (raw ?? '').replace(/\D/g, '')
  return { front: digits.slice(0, 6), back: digits.slice(6, 13) }
}

export function joinIdTypeResidentInputValue(front: string, back: string): string {
  const f = (front ?? '').replace(/\D/g, '').slice(0, 6)
  const b = (back ?? '').replace(/\D/g, '').slice(0, 7)
  if (!f && !b) return ''
  if (!b) return f
  return `${f}-${b}`
}

/** 서버 저장용 단일 필드 — `9707211234567` / `970721-1234567` 모두 `앞-뒤`로 정규화 */
export function canonicalizeIdTypeResidentInputValue(raw: string): string {
  const { front, back } = splitIdTypeResidentInputValue(raw)
  return joinIdTypeResidentInputValue(front, back)
}

/** 행정정보 식별번호(주민등록번호)만 한 문자열로 맞춤. 화면 분리는 UI에서 다시 split */
export function normalizeNoticeIdTypeResidentInputInDraft(draft: WritingFormDraft): WritingFormDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph => {
      if (paragraph.kind !== 'single_item') return paragraph

      if (paragraph.variant === 'id_type_with_input') {
        if (!isIdTypeResidentOptionId(paragraph.selectedOptionId)) return paragraph
        return {
          ...paragraph,
          inputValue: canonicalizeIdTypeResidentInputValue(paragraph.inputValue),
        }
      }

      if (paragraph.variant !== 'horizontal_table' || paragraph.idTypeWithInput == null) {
        return paragraph
      }
      const nested = paragraph.idTypeWithInput
      if (!isIdTypeResidentOptionId(nested.selectedOptionId)) return paragraph
      return {
        ...paragraph,
        idTypeWithInput: {
          ...nested,
          inputValue: canonicalizeIdTypeResidentInputValue(nested.inputValue),
        },
      }
    }),
  }
}

export function formatIdTypeResidentInputDisplay(raw: string): string {
  const { front, back } = splitIdTypeResidentInputValue(raw)
  if (!front && !back) return ''
  if (!back) return front
  return `${front}-${back}`
}

/** 주민등록번호 유형 — 앞 6·뒤 7이 모두 있어야 응답 완료 */
export function isIdTypeResidentInputFilled(raw: string): boolean {
  const { front, back } = splitIdTypeResidentInputValue(raw)
  return front.length === 6 && back.length === 7
}
