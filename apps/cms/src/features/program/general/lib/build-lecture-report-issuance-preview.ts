import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import {
  createLectureReportIssuanceDraft,
  normalizeWritingFormDraft,
  type LectureReportProgramProgressParagraph,
  type MultipleChoiceParagraph,
  type ScaleTypeParagraph,
  type ShortEssayParagraph,
  type StarRateParagraph,
  type UserInfoParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import type { Program } from '@/types/domain'
import { formatEducationScheduleLabelTokens } from '@/shared/lib/education-schedule-name'

export const LECTURE_REPORT_DOCUMENT_TITLE = '강의보고서'

export const LECTURE_REPORT_INSTRUCTOR_INFO_PARAGRAPH_ID = 'lecture-report-instructor-info'

export interface LectureReportPreviewRowContext {
  id: string
  no: number
  reportId?: number
  scheduleId?: number
  schoolName: string
  educationGrade: string
  educationScheduleLabel: string
  lectureDate?: string
  sessionNo?: number
  curriculumSessionCount?: number
  scheduleRole?: string
  educationSlotKey?: string
  timeLabel?: string
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
  hideInstitutionFields: boolean
}

export function buildLectureReportPreviewContext(
  instructor: ParticipatingInstructorRow,
  program: Program | null | undefined,
  row: LectureReportPreviewRowContext,
  content?: LectureReportPreviewContent | null
): LectureReportPreviewContext {
  return {
    instructor,
    program,
    row,
    content,
    hideInstitutionFields: program != null && isGeneralIndividualProgram(program),
  }
}

export function lectureReportPreviewParagraphBodyOptions(
  ctx: LectureReportPreviewContext
): RenderFormParagraphBodyOptions {
  return {
    lectureReportProgramLinkedPreview: true,
    lectureReportFiles: ctx.content?.files ?? [],
    lectureReportHideInstitutionFields: ctx.hideInstitutionFields,
    hideTitleRequiredMark: true,
    userInfoPreviewValues: { name: ctx.instructor.instructorName?.trim() || '-' },
  }
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
  const raw = label.trim()
  const pipeParts = raw.split(/\s*[|·]\s*/u).map(part => part.trim()).filter(Boolean)
  const sessionPart =
    pipeParts.find(part => /\d+\s*회차/.test(part)) ??
    pipeParts.find(part => /\d+\s*차시/.test(part)) ??
    ''
  const sessionIndex = sessionPart.replace(/\s+/g, '')
  const rangePart = pipeParts[0] ?? raw
  const dateOnly = rangePart.replace(/\d{1,2}:\d{2}.*$/, '').trim()
  const [startDateLabel = ''] = dateOnly.split('~').map(part => part.trim())
  const timeRange = raw.match(/(\d{1,2}:\d{2})\s*[~\-–]\s*(\d{1,2}:\d{2})/)
  const timeLabel = timeRange
    ? `${timeRange[1]} ~ ${timeRange[2]}`
    : pipeParts.find(part => /\d{1,2}:\d{2}/.test(part) && !/회차|차시/.test(part)) ??
      raw.match(/\d{1,2}:\d{2}/)?.[0] ??
      ''
  return { startDateLabel, sessionIndex, timeLabel }
}

function pickNonEmpty(...candidates: Array<string | undefined | null>): string {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim() ?? ''
    if (trimmed && trimmed !== '-') return trimmed
  }
  return ''
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
  const parsedDate = toIsoDateFromLabel(startDateLabel) || startDateLabel
  const lectureDate = ctx.row.lectureDate?.trim()
    ? toIsoDateFromLabel(ctx.row.lectureDate) || ctx.row.lectureDate
    : ''
  const sessionFromNo = formatEducationScheduleLabelTokens({
    sessionNo: ctx.row.sessionNo,
    curriculumSessionCount: ctx.row.curriculumSessionCount,
    scheduleRole: ctx.row.scheduleRole,
    educationSlotKey: ctx.row.educationSlotKey,
  }).join(' · ')
  return {
    ...p,
    programName: pickNonEmpty(p.programName, resolveProgramTitle(ctx.program)),
    textbookName: pickNonEmpty(p.textbookName, ctx.program?.textbookName),
    progressUnit: pickNonEmpty(p.progressUnit),
    institutionName: ctx.hideInstitutionFields
      ? ''
      : pickNonEmpty(p.institutionName, ctx.row.schoolName),
    institutionLocation: ctx.hideInstitutionFields ? '' : pickNonEmpty(p.institutionLocation),
    educationDate: pickNonEmpty(p.educationDate, lectureDate, parsedDate),
    sessionTime: pickNonEmpty(p.sessionTime, ctx.row.timeLabel, timeLabel),
    sessionIndex: pickNonEmpty(p.sessionIndex, sessionFromNo, sessionIndex),
    educationTarget: pickNonEmpty(
      p.educationTarget,
      ctx.row.educationGrade === '-' ? '' : ctx.row.educationGrade
    ),
    classLabel: pickNonEmpty(p.classLabel),
    studentCount: pickNonEmpty(p.studentCount),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function readAnswer(answers: Record<string, unknown> | undefined, key: string): unknown {
  return answers != null && key in answers ? answers[key] : undefined
}

function answerText(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
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
        LECTURE_REPORT_PROGRESS_KEYS.map(key => [
          key,
          pickNonEmpty(answerText(value[key]), paragraph[key]),
        ])
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

function stripLectureReportViewRequiredMark(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (paragraph.kind !== 'single_item') return paragraph
  if (paragraph.requiredMark !== true && paragraph.answerRequired !== true) return paragraph
  return { ...paragraph, requiredMark: false, answerRequired: false }
}

function isInstructorInfoParagraph(paragraph: WritingFormParagraph): boolean {
  if (paragraph.id === LECTURE_REPORT_INSTRUCTOR_INFO_PARAGRAPH_ID) return true
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'user_info') return false
  const title = paragraph.paragraphTitle?.trim()
  if (title === '강사 정보') return true
  return (paragraph.selectedUserFieldKeys ?? []).includes('name')
}

function createInstructorInfoParagraph(instructorName: string): UserInfoParagraph {
  const name = instructorName.trim()
  return {
    id: LECTURE_REPORT_INSTRUCTOR_INFO_PARAGRAPH_ID,
    kind: 'single_item',
    variant: 'user_info',
    requiredMark: false,
    answerRequired: false,
    paragraphTitle: '강사 정보',
    paragraphDescription: '',
    participatesInTitleNumbering: false,
    selectedUserFieldKeys: ['name'],
    fieldAnswers: { name: name || '-' },
  }
}

function insertInstructorInfoParagraph(
  paragraphs: WritingFormParagraph[],
  instructorName: string
): WritingFormParagraph[] {
  if (paragraphs.some(isInstructorInfoParagraph)) {
    return paragraphs.map(paragraph => {
      if (!isInstructorInfoParagraph(paragraph) || paragraph.variant !== 'user_info') {
        return paragraph
      }
      const name = instructorName.trim() || '-'
      return {
        ...paragraph,
        paragraphTitle: paragraph.paragraphTitle?.trim() || '강사 정보',
        requiredMark: false,
        answerRequired: false,
        selectedUserFieldKeys:
          paragraph.selectedUserFieldKeys?.length ? paragraph.selectedUserFieldKeys : ['name'],
        fieldAnswers: { ...paragraph.fieldAnswers, name },
      }
    })
  }
  const instructorParagraph = createInstructorInfoParagraph(instructorName)
  const titleIndex = paragraphs.findIndex(
    paragraph => paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period'
  )
  if (titleIndex < 0) return [instructorParagraph, ...paragraphs]
  return [
    ...paragraphs.slice(0, titleIndex + 1),
    instructorParagraph,
    ...paragraphs.slice(titleIndex + 1),
  ]
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
    paragraphs: insertInstructorInfoParagraph(
      base.paragraphs.map(paragraph => {
        const withTitle = fillSurveyTitleParagraph(paragraph, programTitle)
        return fillProgramProgressParagraph(withTitle, ctx)
      }),
      ctx.instructor.instructorName ?? ''
    ),
  }
  return {
    ...filled,
    paragraphs: filled.paragraphs.map(paragraph =>
      stripLectureReportViewRequiredMark(
        applyLectureReportAnswer(paragraph, ctx.content?.answers)
      )
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
