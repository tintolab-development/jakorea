import {
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

/** Gemini 찾아가는 연수 참여 기관 신청 폼 — 시드 단락 ID */
export const GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS = {
  personalInfoCollection: 'gemini-vt-inst-seed-personal-info',
  thirdPartyConsent: 'gemini-vt-inst-seed-third-party',
  portraitConsent: 'gemini-vt-inst-seed-portrait',
  trainingInfo: 'gemini-vt-inst-seed-training-info',
  contactPerson: 'gemini-vt-inst-seed-contact',
  preferredEducationSchedule: 'gemini-vt-inst-seed-preferred-schedule',
} as const

export const GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS =
  new Set<string>(Object.values(GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS))

const PERSONAL_INFO_BOTTOM =
  '귀하의 개인 정보 수집 및 이용을 동의하지 않을 권리가 있으며, 동의하지 않을 시 본 프로그램 참여가 불가능합니다.'

const THIRD_PARTY_BOTTOM =
  '귀하의 개인 정보 수집 및 이용을 동의하지 않을 권리가 있으며, 동의하지 않을 시 본 프로그램 참여가 불가능합니다.'

const PORTRAIT_BOTTOM =
  '동의하지 않을 권리가 있으며, 동의하지 않을 시 본 프로그램 참여가 불가능합니다.'

function createPersonalInfoCollectionParagraph(): HorizontalTableParagraph {
  const colCount = 3
  const columnFields = Array.from({ length: colCount }, () => ({
    kind: 'text' as const,
    placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  }))
  return normalizeHorizontalTableParagraph({
    id: GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '개인정보 수집·이용',
    paragraphDescription: '설명 입력',
    participatesInTitleNumbering: true,
    tableFlavor: 'field',
    columnHeaders: ['수집 항목', '수집·이용 목적', '보유기간'],
    dataRows: [Array.from({ length: colCount }, () => '')],
    columnFields,
    fieldDataRows: [
      [
        {
          kind: 'text',
          value: '이름, 연락처(휴대전화번호), 이메일, 소속(학교)',
        },
        {
          kind: 'text',
          value: 'Gemini Academy 연수 및 프로그램 진행에 필요한 정보 안내',
        },
        {
          kind: 'text',
          value:
            '- 이용 기간: 해당 프로그램이 진행되는 기간\n- 보유 기간: 동의일로부터 3년 보관 후 폐기',
        },
      ],
    ],
    bottomText: PERSONAL_INFO_BOTTOM,
    showBottomText: true,
    showBottomConsent: true,
    bottomConsent: 'agree',
    answerRequired: true,
  })
}

function createThirdPartyConsentParagraph(): HorizontalTableParagraph {
  const colCount = 4
  return normalizeHorizontalTableParagraph({
    id: GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '개인정보 제3자 정보 제공·이용 동의',
    paragraphDescription: '설명 입력',
    participatesInTitleNumbering: true,
    tableFlavor: 'field',
    columnHeaders: ['제공받는 곳', '수집 항목', '수집·이용 목적', '제공받는 자의 보유기간'],
    dataRows: [Array.from({ length: colCount }, () => '')],
    columnFields: [
      { kind: 'text', placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
      { kind: 'text', placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
      { kind: 'text', placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
      { kind: 'text', placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    ],
    fieldDataRows: [
      [
        { kind: 'text', value: 'Google' },
        {
          kind: 'text',
          value: '이름, 연락처(휴대전화번호), 이메일, 소속(학교)',
        },
        {
          kind: 'text',
          value: 'Gemini Academy 연수 참가자 공유 및 프로그램 진행에 필요한 정보 안내',
        },
        { kind: 'text', value: '동의일로부터 3년 보관 후 폐기' },
      ],
    ],
    bottomText: THIRD_PARTY_BOTTOM,
    showBottomText: true,
    showBottomConsent: true,
    bottomConsent: 'agree',
    answerRequired: true,
  })
}

function createPortraitConsentParagraph(): HorizontalTableParagraph {
  const colCount = 2
  return normalizeHorizontalTableParagraph({
    id: GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.portraitConsent,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '초상권 수집·이용 동의',
    paragraphDescription: '설명 입력',
    participatesInTitleNumbering: true,
    tableFlavor: 'field',
    columnHeaders: ['동의 내용', '권리'],
    dataRows: [Array.from({ length: colCount }, () => '')],
    columnFields: [
      { kind: 'text', placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
      { kind: 'text', placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    ],
    fieldDataRows: [
      [
        {
          kind: 'text',
          value:
            '사진과 영상에 남겨질 기회를 고려하여, 신청자는 JA Korea와 Google에게 사진과 영상(이하 미디어)을 촬영할 권리를 부여합니다. 본인은 JA Korea와 Google에게 다음과 같은 사항을 허용하며, 모든 미디어의 저작권을 JA Korea와 Google이 소유함에 동의합니다.',
        },
        {
          kind: 'text',
          value:
            '현재 알려진 모든 미디어 형태와 미래에 개발될 형태의 미디어의 재생산, 사용, 재사용, 출판, 전시, 저작권 그리고 배포가 가능합니다.',
        },
      ],
    ],
    bottomText: PORTRAIT_BOTTOM,
    showBottomText: true,
    showBottomConsent: true,
    bottomConsent: 'agree',
    answerRequired: true,
  })
}

function createSeedHorizontalTable(
  id: string,
  paragraphTitle: string,
  paragraphDescription: string,
  requiredMark = true
): HorizontalTableParagraph {
  return normalizeHorizontalTableParagraph({
    id,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark,
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

export function createGeminiVisitingTrainingApplicationFormInstitutionDraft(): WritingFormDraft {
  const paragraphs: WritingFormParagraph[] = [
    createPersonalInfoCollectionParagraph(),
    createThirdPartyConsentParagraph(),
    createPortraitConsentParagraph(),
    createSeedHorizontalTable(
      GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.trainingInfo,
      '연수 정보',
      '15인 이상의 강의 참여 인원부터 신청이 가능합니다.'
    ),
    createSeedHorizontalTable(
      GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.contactPerson,
      '담당 교사 정보',
      ''
    ),
    createSeedHorizontalTable(
      GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule,
      '진행 희망 교육 일정',
      '1~3순위 희망 날짜 및 강의 희망 차시를 기재해 주세요.',
      false
    ),
  ]
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs,
  })
}
