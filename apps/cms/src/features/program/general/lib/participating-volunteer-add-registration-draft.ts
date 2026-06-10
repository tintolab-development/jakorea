import {
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  normalizeHorizontalTableParagraph,
  type HorizontalTableParagraph,
} from '@/features/template/model/writing-form-draft.schema'

export const PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS = {
  personalInfoCollection: 'participating-volunteer-add-registration-personal-info',
  thirdPartyConsent: 'participating-volunteer-add-registration-third-party',
} as const

const PERSONAL_INFO_COLLECTION_BOTTOM =
  '위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

const PERSONAL_INFO_THIRD_PARTY_BOTTOM =
  '위의 개인정보 제3자 정보 제공·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

function createParticipatingVolunteerPersonalInfoTable(): HorizontalTableParagraph {
  const colCount = 3
  const columnFields = Array.from({ length: colCount }, () => ({
    kind: 'text' as const,
    placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  }))
  const bodyRow = [
    {
      kind: 'text' as const,
      value: '이름, 연락처, 성별, 학년, 이메일, 소속(학교)',
    },
    {
      kind: 'text' as const,
      value: 'JA 프로그램 봉사활동 안내 및 진행에 필요한 정보 안내',
    },
    {
      kind: 'text' as const,
      value:
        '- 이용 기간: 해당 프로그램이 진행되는 기간\n- 보유 기간: 프로그램 종료로부터 1년 보관 후 폐기',
    },
  ]
  return normalizeHorizontalTableParagraph({
    id: PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.personalInfoCollection,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '개인정보 수집·이용',
    paragraphDescription: '',
    participatesInTitleNumbering: false,
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

function createParticipatingVolunteerThirdPartyTable(): HorizontalTableParagraph {
  const colCount = 4
  const columnFields = [
    { kind: 'text' as const, placeholder: '제공받는 곳을 입력해 주세요' },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
  ]
  const bodyRow = [
    { kind: 'text' as const, value: '배정된 교육 대상 학교' },
    {
      kind: 'text' as const,
      value: '이름, 연락처, 성별, 학년, 이메일, 소속(학교)',
    },
    {
      kind: 'text' as const,
      value: 'JA 프로그램 봉사활동 안내 및 진행에 필요한 정보 안내',
    },
    { kind: 'text' as const, value: '해당 프로그램이 진행되는 기간' },
  ]
  return normalizeHorizontalTableParagraph({
    id: PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.thirdPartyConsent,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '개인정보 제3자 정보 제공·이용 동의',
    paragraphDescription: '',
    participatesInTitleNumbering: false,
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

export function createParticipatingVolunteerAddRegistrationConsentParagraphs(): HorizontalTableParagraph[] {
  return [
    createParticipatingVolunteerPersonalInfoTable(),
    createParticipatingVolunteerThirdPartyTable(),
  ]
}

export function resolveParticipatingVolunteerBasicInfoDescription(): string {
  const now = new Date()
  const year = now.getFullYear()
  const semester = now.getMonth() < 6 ? 1 : 2
  return `학년은 ${year}년 ${semester}학기 기준으로 기재해 주세요.`
}
