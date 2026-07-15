import type {
  HorizontalTableParagraph,
  VerticalTableParagraph,
  WritingFormParagraph,
} from './draft-schema.js'
import {
  normalizeVerticalTableParagraph,
  verticalTableParagraphOutlineLabel,
} from './draft-schema.js'

export type ParagraphKindSelectValue = 'single_item' | 'description' | 'table'
export type SingleItemDetailSelectValue =
  | 'subjective'
  | 'session_plan_short_essay'
  | 'multiple_choice'
  | 'date_only'
  | 'time_only'
  | 'star_rate'
  | 'scale_type'
  | 'user_info'
  | 'file_attachment'
  | 'ujat_journal_education_info'
  | 'lecture_report_program_progress'
  | 'id_type_with_input'
export type TableDetailSelectValue = 'horizontal_table' | 'vertical_table'
export type DescriptionDetailSelectValue = 'title' | 'text' | 'closing' | 'static_description_lines'
export type DetailSelectValue =
  | SingleItemDetailSelectValue
  | TableDetailSelectValue
  | DescriptionDetailSelectValue

export const PARAGRAPH_KIND_OPTIONS: { value: ParagraphKindSelectValue; label: string }[] = [
  { value: 'single_item', label: '단일항목' },
  { value: 'description', label: '설명글' },
  { value: 'table', label: '테이블' },
]
export const SINGLE_ITEM_DETAIL_OPTIONS: { value: SingleItemDetailSelectValue; label: string }[] = [
  { value: 'subjective', label: '주관식형' },
  { value: 'session_plan_short_essay', label: '교육계획 차시형' },
  { value: 'multiple_choice', label: '객관식형' },
  { value: 'date_only', label: '날짜형' },
  { value: 'time_only', label: '시간형' },
  { value: 'star_rate', label: '별점형' },
  { value: 'scale_type', label: '점수 선택형' },
  { value: 'user_info', label: '사용자 정보형' },
  { value: 'file_attachment', label: '파일 첨부형' },
  { value: 'ujat_journal_education_info', label: 'UJAT 교육 정보(교육일지)' },
  { value: 'lecture_report_program_progress', label: '강의보고서 프로그램 진행 정보' },
  { value: 'id_type_with_input', label: '식별번호 입력' },
]
export const DESCRIPTION_DETAIL_OPTIONS: { value: DescriptionDetailSelectValue; label: string }[] = [
  { value: 'title', label: '제목형' },
  { value: 'text', label: '텍스트형' },
  { value: 'closing', label: '마무리글형' },
  { value: 'static_description_lines', label: '정적 설명(다줄)' },
]
export const TABLE_DETAIL_OPTIONS: { value: TableDetailSelectValue; label: string }[] = [
  { value: 'horizontal_table', label: '가로형' },
  { value: 'vertical_table', label: '세로형' },
]

export function paragraphKindSelectValue(p: WritingFormParagraph): ParagraphKindSelectValue {
  if (
    p.kind === 'single_item' &&
    (p.variant === 'horizontal_table' || p.variant === 'vertical_table')
  ) {
    return 'table'
  }
  if (
    p.kind === 'description' ||
    (p.kind === 'single_item' && p.variant === 'agreement_explanation_text')
  ) {
    return 'description'
  }
  return 'single_item'
}

export function paragraphDetailSelectValue(p: WritingFormParagraph): DetailSelectValue {
  if (p.kind === 'single_item' && p.variant === 'horizontal_table') return 'horizontal_table'
  if (p.kind === 'single_item' && p.variant === 'vertical_table') return 'vertical_table'
  if (p.kind === 'description' && p.variant === 'survey_title_with_period') return 'title'
  if (p.kind === 'description' && p.variant === 'closing') return 'closing'
  if (p.kind === 'description' && p.variant === 'static_description_lines')
    return 'static_description_lines'
  if (p.kind === 'single_item' && p.variant === 'agreement_explanation_text') return 'text'
  if (p.kind === 'single_item' && p.variant === 'session_plan_short_essay')
    return 'session_plan_short_essay'
  if (p.kind === 'single_item' && p.variant === 'short_essay') return 'subjective'
  if (p.kind === 'single_item' && p.variant === 'multiple_choice') return 'multiple_choice'
  if (p.kind === 'single_item' && p.variant === 'date') return 'date_only'
  if (p.kind === 'single_item' && p.variant === 'time') return 'time_only'
  if (p.kind === 'single_item' && p.variant === 'star_rate') return 'star_rate'
  if (p.kind === 'single_item' && p.variant === 'scale_type') return 'scale_type'
  if (p.kind === 'single_item' && p.variant === 'user_info') return 'user_info'
  if (p.kind === 'single_item' && p.variant === 'file_attachment') return 'file_attachment'
  if (p.kind === 'single_item' && p.variant === 'lecture_report_program_progress')
    return 'lecture_report_program_progress'
  if (p.kind === 'single_item' && p.variant === 'id_type_with_input') return 'id_type_with_input'
  if (p.kind === 'description') return 'text'
  return 'subjective'
}

/** 가로형 테이블 단락의 종류 행(필드 형) 라벨 — `paragraphKindSelectValue` 보조 */
export function horizontalTableKindRowLabel(p: HorizontalTableParagraph): string {
  return p.tableFlavor === 'field' ? '테이블_가로형 (필드 형)' : '테이블_가로형'
}

/** 세로형 테이블 단락의 종류 행 라벨 — `paragraphKindSelectValue` 보조 */
export function verticalTableKindRowLabel(p: VerticalTableParagraph): string {
  const vt = normalizeVerticalTableParagraph(p)
  return verticalTableParagraphOutlineLabel(vt.verticalTableFlavor)
}
