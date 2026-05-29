import type { UjatSurveyPollRawResponse } from '@/data/mock/ujat-survey-poll-responses-mock'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import {
  createDefaultSurveyDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  type ScaleTypeItem,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'

export type UjatSurveyScaleChartDatum = {
  itemId: string
  label: string
  count: number
  color: string
}

export type UjatSurveyTextResponseRow = {
  content: string
  respondentName: string
}

export type UjatSurveyPollResultSection =
  | {
      kind: 'scale'
      paragraphId: string
      title: string
      scaleItems: ScaleTypeItem[]
      data: UjatSurveyScaleChartDatum[]
    }
  | {
      kind: 'text'
      paragraphId: string
      title: string
      rows: UjatSurveyTextResponseRow[]
    }

/** 시안 유사 5색 팔레트 (척도 항목 순) */
export const UJAT_SURVEY_SCALE_BAR_COLORS = [
  '#007A85',
  '#01A1AF',
  '#4DBEC8',
  '#5B7FD4',
  '#7B6FD4',
] as const

export function aggregateScaleResults(
  responses: UjatSurveyPollRawResponse[],
  paragraphId: string,
  scaleItems: ScaleTypeItem[]
): UjatSurveyScaleChartDatum[] {
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
    color: UJAT_SURVEY_SCALE_BAR_COLORS[index] ?? UJAT_SURVEY_SCALE_BAR_COLORS[0],
  }))
}

export function aggregateTextResults(
  responses: UjatSurveyPollRawResponse[],
  paragraphId: string
): UjatSurveyTextResponseRow[] {
  return responses
    .map(response => ({
      content: response.answers[paragraphId]?.trim() ?? '',
      respondentName: response.respondentName,
    }))
    .filter(row => row.content.length > 0)
}

function resolveSurveyDraftForTemplate(templateId: string) {
  const row = findWritingTemplateRowByDefinitionId(templateId)
  const draft = createDefaultSurveyDraft()
  const name = row?.templateName?.trim()
  if (name == null || name === '') return draft
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph =>
      paragraph.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title
        ? { ...paragraph, surveyTitle: name }
        : paragraph
    ),
  }
}

function getParagraphTitle(paragraphs: WritingFormParagraph[], paragraph: WritingFormParagraph) {
  return getFormNavDisplayLine(paragraphs, paragraph, 'q123')
}

export function buildSurveyPollResultSections(
  templateId: string,
  responses: UjatSurveyPollRawResponse[]
): UjatSurveyPollResultSection[] {
  const draft = resolveSurveyDraftForTemplate(templateId)
  const sections: UjatSurveyPollResultSection[] = []

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
