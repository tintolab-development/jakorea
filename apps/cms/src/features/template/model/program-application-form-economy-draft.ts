import {
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

/** 1사1교 프로그램 참여자 신청 폼 — 시드 단락 ID */
export const PROGRAM_APPLICATION_FORM_ECONOMY_IDS = {
  personalInfoCollection: 'program-application-economy-seed-personal-info',
  thirdPartyConsent: 'program-application-economy-seed-third-party',
  basicInfo: 'program-application-economy-seed-basic-info',
  guidance: 'program-application-economy-seed-guidance',
  lessonReply: 'program-application-economy-seed-lesson-reply',
  educationExperience: 'program-application-economy-seed-education-experience',
  preferredSchedule: 'program-application-economy-seed-preferred-schedule',
} as const

export const PROGRAM_APPLICATION_FORM_ECONOMY_SEED_PARAGRAPH_IDS = new Set<string>(
  Object.values(PROGRAM_APPLICATION_FORM_ECONOMY_IDS)
)

const PERSONAL_INFO_COLLECTION_BOTTOM =
  '위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

const PERSONAL_INFO_THIRD_PARTY_BOTTOM =
  '위의 개인정보 제3자 정보 제공·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

function createEconomyPersonalInfoHorizontalTable(): HorizontalTableParagraph {
  const colCount = 3
  const columnFields = Array.from({ length: colCount }, () => ({
    kind: 'text' as const,
    placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  }))
  const bodyRow = [
    {
      kind: 'text' as const,
      value: '이름, 기관명, 기관 소재지, 개인 연락처, 이메일',
    },
    {
      kind: 'text' as const,
      value: '1사1교 프로그램 신청 접수 및 교육 운영에 필요한 정보 안내',
    },
    {
      kind: 'text' as const,
      value:
        '- 이용 기간: 해당 프로그램이 진행되는 기간\n- 보유 기간: 프로그램 종료로부터 1년 보관 후 폐기',
    },
  ]

  return normalizeHorizontalTableParagraph({
    id: PROGRAM_APPLICATION_FORM_ECONOMY_IDS.personalInfoCollection,
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

function createEconomyThirdPartyHorizontalTable(): HorizontalTableParagraph {
  const colCount = 4
  const columnFields = [
    { kind: 'subjective' as const, placeholder: '제공받는 곳을 입력해 주세요' },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
  ]
  const bodyRow = [
    { kind: 'text' as const, value: '' },
    {
      kind: 'text' as const,
      value: '이름, 학교명, 학교주소, 개인 연락처, e-mail',
    },
    {
      kind: 'text' as const,
      value: 'JA 프로그램의 참가자 선발 및\n프로그램 진행에 필요한 정보 안내',
    },
    { kind: 'text' as const, value: '5년' },
  ]

  return normalizeHorizontalTableParagraph({
    id: PROGRAM_APPLICATION_FORM_ECONOMY_IDS.thirdPartyConsent,
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

function createEconomyPlaceholderTable(
  id: string,
  title: string,
  paragraphDescription = '설명 입력'
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

export function createProgramApplicationFormEconomyDraft(): WritingFormDraft {
  const paragraphs: WritingFormParagraph[] = [
    createEconomyPersonalInfoHorizontalTable(),
    createEconomyThirdPartyHorizontalTable(),
    createEconomyPlaceholderTable(PROGRAM_APPLICATION_FORM_ECONOMY_IDS.basicInfo, '기본 정보', ''),
    createEconomyPlaceholderTable(
      PROGRAM_APPLICATION_FORM_ECONOMY_IDS.guidance,
      '안내 사항',
      '강사님들에게 제공 또는 요청할 사전 정보를 작성해 주세요.'
    ),
    createEconomyPlaceholderTable(
      PROGRAM_APPLICATION_FORM_ECONOMY_IDS.lessonReply,
      '결연 금융 회사명',
      `*결연 확인 방법*
1. 금융감독원 e-금융교육센터 홈페이지(www.fss.or.kr/edu) 접속
2. 메인화면 [1사1교 금융교육] 클릭
3. 1사1교 금융교육 프로그램 안내페이지에서 하단의 [결연현황 조회] 클릭
4. [학교명]에 소속 학교 검색 후 결연된 금융사 확인`
    ),
    createEconomyPlaceholderTable(
      PROGRAM_APPLICATION_FORM_ECONOMY_IDS.educationExperience,
      '전년도 1사1교 경제금융교육 진행 여부',
      ''
    ),
    createEconomyPlaceholderTable(
      PROGRAM_APPLICATION_FORM_ECONOMY_IDS.preferredSchedule,
      '진행 희망 교육 일정',
      '교육을 희망하는 날짜와 진행 차시를 2지망까지 작성해 주세요. 수업은 1일, 최대 2차시까지 운영됩니다. (2차시는 연강으로만 진행 가능합니다. ex. 2교시 시작 시 3교시까지 진행)'
    ),
  ]

  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs,
  })
}
