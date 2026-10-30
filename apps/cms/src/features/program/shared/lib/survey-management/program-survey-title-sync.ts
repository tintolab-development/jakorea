import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

/**
 * 프로그램 설문 편집 모달 — 좌상단 설문명과 제목 단락 `surveyTitle`을 하나로 맞춘다.
 * 진실 원천은 draft 제목 단락(`survey_title_with_period`)의 `surveyTitle`이다
 * (설문 목록·탭 표시명 `readSurveyTitleFromSchema`와 같은 값).
 */
export const PROGRAM_SURVEY_HEADER_FALLBACK_TITLE = '설문조사'

type Paragraph = WritingFormDraft['paragraphs'][number]
type TitleParagraph = Extract<Paragraph, { kind: 'description' }> & {
  variant: 'survey_title_with_period'
  surveyTitle: string
}

function isSurveyTitleParagraph(paragraph: Paragraph): paragraph is TitleParagraph {
  return paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period'
}

export function readProgramSurveyTitle(draft: WritingFormDraft): string {
  const title = draft.paragraphs.find(isSurveyTitleParagraph)
  return title?.surveyTitle?.trim() ?? ''
}

export function findProgramSurveyTitleParagraphId(draft: WritingFormDraft): string | undefined {
  return draft.paragraphs.find(isSurveyTitleParagraph)?.id
}

/** 제목 단락이면 `surveyTitle`만 바꾼다 (다른 단락은 그대로) */
export function applyProgramSurveyTitleToParagraph(paragraph: Paragraph, title: string): Paragraph {
  return isSurveyTitleParagraph(paragraph) ? { ...paragraph, surveyTitle: title } : paragraph
}

export function withProgramSurveyTitle(draft: WritingFormDraft, title: string): WritingFormDraft {
  const titleId = findProgramSurveyTitleParagraphId(draft)
  if (titleId == null) return draft
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph =>
      paragraph.id === titleId ? applyProgramSurveyTitleToParagraph(paragraph, title) : paragraph
    ),
  }
}

/**
 * 초기 draft — 제목 단락이 비어 있으면 기존 좌상단 값(바인딩 설문명)으로 채워 두 값을 같게 시작한다.
 * 제목 단락에 값이 있으면 그대로 두고, 좌상단이 그 값을 따른다.
 */
export function seedProgramSurveyTitle(
  draft: WritingFormDraft,
  bindingTitle: string | undefined
): WritingFormDraft {
  if (readProgramSurveyTitle(draft) !== '') return draft
  const seed = bindingTitle?.trim() ?? ''
  return seed === '' ? draft : withProgramSurveyTitle(draft, seed)
}

/** 좌상단 표시값 — 제목 단락이 비었을 때만 기본 문구 */
export function resolveProgramSurveyHeaderTitle(draft: WritingFormDraft): string {
  return readProgramSurveyTitle(draft) || PROGRAM_SURVEY_HEADER_FALLBACK_TITLE
}
