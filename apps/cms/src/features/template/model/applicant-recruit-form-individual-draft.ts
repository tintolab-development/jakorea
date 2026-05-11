import {
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

/** 프로그램 참여자 모집 폼 (개인) — 시드 단락 ID (학교용 ID와 분리) */
export const APPLICANT_RECRUIT_FORM_INDIVIDUAL_IDS = {
  participantRecruitInfo: 'applicant-recruit-individual-seed-recruit-info',
  detailInfo: 'applicant-recruit-individual-seed-detail-info',
} as const

export const APPLICANT_RECRUIT_FORM_INDIVIDUAL_SEED_PARAGRAPH_IDS = new Set<string>(
  Object.values(APPLICANT_RECRUIT_FORM_INDIVIDUAL_IDS)
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

export function createApplicantRecruitFormIndividualDraft(): WritingFormDraft {
  const paragraphs: WritingFormParagraph[] = [
    createSeedHorizontalTable(
      APPLICANT_RECRUIT_FORM_INDIVIDUAL_IDS.participantRecruitInfo,
      '참여자 모집 정보',
      '설명 입력'
    ),
    createSeedHorizontalTable(
      APPLICANT_RECRUIT_FORM_INDIVIDUAL_IDS.detailInfo,
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
