import {
  createDefaultSurveyDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  type WritingFormDraft,
  type WritingFormParagraph,
} from './draft-schema.js'

/**
 * 작성 양식 > 설문 양식 카탈로그 시드 (템플릿 관리 · 시드 내보내기 전용).
 * 프로그램 설문 기본값(`createDefaultSurveyDraft`)은 그대로 두고, 템플릿별 시안 차이만 덮는다.
 */

function findSeedParagraph(draft: WritingFormDraft, id: string): WritingFormParagraph {
  const found = draft.paragraphs.find(p => p.id === id)
  if (found == null) throw new Error(`survey seed paragraph missing: ${id}`)
  return found
}

/** 만족도조사 (학생용) — 시안 5767:43362: 설문자 정보 기본 선택 이름·생년월일·자택 주소지(지역)·소속 */
export const SURVEY_STUDENT_SEED_SELECTED_USER_FIELD_KEYS = [
  'name',
  'birthDate',
  'addressRegion',
  'affiliation',
] as const

export function createSurveyStudentTemplateDraft(): WritingFormDraft {
  const base = createDefaultSurveyDraft()
  return {
    ...base,
    paragraphs: base.paragraphs.map(p =>
      p.id === DEFAULT_SURVEY_PARAGRAPH_IDS.user &&
      p.kind === 'single_item' &&
      p.variant === 'user_info'
        ? { ...p, selectedUserFieldKeys: [...SURVEY_STUDENT_SEED_SELECTED_USER_FIELD_KEYS] }
        : p
    ),
  }
}

/**
 * 설문조사 (survey-default) — 시안 5767:42989 · 미리보기 5767:50266.
 * Q1 설문자 정보 / Q2·Q3 점수 선택형(미선택) / Q4·Q5 주관식 / 마무리글.
 */
export function createSurveyDefaultTemplateDraft(): WritingFormDraft {
  const base = createDefaultSurveyDraft()
  const title = findSeedParagraph(base, DEFAULT_SURVEY_PARAGRAPH_IDS.title)
  const user = findSeedParagraph(base, DEFAULT_SURVEY_PARAGRAPH_IDS.user)
  const scale = findSeedParagraph(base, DEFAULT_SURVEY_PARAGRAPH_IDS.score2)
  const essay = findSeedParagraph(base, DEFAULT_SURVEY_PARAGRAPH_IDS.subjective)
  const closing = findSeedParagraph(base, DEFAULT_SURVEY_PARAGRAPH_IDS.closing)
  if (scale.kind !== 'single_item' || scale.variant !== 'scale_type') {
    throw new Error('survey seed scale paragraph variant mismatch')
  }
  if (essay.kind !== 'single_item' || essay.variant !== 'short_essay') {
    throw new Error('survey seed short essay paragraph variant mismatch')
  }

  const scaleParagraph = (id: string, paragraphTitle: string): WritingFormParagraph => ({
    ...scale,
    id,
    paragraphTitle,
    paragraphDescription: '설명 입력',
    items: scale.items.map(it => ({ ...it })),
    // 시안: 점수 선택형 미선택
    selectedPreviewItemId: null,
  })

  const essayParagraph = (
    id: string,
    itemId: string,
    paragraphTitle: string,
    paragraphDescription: string
  ): WritingFormParagraph => ({
    ...essay,
    id,
    paragraphTitle,
    paragraphDescription,
    items: (essay.items ?? []).map(it => ({ ...it, id: itemId })),
  })

  return {
    ...base,
    paragraphs: [
      title,
      user,
      scaleParagraph(
        DEFAULT_SURVEY_PARAGRAPH_IDS.score,
        '오리엔테이션에서 제공된 정보가 이해하기 쉬웠나요?'
      ),
      scaleParagraph(
        DEFAULT_SURVEY_PARAGRAPH_IDS.score2,
        '프로그램 전반적인 프로세스에 대해 명확히 이해했나요?'
      ),
      essayParagraph(
        DEFAULT_SURVEY_PARAGRAPH_IDS.subjective,
        'survey-short-essay-item-1',
        '오늘 강의에서 배운 점, 기억나는 점, 좋았던 점 등을 작성해 주세요.',
        '설명 입력'
      ),
      essayParagraph(
        DEFAULT_SURVEY_PARAGRAPH_IDS.subjective2,
        'survey-short-essay-item-2',
        '기타 의견이 있다면 작성해 주세요.',
        '교육 워크숍 진행, 강의 내용 등에 대한 기타 의견을 작성해 주세요.'
      ),
      closing,
    ],
  }
}

/** 설문 양식 템플릿 코드 → 템플릿 관리 시드 (그 외 설문은 공통 시드) */
export function createSurveyTemplateSeedDraft(
  templateCode: string | null | undefined
): WritingFormDraft {
  const code = (templateCode ?? '').trim()
  if (code === 'survey-default') return createSurveyDefaultTemplateDraft()
  if (code === 'survey-student') return createSurveyStudentTemplateDraft()
  return createDefaultSurveyDraft()
}
