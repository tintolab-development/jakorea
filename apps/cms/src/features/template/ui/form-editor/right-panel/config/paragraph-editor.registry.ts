import type {
  HorizontalTableParagraph,
  VerticalTableParagraph,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { createParagraphByDetail } from '@/features/template/model/writing-form/paragraph-factories'
import { horizontalTableKindRowLabel, verticalTableKindRowLabel } from '@/features/template/model/writing-form/paragraph-selectors'
import {
  isHorizontalTableParagraph,
  isMultipleChoiceParagraph,
  isSessionPlanShortEssayParagraph,
  isShortEssayParagraph,
  isVerticalTableParagraph,
} from '@/features/template/model/writing-form/paragraph-guards'
import type { DetailSelectValue, ParagraphKindSelectValue } from '@/features/template/model/writing-form/paragraph-selectors'

export type ParagraphEditorLabel = string | ((p: WritingFormParagraph) => string)

export type ParagraphEditorDefinition = {
  detail: DetailSelectValue
  kind: ParagraphKindSelectValue
  label: ParagraphEditorLabel
  create: (id: string) => WritingFormParagraph
  match: (p: WritingFormParagraph) => boolean
}

const horizontalTableLabel: ParagraphEditorLabel = p =>
  horizontalTableKindRowLabel(p as HorizontalTableParagraph)

const verticalTableLabel: ParagraphEditorLabel = p =>
  verticalTableKindRowLabel(p as VerticalTableParagraph)

const horizontalTableDef: ParagraphEditorDefinition = {
  detail: 'horizontal_table',
  kind: 'table',
  label: horizontalTableLabel,
  create: id => createParagraphByDetail('horizontal_table', id),
  match: isHorizontalTableParagraph,
}

const verticalTableDef: ParagraphEditorDefinition = {
  detail: 'vertical_table',
  kind: 'table',
  label: verticalTableLabel,
  create: id => createParagraphByDetail('vertical_table', id),
  match: isVerticalTableParagraph,
}

const titleDef: ParagraphEditorDefinition = {
  detail: 'title',
  kind: 'description',
  label: '제목형',
  create: id => createParagraphByDetail('title', id),
  match: p => p.kind === 'description' && p.variant === 'survey_title_with_period',
}

const closingDef: ParagraphEditorDefinition = {
  detail: 'closing',
  kind: 'description',
  label: '마무리글형',
  create: id => createParagraphByDetail('closing', id),
  match: p => p.kind === 'description' && p.variant === 'closing',
}

const staticDescriptionLinesDef: ParagraphEditorDefinition = {
  detail: 'static_description_lines',
  kind: 'description',
  label: '정적 설명(다줄)',
  create: id => createParagraphByDetail('static_description_lines', id),
  match: p => p.kind === 'description' && p.variant === 'static_description_lines',
}

const systemAgreementDateDef: ParagraphEditorDefinition = {
  detail: 'text',
  kind: 'description',
  label: '날짜 유형',
  create: id => createParagraphByDetail('text', id),
  match: p =>
    p.kind === 'description' && p.variant === 'system' && p.systemPreset === 'agreement_date',
}

const systemAgreementSignatureDef: ParagraphEditorDefinition = {
  detail: 'text',
  kind: 'description',
  label: '서명란 유형',
  create: id => createParagraphByDetail('text', id),
  match: p =>
    p.kind === 'description' &&
    p.variant === 'system' &&
    p.systemPreset === 'agreement_signature',
}

const systemOtherDef: ParagraphEditorDefinition = {
  detail: 'text',
  kind: 'description',
  label: '기타',
  create: id => createParagraphByDetail('text', id),
  match: p => p.kind === 'description' && p.variant === 'system',
}

const agreementExplanationTextDef: ParagraphEditorDefinition = {
  detail: 'text',
  kind: 'description',
  label: '텍스트형',
  create: id => createParagraphByDetail('text', id),
  match: p => p.kind === 'single_item' && p.variant === 'agreement_explanation_text',
}

const descriptionFallbackTextDef: ParagraphEditorDefinition = {
  detail: 'text',
  kind: 'description',
  label: '텍스트형',
  create: id => createParagraphByDetail('text', id),
  match: p => p.kind === 'description' && p.variant !== 'survey_title_with_period',
}

const sessionPlanShortEssayDef: ParagraphEditorDefinition = {
  detail: 'session_plan_short_essay',
  kind: 'single_item',
  label: '교육계획 차시형',
  create: id => createParagraphByDetail('session_plan_short_essay', id),
  match: isSessionPlanShortEssayParagraph,
}

const shortEssayDef: ParagraphEditorDefinition = {
  detail: 'subjective',
  kind: 'single_item',
  label: '주관식형',
  create: id => createParagraphByDetail('subjective', id),
  match: isShortEssayParagraph,
}

const multipleChoiceDef: ParagraphEditorDefinition = {
  detail: 'multiple_choice',
  kind: 'single_item',
  label: '객관식형',
  create: id => createParagraphByDetail('multiple_choice', id),
  match: isMultipleChoiceParagraph,
}

const dateOnlyDef: ParagraphEditorDefinition = {
  detail: 'date_only',
  kind: 'single_item',
  label: '날짜형',
  create: id => createParagraphByDetail('date_only', id),
  match: p => p.kind === 'single_item' && p.variant === 'date',
}

const timeOnlyDef: ParagraphEditorDefinition = {
  detail: 'time_only',
  kind: 'single_item',
  label: '시간형',
  create: id => createParagraphByDetail('time_only', id),
  match: p => p.kind === 'single_item' && p.variant === 'time',
}

const starRateDef: ParagraphEditorDefinition = {
  detail: 'star_rate',
  kind: 'single_item',
  label: '별점형',
  create: id => createParagraphByDetail('star_rate', id),
  match: p => p.kind === 'single_item' && p.variant === 'star_rate',
}

const scaleTypeDef: ParagraphEditorDefinition = {
  detail: 'scale_type',
  kind: 'single_item',
  label: '점수 선택형',
  create: id => createParagraphByDetail('scale_type', id),
  match: p => p.kind === 'single_item' && p.variant === 'scale_type',
}

const userInfoDef: ParagraphEditorDefinition = {
  detail: 'user_info',
  kind: 'single_item',
  label: '사용자 정보형',
  create: id => createParagraphByDetail('user_info', id),
  match: p => p.kind === 'single_item' && p.variant === 'user_info',
}

const fileAttachmentDef: ParagraphEditorDefinition = {
  detail: 'file_attachment',
  kind: 'single_item',
  label: '파일 첨부형',
  create: id => createParagraphByDetail('file_attachment', id),
  match: p => p.kind === 'single_item' && p.variant === 'file_attachment',
}

const ujatJournalEducationInfoDef: ParagraphEditorDefinition = {
  detail: 'ujat_journal_education_info',
  kind: 'single_item',
  label: 'UJAT 교육 정보(교육일지)',
  create: id => createParagraphByDetail('ujat_journal_education_info', id),
  match: p => p.kind === 'single_item' && p.variant === 'ujat_journal_education_info',
}

const lectureReportProgramProgressDef: ParagraphEditorDefinition = {
  detail: 'lecture_report_program_progress',
  kind: 'single_item',
  label: '강의보고서 프로그램 진행 정보',
  create: id => createParagraphByDetail('lecture_report_program_progress', id),
  match: p => p.kind === 'single_item' && p.variant === 'lecture_report_program_progress',
}

const idTypeWithInputDef: ParagraphEditorDefinition = {
  detail: 'id_type_with_input',
  kind: 'single_item',
  label: '식별번호 입력',
  create: id => createParagraphByDetail('id_type_with_input', id),
  match: p => p.kind === 'single_item' && p.variant === 'id_type_with_input',
}

const userProfileDef: ParagraphEditorDefinition = {
  detail: 'subjective',
  kind: 'single_item',
  label: '사용자 정보형',
  create: id => createParagraphByDetail('user_info', id),
  match: p => p.kind === 'single_item' && p.variant === 'user_profile',
}

const scoreSelectDef: ParagraphEditorDefinition = {
  detail: 'subjective',
  kind: 'single_item',
  label: '점수 선택형',
  create: id => createParagraphByDetail('scale_type', id),
  match: p => p.kind === 'single_item' && p.variant === 'score_select',
}

const subjectiveVariantDef: ParagraphEditorDefinition = {
  detail: 'subjective',
  kind: 'single_item',
  label: '주관식형',
  create: id => createParagraphByDetail('subjective', id),
  match: p => p.kind === 'single_item' && p.variant === 'subjective',
}

const dropdownDef: ParagraphEditorDefinition = {
  detail: 'subjective',
  kind: 'single_item',
  label: '드롭다운형',
  create: id => createParagraphByDetail('multiple_choice', id),
  match: p => p.kind === 'single_item' && p.variant === 'dropdown',
}

export const PARAGRAPH_EDITOR_DEFINITIONS: ParagraphEditorDefinition[] = [
  horizontalTableDef,
  verticalTableDef,
  titleDef,
  closingDef,
  staticDescriptionLinesDef,
  systemAgreementDateDef,
  systemAgreementSignatureDef,
  systemOtherDef,
  agreementExplanationTextDef,
  descriptionFallbackTextDef,
  sessionPlanShortEssayDef,
  shortEssayDef,
  multipleChoiceDef,
  dateOnlyDef,
  timeOnlyDef,
  starRateDef,
  scaleTypeDef,
  userInfoDef,
  fileAttachmentDef,
  ujatJournalEducationInfoDef,
  lectureReportProgramProgressDef,
  idTypeWithInputDef,
  userProfileDef,
  scoreSelectDef,
  subjectiveVariantDef,
  dropdownDef,
]

const PRIMARY_DETAIL_DEFINITION: Partial<Record<DetailSelectValue, ParagraphEditorDefinition>> = {
  horizontal_table: horizontalTableDef,
  vertical_table: verticalTableDef,
  title: titleDef,
  closing: closingDef,
  static_description_lines: staticDescriptionLinesDef,
  text: agreementExplanationTextDef,
  session_plan_short_essay: sessionPlanShortEssayDef,
  subjective: shortEssayDef,
  multiple_choice: multipleChoiceDef,
  date_only: dateOnlyDef,
  time_only: timeOnlyDef,
  star_rate: starRateDef,
  scale_type: scaleTypeDef,
  user_info: userInfoDef,
  file_attachment: fileAttachmentDef,
  ujat_journal_education_info: ujatJournalEducationInfoDef,
  lecture_report_program_progress: lectureReportProgramProgressDef,
  id_type_with_input: idTypeWithInputDef,
}

export function getParagraphEditorDefinition(
  paragraph: WritingFormParagraph
): ParagraphEditorDefinition | undefined {
  return PARAGRAPH_EDITOR_DEFINITIONS.find(d => d.match(paragraph))
}

export function getParagraphDefinitionByDetail(
  detail: DetailSelectValue
): ParagraphEditorDefinition | undefined {
  return PRIMARY_DETAIL_DEFINITION[detail]
}

export function paragraphVariantLabel(p: WritingFormParagraph): string {
  const def = getParagraphEditorDefinition(p)
  if (def) {
    return typeof def.label === 'string' ? def.label : def.label(p)
  }
  return ''
}
