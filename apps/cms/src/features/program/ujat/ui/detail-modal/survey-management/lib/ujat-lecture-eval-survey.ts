import type { UjatSurveyPollRawResponse } from '@/data/mock/ujat-survey-poll-responses-mock'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import { loadWritingFormTemplateSave } from '@/features/template/lib/writing-form-template-local-save'
import {
  createDefaultSurveyDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  normalizeWritingFormDraft,
  type ScaleTypeParagraph,
  type ShortEssayParagraph,
  type TitleWithPeriodParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type { UjatRegisteredSurvey } from './ujat-satisfaction-survey'

export const UJAT_LECTURE_EVAL_TEMPLATE_ID = 'survey-admin'

export type UjatLectureEvalTabKey = 'eval' | 'results'

export const UJAT_LECTURE_EVAL_TABS = [
  { key: 'eval' as const, label: '강의 평가' },
  { key: 'results' as const, label: '결과' },
]

/** 제출 시 mock 설문 종료·결과 탭 접근 (API 연동 전) */
export const UJAT_LECTURE_EVAL_DEV_AUTO_FINISH_ON_SUBMIT = true

export const UJAT_LECTURE_EVAL_STRUCTURE_LOCKED_IDS = new Set<string>([
  DEFAULT_SURVEY_PARAGRAPH_IDS.title,
  DEFAULT_SURVEY_PARAGRAPH_IDS.user,
  DEFAULT_SURVEY_PARAGRAPH_IDS.closing,
])

export type UjatLectureEvalValidationResult =
  | { valid: true }
  | { valid: false; message: string }

const LECTURE_EVAL_MOCK_PERIOD = {
  startAt: '2026-09-15',
  endAt: '2026-10-05',
} as const

const LECTURE_EVAL_RESPONDENT_NAME = '홍길동'
const LECTURE_EVAL_RESPONDENT_REGION = '서울특별시 강서구 화곡동'

export type ResolveLectureEvalWritingDraftOptions = {
  clearAnswers?: boolean
  templateName?: string
}

function clearAnswerDefaults(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (paragraph.kind !== 'single_item') return paragraph

  if (paragraph.variant === 'scale_type') {
    return {
      ...paragraph,
      selectedPreviewItemId: null,
    } satisfies ScaleTypeParagraph
  }

  if (paragraph.variant === 'short_essay') {
    const clearedItems =
      paragraph.items?.map(item => ({ ...item, bodyText: '' })) ??
      [{ id: 'short-essay-item-1', label: 'Title 01', placeholder: '답변을 입력해 주세요', bodyText: '' }]
    return {
      ...paragraph,
      bodyText: '',
      items: clearedItems,
    } satisfies ShortEssayParagraph
  }

  return paragraph
}

function applyLectureEvalTitleParagraph(
  paragraph: WritingFormParagraph,
  displayName: string | undefined,
  clearAnswers: boolean
): WritingFormParagraph {
  if (paragraph.id !== DEFAULT_SURVEY_PARAGRAPH_IDS.title) {
    return clearAnswers ? clearAnswerDefaults(paragraph) : paragraph
  }
  if (paragraph.kind !== 'description' || paragraph.variant !== 'survey_title_with_period') {
    return paragraph
  }
  const titleParagraph = paragraph as TitleWithPeriodParagraph
  return {
    ...titleParagraph,
    surveyTitle:
      displayName != null && displayName !== '' ? displayName : titleParagraph.surveyTitle || '설문 제목 입력',
    periodMode: 'custom',
    startAt: LECTURE_EVAL_MOCK_PERIOD.startAt,
    endAt: LECTURE_EVAL_MOCK_PERIOD.endAt,
    showWritingPeriodOnForm: true,
  }
}

/** 등록·응답·결과 집계 공통 — 양식 관리 localStorage draft 우선 */
export function resolveLectureEvalWritingDraft(
  templateId: string,
  options?: ResolveLectureEvalWritingDraftOptions
): WritingFormDraft {
  const clearAnswers = options?.clearAnswers ?? false
  const saved = loadWritingFormTemplateSave(templateId)
  const row = findWritingTemplateRowByDefinitionId(templateId)
  const displayName = (options?.templateName ?? row?.templateName)?.trim()

  let base: WritingFormDraft
  if (saved?.draft != null) {
    base = normalizeWritingFormDraft(saved.draft)
  } else {
    const defaultDraft = normalizeWritingFormDraft(createDefaultSurveyDraft())
    if (displayName == null || displayName === '') {
      base = defaultDraft
    } else {
      base = normalizeWritingFormDraft({
        ...defaultDraft,
        paragraphs: defaultDraft.paragraphs.map(paragraph =>
          paragraph.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title
            ? { ...paragraph, surveyTitle: displayName }
            : paragraph
        ),
      })
    }
  }

  return normalizeWritingFormDraft({
    ...base,
    paragraphs: base.paragraphs.map(paragraph =>
      applyLectureEvalTitleParagraph(paragraph, displayName, clearAnswers)
    ),
  })
}

export function buildLectureEvalFormDraft(templateId: string): WritingFormDraft {
  return resolveLectureEvalWritingDraft(templateId, { clearAnswers: true })
}

function getShortEssayText(paragraph: ShortEssayParagraph): string {
  if (paragraph.items != null && paragraph.items.length > 0) {
    return paragraph.items.map(item => item.bodyText.trim()).join('\n').trim()
  }
  return paragraph.bodyText.trim()
}

export function getLectureEvalPeriodEndAt(formDraft: WritingFormDraft | null | undefined): string | null {
  if (formDraft == null) return LECTURE_EVAL_MOCK_PERIOD.endAt
  const title = formDraft.paragraphs.find(
    p => p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title && p.kind === 'description'
  )
  if (title == null || title.variant !== 'survey_title_with_period') {
    return LECTURE_EVAL_MOCK_PERIOD.endAt
  }
  return title.endAt ?? LECTURE_EVAL_MOCK_PERIOD.endAt
}

export function draftToLectureEvalPollResponse(draft: WritingFormDraft): UjatSurveyPollRawResponse {
  const answers: Record<string, string> = {}

  for (const paragraph of draft.paragraphs) {
    if (paragraph.kind !== 'single_item') continue

    if (paragraph.variant === 'scale_type') {
      const selected = paragraph.selectedPreviewItemId
      if (selected != null && selected !== '') {
        answers[paragraph.id] = selected
      }
      continue
    }

    if (paragraph.variant === 'short_essay') {
      const text = getShortEssayText(paragraph)
      if (text !== '') {
        answers[paragraph.id] = text
      }
    }
  }

  return {
    respondentId: 'ujat-lecture-eval-admin',
    respondentName: LECTURE_EVAL_RESPONDENT_NAME,
    addressRegion: LECTURE_EVAL_RESPONDENT_REGION,
    answers,
  }
}

export function validateLectureEvalFormDraft(draft: WritingFormDraft): UjatLectureEvalValidationResult {
  for (const paragraph of draft.paragraphs) {
    if (paragraph.kind !== 'single_item') continue

    if (paragraph.variant === 'scale_type' && paragraph.answerRequired !== false) {
      if (paragraph.selectedPreviewItemId == null || paragraph.selectedPreviewItemId === '') {
        const title = paragraph.paragraphTitle.trim() || '척도형 문항'
        return { valid: false, message: `${title}에 답변해 주세요.` }
      }
    }

    if (paragraph.variant === 'short_essay' && paragraph.answerRequired !== false) {
      if (getShortEssayText(paragraph) === '') {
        const title = paragraph.paragraphTitle.trim() || '주관식 문항'
        return { valid: false, message: `${title}에 답변을 입력해 주세요.` }
      }
    }
  }

  return { valid: true }
}

export function isLectureEvalResultsTabAccessible(survey: UjatRegisteredSurvey): boolean {
  return survey.status === 'finished'
}

export function canEditLectureEvalResponse(
  _survey: UjatRegisteredSurvey,
  formDraft?: WritingFormDraft | null
): boolean {
  const endAt = getLectureEvalPeriodEndAt(formDraft)
  if (endAt == null || endAt === '') return true
  const today = new Date().toISOString().slice(0, 10)
  return today <= endAt
}

export function isLectureEvalFormPhase(survey: UjatRegisteredSurvey, submitted: boolean): boolean {
  if (submitted) return false
  return survey.status === 'in_progress' || survey.status === 'finished'
}
