import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import {
  LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS,
  createLectureReportIssuanceDraft,
  normalizeWritingFormDraft,
  type LectureReportProgramProgressParagraph,
  type SessionPlanShortEssayParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type { Program } from '@/types/domain'

export const LECTURE_REPORT_DOCUMENT_TITLE = '강의보고서'

export interface LectureReportPreviewRowContext {
  id: string
  no: number
  schoolName: string
  educationGrade: string
  educationScheduleLabel: string
}

export interface LectureReportPreviewContext {
  instructor: ParticipatingInstructorRow
  program?: Program | null
  row: LectureReportPreviewRowContext
}

export function buildLectureReportPreviewContext(
  instructor: ParticipatingInstructorRow,
  program: Program | null | undefined,
  row: LectureReportPreviewRowContext
): LectureReportPreviewContext {
  return { instructor, program, row }
}

const EDUCATION_CONTENT_MOCK = [
  '경제의 기본 개념인 수요와 공급, 가격 결정 원리를 중심으로 학습했습니다. 학생들이 일상 속 경제 사례와 연결해 이해할 수 있도록 설명했습니다.',
  '교재 활동과 모의 경제 게임, 시각 자료를 활용해 강의를 진행했습니다. 그룹 토론과 질의응답 시간을 통해 학습 내용을 실습으로 연결했습니다.',
]

const EDUCATION_OPERATION_MOCK = [
  '학생들이 전반적으로 적극적으로 참여했으며, 질문과 토론에도 성실히 응했습니다.',
  '교육 콘텐츠 난이도는 학년 수준에 적합했으며, 일부 학생에게는 보충 설명이 도움이 되었습니다.',
  '특이사항 없이 원활하게 진행되었습니다.',
]

const OVERALL_EVALUATION_MOCK =
  '학생들의 참여도가 높았고, 경제 개념을 일상 사례와 연결한 설명이 효과적이었습니다. 다음에는 시각 자료를 더 다양하게 활용하고, 그룹 활동 시간을 조금 더 확보하면 좋겠습니다.'

function resolveProgramTitle(program?: Program | null): string {
  return program?.mainTitle?.trim() || program?.title?.trim() || 'JA Korea 경제교육 프로그램'
}

function parseEducationScheduleLabel(label: string): {
  startDateLabel: string
  endDateLabel: string
  sessionLabel: string
  sessionIndex: string
} {
  const pipeParts = label.split('|').map(part => part.trim())
  const sessionLabel = pipeParts[1] ?? '1회차'
  const sessionIndex = sessionLabel.replace(/회차$/, '').trim() || '1'
  const rangePart = pipeParts[0]?.trim() ?? label
  const [startDateLabel = '-', endDateLabel = '-'] = rangePart.split('~').map(part => part.trim())
  return { startDateLabel, endDateLabel, sessionLabel, sessionIndex }
}

function toIsoDateFromLabel(dateLabel: string): string {
  const normalized = dateLabel.replace(/\([^)]*\)/g, '').replace(/\./g, '-').replace(/\s+/g, '')
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
    surveyTitle: `JA KOREA 「${programTitle}」 ${LECTURE_REPORT_DOCUMENT_TITLE}`,
  }
}

function fillProgramProgressParagraph(
  paragraph: WritingFormParagraph,
  ctx: LectureReportPreviewContext
): WritingFormParagraph {
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'lecture_report_program_progress') {
    return paragraph
  }
  const { startDateLabel, sessionIndex } = parseEducationScheduleLabel(
    ctx.row.educationScheduleLabel
  )
  const p = paragraph as LectureReportProgramProgressParagraph
  return {
    ...p,
    programName: resolveProgramTitle(ctx.program),
    finalInstructorCount: '1명',
    institutionName: ctx.row.schoolName,
    institutionLocation: ctx.instructor.region ?? '-',
    educationDate: toIsoDateFromLabel(startDateLabel) || startDateLabel,
    sessionTime: '09:00 ~ 11:00',
    sessionIndex: `${sessionIndex}회차`,
    educationTarget: ctx.row.educationGrade,
    classLabel: ctx.row.educationGrade,
    studentCount: '24명',
  }
}

function fillSessionPlanParagraph(
  paragraph: WritingFormParagraph,
  _sessionIndex: number
): WritingFormParagraph {
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'session_plan_short_essay') {
    return paragraph
  }
  const p = paragraph as SessionPlanShortEssayParagraph

  if (p.id === LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.educationOperation) {
    const updatedItems = (p.items ?? []).map((item, index) => ({
      ...item,
      bodyText: EDUCATION_OPERATION_MOCK[index] ?? EDUCATION_OPERATION_MOCK[0]!,
    }))
    return { ...p, items: updatedItems }
  }

  if (p.id === LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.educationContent) {
    const updatedItems = (p.items ?? []).map((item, index) => ({
      ...item,
      bodyText: EDUCATION_CONTENT_MOCK[index] ?? EDUCATION_CONTENT_MOCK[0]!,
    }))
    return { ...p, items: updatedItems, bodyText: EDUCATION_CONTENT_MOCK[0]! }
  }

  if (p.id === LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.overallEvaluation) {
    const updatedItems = (p.items ?? []).map(item => ({
      ...item,
      bodyText: OVERALL_EVALUATION_MOCK,
    }))
    return { ...p, items: updatedItems, bodyText: OVERALL_EVALUATION_MOCK }
  }

  return p
}

export function buildLectureReportFilledDraft(ctx: LectureReportPreviewContext): WritingFormDraft {
  const programTitle = resolveProgramTitle(ctx.program)

  const base = normalizeWritingFormDraft(createLectureReportIssuanceDraft())
  return {
    ...base,
    paragraphs: base.paragraphs.map(paragraph => {
      const withTitle = fillSurveyTitleParagraph(paragraph, programTitle)
      const withProgress = fillProgramProgressParagraph(withTitle, ctx)
      return fillSessionPlanParagraph(withProgress, 0)
    }),
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
