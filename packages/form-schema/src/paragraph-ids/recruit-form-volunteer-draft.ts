import {
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'

/** 프로그램 봉사자 모집 폼 — 시드 단락 ID */
export const RECRUIT_FORM_VOLUNTEER_IDS = {
  recruitInfo: 'recruit-form-volunteer-seed-recruit-info',
  detailInfo: 'recruit-form-volunteer-seed-detail-info',
  interviewSchedule: 'recruit-form-volunteer-seed-interview-schedule',
} as const

export const RECRUIT_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS = new Set<string>(
  Object.values(RECRUIT_FORM_VOLUNTEER_IDS)
)

function createSeedHorizontalTable(
  id: string,
  paragraphTitle: string,
  paragraphDescription: string,
  options?: { required?: boolean }
): HorizontalTableParagraph {
  const required = options?.required !== false
  return normalizeHorizontalTableParagraph({
    id,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: required,
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
    answerRequired: required,
  })
}

export function createRecruitFormVolunteerDraft(): WritingFormDraft {
  const paragraphs: WritingFormParagraph[] = [
    createSeedHorizontalTable(
      RECRUIT_FORM_VOLUNTEER_IDS.recruitInfo,
      '봉사자 모집 정보',
      '설명 입력'
    ),
    createSeedHorizontalTable(
      RECRUIT_FORM_VOLUNTEER_IDS.detailInfo,
      '상세 정보',
      '공란인 경우, 홈페이지 모집 상세에서 항목 미노출됩니다.',
      { required: false }
    ),
    createSeedHorizontalTable(
      RECRUIT_FORM_VOLUNTEER_IDS.interviewSchedule,
      '면접 진행 가능 일정',
      '서류 합격 시 면접이 진행됩니다. 면접이 진행 가능한 일정 모두 선택해 주세요.'
    ),
  ]
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs,
  })
}
