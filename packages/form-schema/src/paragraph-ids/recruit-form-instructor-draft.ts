import {
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'

/** 프로그램 강사 모집 폼 — 시드 단락 ID */
export const RECRUIT_FORM_INSTRUCTOR_IDS = {
  recruitInfo: 'recruit-form-instructor-seed-recruit-info',
  detailInfo: 'recruit-form-instructor-seed-detail-info',
} as const

export const RECRUIT_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS = new Set<string>(
  Object.values(RECRUIT_FORM_INSTRUCTOR_IDS)
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

export function createRecruitFormInstructorDraft(): WritingFormDraft {
  const paragraphs: WritingFormParagraph[] = [
    createSeedHorizontalTable(
      RECRUIT_FORM_INSTRUCTOR_IDS.recruitInfo,
      '강사 모집 정보',
      '설명 입력'
    ),
    createSeedHorizontalTable(
      RECRUIT_FORM_INSTRUCTOR_IDS.detailInfo,
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
