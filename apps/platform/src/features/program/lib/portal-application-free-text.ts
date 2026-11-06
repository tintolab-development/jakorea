import type { WritingFormDraft, WritingFormParagraph } from '@jakorea/form-schema/writing-form'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import { isRequiredParagraph } from './application-form-draft.ts'

/** SHORT_ESSAY / TEXT / TEXTAREA / HORIZONTAL_TABLE 셀 합산 상한. 1000 허용, 1001 거부. */
export const PROGRAM_APPLICATION_FREE_TEXT_MAX_LENGTH = 1000

export function clipApplicationFreeText(value: string): string {
  if (value.length <= PROGRAM_APPLICATION_FREE_TEXT_MAX_LENGTH) return value
  return value.slice(0, PROGRAM_APPLICATION_FREE_TEXT_MAX_LENGTH)
}

export function isIndividualSelfIntroParagraphId(id: string): boolean {
  return (
    id === PROGRAM_PARTICIPANT_APPLICATION_IDS.selfIntro ||
    id === 'program-participant-application-seed-self-introduction' ||
    id === 'program-participant-application-seed-self-intro'
  )
}

function paragraphRequired(paragraph: WritingFormParagraph): boolean {
  if (isRequiredParagraph(paragraph)) return true
  if ('required' in paragraph && paragraph.required === true) return true
  return false
}

function shortEssayText(paragraph: WritingFormParagraph): string {
  if (paragraph.kind !== 'single_item') return ''
  if (paragraph.variant !== 'short_essay' && paragraph.variant !== 'session_plan_short_essay') {
    return ''
  }
  const items = paragraph.items ?? []
  if (items.length === 0) return String(paragraph.bodyText ?? '')
  return items.map(item => String(item.bodyText ?? '')).join('')
}

function horizontalTableCellText(paragraph: WritingFormParagraph): string {
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'horizontal_table') return ''
  const rows = paragraph.fieldDataRows ?? []
  const parts: string[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    for (const value of Object.values(row as unknown as Record<string, unknown>)) {
      if (typeof value === 'string') parts.push(value)
    }
  }
  return parts.join('')
}

export function applicationFreeTextLength(paragraph: WritingFormParagraph): number {
  if (paragraph.kind !== 'single_item') return 0
  if (paragraph.variant === 'short_essay' || paragraph.variant === 'session_plan_short_essay') {
    return shortEssayText(paragraph).length
  }
  if (paragraph.variant === 'horizontal_table') {
    return horizontalTableCellText(paragraph).length
  }
  return 0
}

export function findApplicationFreeTextTooLongParagraphId(
  draft: WritingFormDraft | null | undefined,
  hiddenIds?: ReadonlySet<string>,
): string | null {
  if (!draft) return null
  for (const paragraph of draft.paragraphs) {
    if (hiddenIds?.has(paragraph.id)) continue
    if (applicationFreeTextLength(paragraph) > PROGRAM_APPLICATION_FREE_TEXT_MAX_LENGTH) {
      return paragraph.id
    }
  }
  return null
}

export function findIncompleteRequiredSelfIntroParagraphId(
  draft: WritingFormDraft | null | undefined,
  hiddenIds?: ReadonlySet<string>,
): string | null {
  if (!draft) return null
  for (const paragraph of draft.paragraphs) {
    if (!isIndividualSelfIntroParagraphId(paragraph.id)) continue
    if (hiddenIds?.has(paragraph.id)) continue
    if (!paragraphRequired(paragraph)) continue
    if (shortEssayText(paragraph).trim() === '') return paragraph.id
  }
  return null
}

export function findIncompleteRequiredShortEssayParagraphId(
  draft: WritingFormDraft | null | undefined,
  hiddenIds?: ReadonlySet<string>,
): string | null {
  if (!draft) return null
  const selfIntro = findIncompleteRequiredSelfIntroParagraphId(draft, hiddenIds)
  if (selfIntro) return selfIntro
  for (const paragraph of draft.paragraphs) {
    if (hiddenIds?.has(paragraph.id)) continue
    if (paragraph.kind !== 'single_item') continue
    if (paragraph.variant !== 'short_essay' && paragraph.variant !== 'session_plan_short_essay') {
      continue
    }
    if (!paragraphRequired(paragraph)) continue
    if (shortEssayText(paragraph).trim() === '') return paragraph.id
  }
  return null
}
