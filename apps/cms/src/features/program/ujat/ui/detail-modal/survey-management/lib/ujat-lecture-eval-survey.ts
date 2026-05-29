import {
  createDefaultSurveyDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  normalizeWritingFormDraft,
  type ScaleTypeParagraph,
  type ShortEssayParagraph,
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

/** UI 검증용 — 기본 false. 로컬에서 true로 바꿔 in_progress / finished 흐름 테스트 */
export const UJAT_LECTURE_EVAL_DEV_AUTO_PROGRESS = false
export const UJAT_LECTURE_EVAL_DEV_AUTO_FINISH_ON_SUBMIT = false

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

export function buildLectureEvalFormDraft(templateName?: string): WritingFormDraft {
  const base = normalizeWritingFormDraft(createDefaultSurveyDraft())
  const name = templateName?.trim()

  return normalizeWritingFormDraft({
    ...base,
    paragraphs: base.paragraphs.map(paragraph => {
      if (paragraph.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title) {
        return {
          ...paragraph,
          surveyTitle: name != null && name !== '' ? name : '설문 제목 입력',
          periodMode: 'custom',
          startAt: LECTURE_EVAL_MOCK_PERIOD.startAt,
          endAt: LECTURE_EVAL_MOCK_PERIOD.endAt,
          showWritingPeriodOnForm: true,
        }
      }
      return clearAnswerDefaults(paragraph)
    }),
  })
}

function getShortEssayText(paragraph: ShortEssayParagraph): string {
  if (paragraph.items != null && paragraph.items.length > 0) {
    return paragraph.items.map(item => item.bodyText.trim()).join('\n').trim()
  }
  return paragraph.bodyText.trim()
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

export function canEditLectureEvalResponse(survey: UjatRegisteredSurvey): boolean {
  return survey.status !== 'finished'
}

export function isLectureEvalFormPhase(survey: UjatRegisteredSurvey, submitted: boolean): boolean {
  if (submitted) return false
  return survey.status === 'in_progress' || survey.status === 'finished'
}
