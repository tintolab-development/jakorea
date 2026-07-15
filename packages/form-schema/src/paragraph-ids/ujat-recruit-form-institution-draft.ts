import {
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'

/** UJAT 프로그램 학교 모집 폼 — 시드 단락 ID */
export const UJAT_RECRUIT_FORM_INSTITUTION_IDS = {
  participantRecruitInfo: 'ujat-recruit-institution-seed-recruit-info',
  detailInfo: 'ujat-recruit-institution-seed-detail-info',
} as const

export const UJAT_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS = new Set<string>(
  Object.values(UJAT_RECRUIT_FORM_INSTITUTION_IDS)
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

export function createUjatRecruitFormInstitutionDraft(): WritingFormDraft {
  const paragraphs: WritingFormParagraph[] = [
    createSeedHorizontalTable(
      UJAT_RECRUIT_FORM_INSTITUTION_IDS.participantRecruitInfo,
      '참여자 모집 정보',
      '설명 입력'
    ),
    createSeedHorizontalTable(
      UJAT_RECRUIT_FORM_INSTITUTION_IDS.detailInfo,
      '참여자 상세 정보',
      "공란인 경우, 홈페이지 모집 상세에서 해당 항목 비노출 (관리자 > 프로그램 상세에서는 항목 노출 + 텍스트 '-'로 노출)"
    ),
  ]
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs,
  })
}
