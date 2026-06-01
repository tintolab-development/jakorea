import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import type { ScaleTypeItem, WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { resolveSurveyWritingDraft } from './survey-writing-draft'
import type { SurveyPollRawResponse } from './survey-management-types'

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
      scaleItems: ScaleTypeItem[]
      data: SurveyScaleChartDatum[]
    }
  | {
      kind: 'text'
      paragraphId: string
      title: string
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

export function aggregateScaleResults(
  responses: SurveyPollRawResponse[],
  paragraphId: string,
  scaleItems: ScaleTypeItem[]
): SurveyScaleChartDatum[] {
  const counts = new Map<string, number>()
  for (const item of scaleItems) {
    counts.set(item.id, 0)
  }
  for (const response of responses) {
    const answer = response.answers[paragraphId]
    if (answer == null || answer === '') continue
    counts.set(answer, (counts.get(answer) ?? 0) + 1)
  }
  return scaleItems.map((item, index) => ({
    itemId: item.id,
    label: item.label,
    count: counts.get(item.id) ?? 0,
    color: SURVEY_SCALE_BAR_COLORS[index] ?? SURVEY_SCALE_BAR_COLORS[0],
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
  return getFormNavDisplayLine(paragraphs, paragraph, 'q123')
}

export function buildSurveyPollResultSections(
  templateId: string,
  responses: SurveyPollRawResponse[]
): SurveyPollResultSection[] {
  const draft = resolveSurveyWritingDraft(templateId)
  const sections: SurveyPollResultSection[] = []

  for (const paragraph of draft.paragraphs) {
    if (paragraph.kind !== 'single_item') continue

    if (paragraph.variant === 'scale_type') {
      sections.push({
        kind: 'scale',
        paragraphId: paragraph.id,
        title: getParagraphTitle(draft.paragraphs, paragraph),
        scaleItems: paragraph.items,
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
