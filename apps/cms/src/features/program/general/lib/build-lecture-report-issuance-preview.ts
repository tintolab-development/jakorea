import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import {
  createLectureReportIssuanceDraft,
  normalizeWritingFormDraft,
  type LectureReportProgramProgressParagraph,
  type MultipleChoiceParagraph,
  type ScaleTypeParagraph,
  type ShortEssayParagraph,
  type StarRateParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type { Program } from '@/types/domain'

export const LECTURE_REPORT_DOCUMENT_TITLE = '강의보고서'

export interface LectureReportPreviewRowContext {
  id: string
  no: number
  reportId?: number
  scheduleId?: number
  schoolName: string
  educationGrade: string
  educationScheduleLabel: string
}

export interface LectureReportPreviewFile {
  fileObjectId: number
  originalFileName?: string
}

/** 관리자 강의보고서 미리보기용 공통 응답 데이터. */
export interface LectureReportPreviewContent {
  formResponseId?: number
  templateVersionId?: number
  form?: Record<string, unknown>
  answers?: Record<string, unknown>
  files?: LectureReportPreviewFile[]
}

export interface LectureReportPreviewContext {
  instructor: ParticipatingInstructorRow
  program?: Program | null
  row: LectureReportPreviewRowContext
  content?: LectureReportPreviewContent | null
}

export function buildLectureReportPreviewContext(
  instructor: ParticipatingInstructorRow,
  program: Program | null | undefined,
  row: LectureReportPreviewRowContext,
  content?: LectureReportPreviewContent | null
): LectureReportPreviewContext {
  return { instructor, program, row, content }
}

const LECTURE_REPORT_PROGRESS_KEYS = [
  'programName',
  'textbookName',
  'progressUnit',
  'institutionName',
  'institutionLocation',
  'educationDate',
  'sessionTime',
  'sessionIndex',
  'educationTarget',
  'classLabel',
  'studentCount',
] as const

function resolveProgramTitle(program?: Program | null): string {
  return program?.mainTitle?.trim() || program?.title?.trim() || ''
}

function parseEducationScheduleLabel(label: string): {
  startDateLabel: string
  sessionIndex: string
  timeLabel: string
} {
  const pipeParts = label.split('|').map(part => part.trim())
  const sessionLabel = pipeParts.find(part => /\d+\s*회차/.test(part)) ?? ''
  const sessionIndex = sessionLabel.replace(/회차$/, '').trim()
  const rangePart = pipeParts[0]?.trim() ?? label
  const [startDateLabel = ''] = rangePart.split('~').map(part => part.trim())
  const timeLabel = pipeParts.find(part => /\d{1,2}:\d{2}/.test(part)) ?? ''
  return { startDateLabel, sessionIndex, timeLabel }
}

function toIsoDateFromLabel(dateLabel: string): string {
  const normalized = dateLabel
    .replace(/\([^)]*\)/g, '')
    .replace(/\./g, '-')
    .replace(/\s+/g, '')
  const match = normalized.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return ''
  return `${match[1]}-${match[2]}-${match[3]}`
}

function fillSurveyTitleParagraph(
  paragraph: WritingFormParagraph,
  programTitle: string
): WritingFormParagraph {
  if (paragraph.kind !== 'description' || paragraph.variant !== 'survey_title_with_period') {
    return paragraph
  }
  return {
    ...paragraph,
    surveyTitle: programTitle
      ? `JA KOREA 「${programTitle}」 ${LECTURE_REPORT_DOCUMENT_TITLE}`
      : `JA KOREA ${LECTURE_REPORT_DOCUMENT_TITLE}`,
  }
}

function fillProgramProgressParagraph(
  paragraph: WritingFormParagraph,
  ctx: LectureReportPreviewContext
): WritingFormParagraph {
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'lecture_report_program_progress') {
    return paragraph
  }
  const { startDateLabel, sessionIndex, timeLabel } = parseEducationScheduleLabel(
    ctx.row.educationScheduleLabel
  )
  const p = paragraph as LectureReportProgramProgressParagraph
  return {
    ...p,
    programName: resolveProgramTitle(ctx.program),
    textbookName: ctx.program?.textbookName?.trim() || '',
    progressUnit: '',
    institutionName: ctx.row.schoolName,
    institutionLocation: '',
    educationDate: toIsoDateFromLabel(startDateLabel) || startDateLabel,
    sessionTime: timeLabel,
    sessionIndex: sessionIndex ? `${sessionIndex}회차` : '',
    educationTarget: ctx.row.educationGrade === '-' ? '' : ctx.row.educationGrade,
    classLabel: '',
    studentCount: '',
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function readAnswer(answers: Record<string, unknown> | undefined, key: string): unknown {
  return answers != null && key in answers ? answers[key] : undefined
}

function answerText(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function applyShortEssayAnswer(
  paragraph:
    | ShortEssayParagraph
    | Extract<WritingFormParagraph, { variant: 'session_plan_short_essay' }>,
  value: unknown,
  answers: Record<string, unknown> | undefined
): WritingFormParagraph {
  const record = isRecord(value) ? value : undefined
  const answerItems = Array.isArray(record?.items) ? record.items : []
  const items = paragraph.items?.map((item, index) => {
    const directValue = readAnswer(answers, item.id)
    const answerItem =
      answerItems.find(candidate => isRecord(candidate) && candidate.id === item.id) ??
      answerItems[index]
    const itemValue =
      answerText(directValue) ??
      (isRecord(answerItem) ? answerText(answerItem.bodyText) : undefined)
    return itemValue != null ? { ...item, bodyText: itemValue } : item
  })
  const bodyText = answerText(value) ?? (record ? answerText(record.bodyText) : undefined)
  return {
    ...paragraph,
    ...(bodyText != null ? { bodyText } : {}),
    ...(items != null ? { items } : {}),
  }
}

function applyLectureReportAnswer(
  paragraph: WritingFormParagraph,
  answers: Record<string, unknown> | undefined
): WritingFormParagraph {
  if (paragraph.kind !== 'single_item') return paragraph
  const value = readAnswer(answers, paragraph.id)

  if (paragraph.variant === 'lecture_report_program_progress' && isRecord(value)) {
    return {
      ...paragraph,
      ...Object.fromEntries(
        LECTURE_REPORT_PROGRESS_KEYS.map(key => [key, answerText(value[key]) ?? paragraph[key]])
      ),
    } as LectureReportProgramProgressParagraph
  }

  if (paragraph.variant === 'short_essay' || paragraph.variant === 'session_plan_short_essay') {
    return applyShortEssayAnswer(paragraph, value, answers)
  }

  if (paragraph.variant === 'multiple_choice') {
    if (paragraph.allowMultiple === true && Array.isArray(value)) {
      return {
        ...paragraph,
        selectedPreviewMultipleIds: value.filter(
          (item): item is string => typeof item === 'string'
        ),
      } as MultipleChoiceParagraph
    }
    if (typeof value === 'string') {
      return { ...paragraph, selectedPreviewSingleId: value } as MultipleChoiceParagraph
    }
  }

  if (paragraph.variant === 'scale_type' && typeof value === 'string') {
    return { ...paragraph, selectedPreviewItemId: value } as ScaleTypeParagraph
  }

  if (paragraph.variant === 'star_rate' && typeof value === 'number') {
    return { ...paragraph, selectedPreviewStars: value } as StarRateParagraph
  }

  return paragraph
}

export function buildLectureReportFilledDraft(ctx: LectureReportPreviewContext): WritingFormDraft {
  const programTitle = resolveProgramTitle(ctx.program)

  const responseForm = ctx.content?.form
  const base = normalizeWritingFormDraft(
    isRecord(responseForm) && Array.isArray(responseForm.paragraphs)
      ? (responseForm as unknown as WritingFormDraft)
      : createLectureReportIssuanceDraft()
  )
  const filled = {
    ...base,
    paragraphs: base.paragraphs.map(paragraph => {
      const withTitle = fillSurveyTitleParagraph(paragraph, programTitle)
      return fillProgramProgressParagraph(withTitle, ctx)
    }),
  }
  return {
    ...filled,
    paragraphs: filled.paragraphs.map(paragraph =>
      applyLectureReportAnswer(paragraph, ctx.content?.answers)
    ),
  }
}

/** 파일명: 강의보고서_기관명_강사명_260605 */
export function buildLectureReportPreviewFileName(
  ctx: LectureReportPreviewContext,
  date = new Date()
): string {
  const y = String(date.getFullYear()).slice(2)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${LECTURE_REPORT_DOCUMENT_TITLE}_${ctx.row.schoolName}_${ctx.instructor.instructorName}_${y}${m}${d}`
}
