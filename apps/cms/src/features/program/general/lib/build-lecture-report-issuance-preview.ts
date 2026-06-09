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

const SESSION_MOCK_CONTENT: Array<{ intro: string; body: string; outro: string }> = [
  {
    intro:
      '오늘 수업의 목표와 경제 개념을 간단히 소개하는 아이스브레이킹 활동을 진행했습니다. 학생들이 흥미를 가질 수 있도록 일상 속 경제 사례를 이야기 나누며 수업에 대한 기대감을 높였습니다.',
    body:
      '경제의 기본 개념인 수요와 공급, 가격 결정 원리를 설명했습니다. 학생들이 직접 시장 상황을 체험할 수 있는 모의 경제 게임을 실시하여 이론을 실습으로 연결했습니다.',
    outro:
      '오늘 배운 내용을 정리하고 핵심 개념을 복습했습니다. 학생들의 질의응답 시간을 가진 후, 다음 차시 예고와 함께 과제를 안내했습니다.',
  },
  {
    intro:
      '지난 차시 복습을 통해 학습 연속성을 확보하고, 이번 차시 주제인 저축과 투자의 차이를 소개했습니다.',
    body:
      '저축의 종류와 이자율의 개념을 학습하고, 간단한 복리 계산 실습을 진행했습니다. 투자의 위험성과 수익성을 비교 분석하는 그룹 활동을 진행했습니다.',
    outro:
      '저축과 투자의 장단점을 비교 정리했습니다. 학생들이 배운 내용을 바탕으로 본인만의 저축 계획을 세워보는 활동지를 배포하고 마무리했습니다.',
  },
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
  sessionIndex: number
): WritingFormParagraph {
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'session_plan_short_essay') {
    return paragraph
  }
  const p = paragraph as SessionPlanShortEssayParagraph
  const content = SESSION_MOCK_CONTENT[sessionIndex % SESSION_MOCK_CONTENT.length]!
  const itemCount = p.items?.length ?? 0

  if (p.id === LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.educationOperation) {
    const updatedItems = (p.items ?? []).map((item, index) => ({
      ...item,
      bodyText: EDUCATION_OPERATION_MOCK[index] ?? EDUCATION_OPERATION_MOCK[0]!,
    }))
    return { ...p, items: updatedItems }
  }

  if (p.id === LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.overallEvaluation) {
    const updatedItems = (p.items ?? []).map(item => ({
      ...item,
      bodyText: OVERALL_EVALUATION_MOCK,
    }))
    return { ...p, items: updatedItems, bodyText: OVERALL_EVALUATION_MOCK }
  }

  if (itemCount >= 3) {
    const updatedItems = (p.items ?? []).map((item, index) => {
      if (index === 0) return { ...item, bodyText: content.intro }
      if (index === 1) return { ...item, bodyText: content.body }
      return { ...item, bodyText: content.outro }
    })
    return { ...p, items: updatedItems, bodyText: content.intro }
  }

  return p
}

export function buildLectureReportFilledDraft(ctx: LectureReportPreviewContext): WritingFormDraft {
  const programTitle = resolveProgramTitle(ctx.program)
  const sessionIndex = Math.max(0, Number.parseInt(
    parseEducationScheduleLabel(ctx.row.educationScheduleLabel).sessionIndex,
    10
  ) - 1)

  const base = normalizeWritingFormDraft(createLectureReportIssuanceDraft())
  return {
    ...base,
    paragraphs: base.paragraphs.map(paragraph => {
      const withTitle = fillSurveyTitleParagraph(paragraph, programTitle)
      const withProgress = fillProgramProgressParagraph(withTitle, ctx)
      return fillSessionPlanParagraph(withProgress, sessionIndex)
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
