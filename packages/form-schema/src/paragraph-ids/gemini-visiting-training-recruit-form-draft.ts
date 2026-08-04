import {
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'

/** Gemini 찾아가는 연수 모집 폼 — 시드 단락 ID */
export const GEMINI_VISITING_TRAINING_RECRUIT_FORM_IDS = {
  recruitInfo: 'gemini-vt-recruit-seed-recruit-info',
  detailInfo: 'gemini-vt-recruit-seed-detail-info',
} as const

export const GEMINI_VISITING_TRAINING_RECRUIT_FORM_SEED_PARAGRAPH_IDS = new Set<string>(
  Object.values(GEMINI_VISITING_TRAINING_RECRUIT_FORM_IDS)
)

function createSeedHorizontalTable(
  id: string,
  paragraphTitle: string,
  paragraphDescription: string
): HorizontalTableParagraph {
  return normalizeHorizontalTableParagraph({
    id,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle,
    paragraphDescription,
    participatesInTitleNumbering: true,
    tableFlavor: 'text',
    columnHeaders: ['항목', '내용'],
    dataRows: [['', '']],
    columnFields: [],
    fieldDataRows: [],
    bottomText: '',
    showBottomText: false,
    showBottomConsent: false,
    bottomConsent: 'agree',
    answerRequired: true,
  })
}

export function createGeminiVisitingTrainingRecruitFormDraft(): WritingFormDraft {
  const paragraphs: WritingFormParagraph[] = [
    createSeedHorizontalTable(
      GEMINI_VISITING_TRAINING_RECRUIT_FORM_IDS.recruitInfo,
      '참여 기관 모집 정보',
      '설명 입력'
    ),
    createSeedHorizontalTable(
      GEMINI_VISITING_TRAINING_RECRUIT_FORM_IDS.detailInfo,
      '상세 정보',
      '공란인 경우, 홈페이지 모집 상세에서 항목 미노출 됩니다.'
    ),
  ]
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs,
  })
}
