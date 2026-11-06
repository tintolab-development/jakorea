import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import type {
  ScaleTypeItem,
  WritingFormDraft,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { resolveSurveyWritingDraft } from './survey-writing-draft'
import type {
  SurveyPollRawResponse,
  SurveyQuestionOptionCount,
  SurveyResultQuestionSummary,
} from './survey-management-types'

export type SurveyScaleChartDatum = {
  itemId: string
  label: string
  count: number
  color: string
}

export type SurveyTextResponseRow = {
  content: string
  respondentName: string
}

export type SurveyPollResultSection =
  | {
      kind: 'scale'
      paragraphId: string
      title: string
      required?: boolean
      data: SurveyScaleChartDatum[]
    }
  | {
      kind: 'text'
      paragraphId: string
      title: string
      required?: boolean
      rows: SurveyTextResponseRow[]
    }

/** 시안 유사 5색 팔레트 (척도 항목 순) */
export const SURVEY_SCALE_BAR_COLORS = [
  '#007A85',
  '#01A1AF',
  '#4DBEC8',
  '#5B7FD4',
  '#7B6FD4',
] as const

function barColorAt(index: number): string {
  return SURVEY_SCALE_BAR_COLORS[index % SURVEY_SCALE_BAR_COLORS.length]!
}

export function aggregateScaleResults(
  responses: SurveyPollRawResponse[],
  paragraphId: string,
  scaleItems: ScaleTypeItem[]
): SurveyScaleChartDatum[] {
  const counts = new Map<string, number>()
  const idByLabel = new Map<string, string>()
  for (const item of scaleItems) {
    counts.set(item.id, 0)
    if (item.label.trim()) idByLabel.set(item.label.trim(), item.id)
  }
  for (const response of responses) {
    const answer = response.answers[paragraphId]?.trim()
    if (answer == null || answer === '') continue
    const itemId = counts.has(answer) ? answer : (idByLabel.get(answer) ?? answer)
    counts.set(itemId, (counts.get(itemId) ?? 0) + 1)
  }
  return scaleItems.map((item, index) => ({
    itemId: item.id,
    label: item.label,
    count: counts.get(item.id) ?? 0,
    color: barColorAt(index),
  }))
}

/** summary `options`는 서버가 템플릿 옵션 전체(0건 포함)를 준다 — displayOrder 순으로 그대로 사용 */
export function toOptionSummaryChartData(
  options: SurveyQuestionOptionCount[]
): SurveyScaleChartDatum[] {
  return [...options]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((option, index) => ({
      itemId: option.value,
      label: option.label,
      count: option.count,
      color: barColorAt(index),
    }))
}

export function aggregateTextResults(
  responses: SurveyPollRawResponse[],
  paragraphId: string
): SurveyTextResponseRow[] {
  return responses
    .map(response => ({
      content: response.answers[paragraphId]?.trim() ?? '',
      respondentName: response.respondentName,
    }))
    .filter(row => row.content.length > 0)
}

function getParagraphTitle(paragraphs: WritingFormParagraph[], paragraph: WritingFormParagraph) {
  const forNumbering = paragraphs.map(item =>
    item.kind === 'single_item' && item.variant === 'user_info'
      ? { ...item, participatesInTitleNumbering: false }
      : item
  )
  return getFormNavDisplayLine(forNumbering, paragraph, 'q123')
}

/**
 * summary 행이 있으면 version schema 없이 결과를 구성하고, 없으면 version/템플릿 draft로 집계한다.
 */
export async function buildSurveyPollResultSections(
  templateId: string,
  responses: SurveyPollRawResponse[],
  options?: { templateVersionId?: number; questionSummaries?: SurveyResultQuestionSummary[] }
): Promise<SurveyPollResultSection[]> {
  if (options?.questionSummaries != null && options.questionSummaries.length > 0) {
    return buildSurveyPollResultSectionsFromSummary(options.questionSummaries, responses)
  }
  const draft = await resolveSurveyWritingDraft(templateId, options)
  return buildSurveyPollResultSectionsFromDraft(draft, responses)
}

/** 결과 번호 — 제목·마무리·설문자 정보는 열외. 본 문항은 1번부터. */
const SUMMARY_UNNUMBERED_QUESTION_TYPES = new Set([
  'SURVEY_TITLE_WITH_PERIOD',
  'CLOSING',
  'USER_INFO',
])
const SUMMARY_CHART_QUESTION_TYPES = new Set(['SCALE_TYPE', 'MULTIPLE_CHOICE', 'STAR_RATE'])
/** 서버 주관식 문항 타입 — 설문은 `SHORT_ESSAY`, 그 외 템플릿 호환 */
export const SURVEY_ESSAY_QUESTION_TYPES: ReadonlySet<string> = new Set([
  'SHORT_ESSAY',
  'LONG_TEXT',
  'SUBJECTIVE',
])

/**
 * summary API 행(서버가 단락 순서로 정렬)만으로 결과 섹션 구성.
 * 그래프는 공개 선택형의 `options`, 주관식 표는 응답 답(`answers[questionKey]`).
 */
export function buildSurveyPollResultSectionsFromSummary(
  questions: SurveyResultQuestionSummary[],
  responses: SurveyPollRawResponse[]
): SurveyPollResultSection[] {
  const sections: SurveyPollResultSection[] = []
  let sequence = 0

  for (const question of questions) {
    if (question.displayOrder == null) continue
    const unnumbered =
      SUMMARY_UNNUMBERED_QUESTION_TYPES.has(question.questionType) ||
      question.questionLabel.trim() === '설문자 정보'
    if (!unnumbered) sequence += 1
    const label = question.questionLabel.trim() || '제목 없음'
    const title = unnumbered ? label : `Q${sequence}. ${label}`

    if (SUMMARY_CHART_QUESTION_TYPES.has(question.questionType) && question.options != null) {
      sections.push({
        kind: 'scale',
        paragraphId: question.questionKey,
        title,
        required: question.required,
        data: toOptionSummaryChartData(question.options),
      })
      continue
    }

    if (SURVEY_ESSAY_QUESTION_TYPES.has(question.questionType)) {
      sections.push({
        kind: 'text',
        paragraphId: question.questionKey,
        title,
        required: question.required,
        rows: aggregateTextResults(responses, question.questionKey),
      })
    }
  }

  return sections
}

export function buildSurveyPollResultSectionsFromDraft(
  draft: WritingFormDraft,
  responses: SurveyPollRawResponse[]
): SurveyPollResultSection[] {
  const sections: SurveyPollResultSection[] = []

  for (const paragraph of draft.paragraphs) {
    if (paragraph.kind !== 'single_item') continue

    if (paragraph.variant === 'scale_type') {
      sections.push({
        kind: 'scale',
        paragraphId: paragraph.id,
        title: getParagraphTitle(draft.paragraphs, paragraph),
        data: aggregateScaleResults(responses, paragraph.id, paragraph.items),
      })
      continue
    }

    if (paragraph.variant === 'short_essay') {
      sections.push({
        kind: 'text',
        paragraphId: paragraph.id,
        title: getParagraphTitle(draft.paragraphs, paragraph),
        rows: aggregateTextResults(responses, paragraph.id),
      })
    }
  }

  return sections
}
