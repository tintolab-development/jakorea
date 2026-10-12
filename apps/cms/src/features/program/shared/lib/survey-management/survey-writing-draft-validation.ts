import {
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

/** 설문 양식 저장 검증 — 인라인 강조 키 (`registration-wizard-incomplete-map` variant `survey`) */
export const SURVEY_WRITING_INCOMPLETE_KEYS = {
  title: 'survey.writing.title',
  middleParagraphs: 'survey.writing.middleParagraphs',
} as const

export type SurveyWritingIncompleteKey =
  (typeof SURVEY_WRITING_INCOMPLETE_KEYS)[keyof typeof SURVEY_WRITING_INCOMPLETE_KEYS]

/** 문항 부족 시 단락 id를 붙인 확장 키 (`survey.writing.middleParagraphs:<id>`) */
export type SurveyWritingIncompleteDiagnosticKey =
  | SurveyWritingIncompleteKey
  | `${typeof SURVEY_WRITING_INCOMPLETE_KEYS.middleParagraphs}:${string}`

export function normalizeSurveyWritingIncompleteKey(
  key: string
): SurveyWritingIncompleteKey | null {
  if (key === SURVEY_WRITING_INCOMPLETE_KEYS.title) return key
  if (key === SURVEY_WRITING_INCOMPLETE_KEYS.middleParagraphs) {
    return SURVEY_WRITING_INCOMPLETE_KEYS.middleParagraphs
  }
  if (key.startsWith(`${SURVEY_WRITING_INCOMPLETE_KEYS.middleParagraphs}:`)) {
    return SURVEY_WRITING_INCOMPLETE_KEYS.middleParagraphs
  }
  return null
}

const SURVEY_WRITING_INCOMPLETE_MESSAGES: Record<SurveyWritingIncompleteKey, string> = {
  [SURVEY_WRITING_INCOMPLETE_KEYS.title]: '설문 제목을 입력해 주세요.',
  [SURVEY_WRITING_INCOMPLETE_KEYS.middleParagraphs]:
    '제목과 마무리글, 설문자 정보를 제외하고 최소 1개 이상의 단락이 존재해야 합니다.',
}

export function isSurveyWritingExcludedFromMiddleCount(p: WritingFormParagraph): boolean {
  if (p.kind === 'description' && p.variant === 'survey_title_with_period') return true
  if (p.kind === 'description' && p.variant === 'closing') return true
  if (p.kind === 'single_item' && p.variant === 'user_info') return true
  return false
}

export function countSurveyWritingQuestionParagraphs(paragraphs: readonly WritingFormParagraph[]): number {
  return paragraphs.filter(p => !isSurveyWritingExcludedFromMiddleCount(p)).length
}

function isSurveyTitleParagraphFilled(draft: WritingFormDraft): boolean {
  const titleParagraph = draft.paragraphs.find(p => p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.title)
  if (
    titleParagraph?.kind === 'description' &&
    titleParagraph.variant === 'survey_title_with_period'
  ) {
    return titleParagraph.surveyTitle.trim() !== ''
  }
  return false
}

/** 저장 전 필수 미입력 진단 키 (순서 = 알림·스크롤 우선순위) */
export function listIncompleteSurveyWritingDraftKeys(
  draft: WritingFormDraft
): SurveyWritingIncompleteDiagnosticKey[] {
  const keys: SurveyWritingIncompleteDiagnosticKey[] = []
  if (!isSurveyTitleParagraphFilled(draft)) {
    keys.push(SURVEY_WRITING_INCOMPLETE_KEYS.title)
  }
  if (countSurveyWritingQuestionParagraphs(draft.paragraphs) < 1) {
    const anchor =
      draft.paragraphs.find(p => !isSurveyWritingExcludedFromMiddleCount(p))?.id ??
      DEFAULT_SURVEY_PARAGRAPH_IDS.closing
    keys.push(`${SURVEY_WRITING_INCOMPLETE_KEYS.middleParagraphs}:${anchor}`)
  }
  return keys
}

export function messageForSurveyWritingIncompleteKey(key: SurveyWritingIncompleteKey): string {
  return SURVEY_WRITING_INCOMPLETE_MESSAGES[key]
}

export function firstSurveyWritingIncompleteMessage(
  keys: readonly SurveyWritingIncompleteDiagnosticKey[]
): string {
  const first = keys[0]
  if (first == null) {
    return '입력되지 않은 필수 항목이 있습니다.'
  }
  const normalized = normalizeSurveyWritingIncompleteKey(first)
  if (normalized == null) {
    return '입력되지 않은 필수 항목이 있습니다.'
  }
  return messageForSurveyWritingIncompleteKey(normalized)
}
