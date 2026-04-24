import type {
  FormTitleNumberingStyle,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { writingOutlineLabel } from '@/features/template/model/writing-form-draft.schema'

/** 번호 대상 단락에 대해 1부터 부여되는 순번 (전체 paragraphs 순서 기준) */
export function getTitleNumberSequenceIndex(
  paragraphs: WritingFormParagraph[],
  paragraphId: string
): number | null {
  let n = 0
  for (const p of paragraphs) {
    if (!p.participatesInTitleNumbering) continue
    n += 1
    if (p.id === paragraphId) return n
  }
  return null
}

function formatToken(style: FormTitleNumberingStyle, sequence: number): string {
  if (style === 'none') return ''
  if (style === 'numeric') return `${sequence}`
  if (style === 'alpha') {
    let n = sequence
    let s = ''
    while (n > 0) {
      const rem = (n - 1) % 26
      s = String.fromCharCode(65 + rem) + s
      n = Math.floor((n - 1) / 26)
    }
    return s
  }
  if (style === 'q_repeat') return 'Q'
  if (style === 'q123') return `Q${sequence}`
  return `${sequence}`
}

/** 카드 제목 `ParagraphInput` 앞 번호 접두 (예: `1. `, `A. `) — 번호 없으면 undefined */
export function getFormParagraphTitleNumberPrefix(
  paragraphs: WritingFormParagraph[],
  paragraph: WritingFormParagraph,
  style: FormTitleNumberingStyle
): string | undefined {
  if (!paragraph.participatesInTitleNumbering || style === 'none') return undefined
  const seq = getTitleNumberSequenceIndex(paragraphs, paragraph.id)
  if (seq == null) return undefined
  const token = formatToken(style, seq)
  if (!token) return undefined
  if (style === 'q_repeat') return `${token}. `
  return `${token}. `
}

/** 카드/헤더용: 접두 + 구분자 + 원문 타이틀(또는 아웃라인 라벨) */
export function getFormParagraphDisplayTitle(
  paragraphs: WritingFormParagraph[],
  paragraph: WritingFormParagraph,
  style: FormTitleNumberingStyle
): string {
  const base =
    paragraph.kind === 'description' && paragraph.variant === 'closing'
      ? writingOutlineLabel(paragraph)
      : paragraph.paragraphTitle.trim() || writingOutlineLabel(paragraph)

  if (!paragraph.participatesInTitleNumbering || style === 'none') {
    if (paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period') {
      return base === '제목 없음' ? '제목 없음' : base
    }
    if (paragraph.kind === 'description' && paragraph.variant === 'closing') {
      return base
    }
    return base
  }

  const seq = getTitleNumberSequenceIndex(paragraphs, paragraph.id)
  if (seq == null) return base

  const token = formatToken(style, seq)
  if (!token) return base

  if (style === 'q_repeat') {
    return `${token}. ${base}`
  }
  return `${token}. ${base}`
}

/** 우측 네비 한 줄 */
export function getFormNavDisplayLine(
  paragraphs: WritingFormParagraph[],
  paragraph: WritingFormParagraph,
  style: FormTitleNumberingStyle
): string {
  return getFormParagraphDisplayTitle(paragraphs, paragraph, style)
}
