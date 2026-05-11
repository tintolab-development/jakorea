import {
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type MultipleChoiceParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

/** 프로그램 참여자 신청 폼 (학교) — 시드 단락 ID (개인용 ID와 절대 공유하지 않음) */
export const PROGRAM_APPLICATION_FORM_INSTITUTION_IDS = {
  personalInfoCollection: 'program-application-institution-seed-personal-info',
  thirdPartyConsent: 'program-application-institution-seed-third-party',
  basicInfo: 'program-application-institution-seed-basic-info',
  guidance: 'program-application-institution-seed-guidance',
  scheduleChoice: 'program-application-institution-seed-schedule',
} as const

export const PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS = new Set<string>(
  Object.values(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS)
)

const PERSONAL_INFO_COLLECTION_BOTTOM =
  '위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

const PERSONAL_INFO_THIRD_PARTY_BOTTOM =
  '위의 개인정보 제3자 정보 제공·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

function createInstitutionPersonalInfoHorizontalTable(): HorizontalTableParagraph {
  const colCount = 3
  const columnFields = Array.from({ length: colCount }, () => ({
    kind: 'text' as const,
    placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  }))
  const bodyRow = [
    {
      kind: 'text' as const,
      value: '이름, 학교명, 학교 소재지, 개인 연락처, 이메일',
    },
    {
      kind: 'text' as const,
      value: 'JA 프로그램의 참가자 선발 및 프로그램 진행에 필요한 정보 안내',
    },
    {
      kind: 'text' as const,
      value:
        '- 이용 기간: 해당 프로그램이 진행되는 기간\n- 보유 기간: 프로그램 종료로부터 1년 보관 후 폐기',
    },
  ]
  return normalizeHorizontalTableParagraph({
    id: PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '개인정보 수집·이용',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    tableFlavor: 'field',
    columnHeaders: ['수집 항목', '수집·이용 목적', '보유기간'],
    dataRows: [Array.from({ length: colCount }, () => '')],
    columnFields,
    fieldDataRows: [bodyRow],
    bottomText: PERSONAL_INFO_COLLECTION_BOTTOM,
    showBottomText: true,
    showBottomConsent: true,
    bottomConsent: 'agree',
    answerRequired: true,
  })
}

function createInstitutionThirdPartyHorizontalTable(): HorizontalTableParagraph {
  const colCount = 4
  const columnFields = [
    { kind: 'text' as const, placeholder: '제공받는 곳을 입력해 주세요' },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
  ]
  const bodyRow = [
    { kind: 'text' as const, value: '' },
    {
      kind: 'text' as const,
      value: '이름, 학교명, 학교 소재지, 개인 연락처, 이메일',
    },
    {
      kind: 'text' as const,
      value: 'JA 프로그램의 참가자 선발 및\n프로그램 진행에 필요한 정보 안내',
    },
    { kind: 'text' as const, value: '5년' },
  ]
  return normalizeHorizontalTableParagraph({
    id: PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '개인정보 제3자 정보 제공·이용 동의',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    tableFlavor: 'field',
    columnHeaders: ['제공받는 곳', '수집 항목', '수집·이용 목적', '제공받는 자의 보유기간'],
    dataRows: [Array.from({ length: colCount }, () => '')],
    columnFields,
    fieldDataRows: [bodyRow],
    bottomText: PERSONAL_INFO_THIRD_PARTY_BOTTOM,
    showBottomText: true,
    showBottomConsent: true,
    bottomConsent: 'agree',
    answerRequired: true,
  })
}

/** 프로그램 등록 폼 시드와 동일 — 본문은 `renderProgramApplicationFormInstitutionParagraphBody`로 대체 */
function createInstitutionSeedHorizontalTable(
  id: string,
  title: string,
  paragraphDescription: string
): HorizontalTableParagraph {
  return normalizeHorizontalTableParagraph({
    id,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: title,
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

function createInstitutionScheduleMultipleChoice(): MultipleChoiceParagraph {
  return {
    id: PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice,
    kind: 'single_item',
    variant: 'multiple_choice',
    requiredMark: true,
    paragraphTitle: '진행 희망 교육 일정',
    paragraphDescription: '프로그램 등록/모집 폼 설정값에 따라 노출 내용이 상이합니다.',
    participatesInTitleNumbering: true,
    answerRequired: true,
    allowMultiple: true,
    items: [
      { id: 'institution-schedule-slot-1', label: '26년 4월 20일(일) 9:30 ~ 12:20' },
      { id: 'institution-schedule-slot-2', label: '26년 4월 27일(월) 13:00 ~ 15:50' },
    ],
    selectedPreviewSingleId: null,
    selectedPreviewMultipleIds: [],
  }
}

export function createProgramApplicationFormInstitutionDraft(): WritingFormDraft {
  const paragraphs: WritingFormParagraph[] = [
    createInstitutionPersonalInfoHorizontalTable(),
    createInstitutionThirdPartyHorizontalTable(),
    createInstitutionSeedHorizontalTable(
      PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo,
      '기본 정보',
      '설명 입력'
    ),
    createInstitutionSeedHorizontalTable(
      PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance,
      '안내 사항',
      '강사님들에게 제공 또는 요청할 사전 정보를 작성해 주세요.'
    ),
    createInstitutionScheduleMultipleChoice(),
  ]
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs,
  })
}
