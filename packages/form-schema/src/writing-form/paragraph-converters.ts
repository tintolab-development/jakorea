import type { VerticalTableFlavor, WritingFormParagraph } from './draft-schema.js'
import {
  createHorizontalTableParagraph,
  createVerticalTableParagraph,
  normalizeVerticalTableParagraph,
} from './draft-schema.js'
import { createParagraphByDetail } from './paragraph-factories.js'
import type { DetailSelectValue } from './paragraph-selectors.js'

export function preserveParagraphCommonFields<T extends WritingFormParagraph>(
  next: T,
  prev: WritingFormParagraph
): T {
  const title = prev.paragraphTitle.trim()
  const prevAnswerRequired =
    prev.kind === 'single_item' ? (prev.answerRequired ?? prev.requiredMark) : prev.requiredMark
  return {
    ...next,
    requiredMark: prev.requiredMark,
    paragraphTitle: title === '' ? next.paragraphTitle : prev.paragraphTitle,
    paragraphDescription: prev.paragraphDescription,
    participatesInTitleNumbering: prev.participatesInTitleNumbering,
    ...(next.kind === 'single_item' ? { answerRequired: prevAnswerRequired } : {}),
  }
}

/** 세로형 단락 flavor 전환 — 구조가 flavor마다 달라 기본 단락으로 재생성 후 공통 필드만 유지 */
export function convertVerticalTableFlavor(
  prev: WritingFormParagraph,
  flavor: VerticalTableFlavor
): WritingFormParagraph {
  if (prev.kind !== 'single_item' || prev.variant !== 'vertical_table') {
    return preserveParagraphCommonFields(createVerticalTableParagraph(prev.id, flavor), prev)
  }
  const current = normalizeVerticalTableParagraph(prev)
  if (current.verticalTableFlavor === flavor) return current
  return preserveParagraphCommonFields(createVerticalTableParagraph(prev.id, flavor), prev)
}

export function convertParagraphByDetail(
  prev: WritingFormParagraph,
  detail: DetailSelectValue
): WritingFormParagraph {
  const id = prev.id
  const keepTitle = (nextTitle: string) =>
    prev.paragraphTitle.trim() === '' ? nextTitle : prev.paragraphTitle

  if (detail === 'ujat_journal_education_info') {
    return prev
  }

  switch (detail) {
    case 'horizontal_table':
      return preserveParagraphCommonFields(createHorizontalTableParagraph(id), prev)
    case 'vertical_table':
      if (prev.kind === 'single_item' && prev.variant === 'vertical_table') return prev
      return preserveParagraphCommonFields(createParagraphByDetail('vertical_table', id), prev)
    case 'subjective':
      return preserveParagraphCommonFields(createParagraphByDetail('subjective', id), prev)
    case 'session_plan_short_essay':
      return preserveParagraphCommonFields(
        createParagraphByDetail('session_plan_short_essay', id),
        prev
      )
    case 'multiple_choice':
      return preserveParagraphCommonFields(createParagraphByDetail('multiple_choice', id), prev)
    case 'date_only':
      return preserveParagraphCommonFields(createParagraphByDetail('date_only', id), prev)
    case 'time_only':
      return preserveParagraphCommonFields(createParagraphByDetail('time_only', id), prev)
    case 'star_rate':
      return preserveParagraphCommonFields(createParagraphByDetail('star_rate', id), prev)
    case 'scale_type':
      return preserveParagraphCommonFields(createParagraphByDetail('scale_type', id), prev)
    case 'user_info':
      return preserveParagraphCommonFields(createParagraphByDetail('user_info', id), prev)
    case 'file_attachment':
      return preserveParagraphCommonFields(createParagraphByDetail('file_attachment', id), prev)
    case 'lecture_report_program_progress':
      return preserveParagraphCommonFields(
        createParagraphByDetail('lecture_report_program_progress', id),
        prev
      )
    case 'title':
      return {
        ...createParagraphByDetail('title', id),
        paragraphTitle: keepTitle(''),
        paragraphDescription: prev.paragraphDescription,
      }
    case 'text':
      return preserveParagraphCommonFields(createParagraphByDetail('text', id), prev)
    case 'closing':
      return {
        ...createParagraphByDetail('closing', id),
        paragraphTitle: keepTitle('마무리글형'),
        paragraphDescription: prev.paragraphDescription,
      }
    case 'static_description_lines':
      return preserveParagraphCommonFields(
        {
          ...createParagraphByDetail('static_description_lines', id),
          requiredMark: prev.requiredMark,
          paragraphTitle: prev.paragraphTitle,
          paragraphDescription: prev.paragraphDescription,
          participatesInTitleNumbering: prev.participatesInTitleNumbering,
        } as WritingFormParagraph,
        prev
      )
    case 'id_type_with_input': {
      const opts = createParagraphByDetail('id_type_with_input', id)
      if (opts.kind !== 'single_item' || opts.variant !== 'id_type_with_input') return prev
      return preserveParagraphCommonFields(
        {
          ...opts,
          paragraphTitle: prev.paragraphTitle,
          paragraphDescription: prev.paragraphDescription,
          participatesInTitleNumbering: prev.participatesInTitleNumbering,
        },
        prev
      )
    }
    default:
      return prev
  }
}
