import {
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type MultipleChoiceParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

export type JaVolunteerExperience = 'yes' | 'no' | undefined

export const PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS = {
  personalInfoCollection: 'participating-volunteer-add-registration-personal-info',
  thirdPartyConsent: 'participating-volunteer-add-registration-third-party',
  basicInfo: 'participating-volunteer-add-registration-basic-info',
  jaVolunteerExperience: 'participating-volunteer-add-registration-ja-experience',
  previousJaProgram: 'participating-volunteer-add-registration-previous-ja-program',
  freeTextItems: 'participating-volunteer-add-registration-free-text-items',
} as const

export const JA_VOLUNTEER_EXPERIENCE_OPTION_IDS = {
  yes: 'participating-volunteer-add-registration-ja-experience-yes',
  no: 'participating-volunteer-add-registration-ja-experience-no',
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

function createJaVolunteerExperienceMultipleChoiceParagraph(): MultipleChoiceParagraph {
  return {
    id: PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.jaVolunteerExperience,
    kind: 'single_item',
    variant: 'multiple_choice',
    requiredMark: true,
    paragraphTitle: 'JA 봉사 프로그램 진행 경험 여부',
    paragraphDescription: 'JA 봉사 프로그램 진행 이력 여부를 선택해 주세요.',
    participatesInTitleNumbering: false,
    answerRequired: true,
    allowMultiple: false,
    items: [
      { id: JA_VOLUNTEER_EXPERIENCE_OPTION_IDS.yes, label: '있음' },
      { id: JA_VOLUNTEER_EXPERIENCE_OPTION_IDS.no, label: '없음' },
    ],
    selectedPreviewSingleId: null,
    selectedPreviewMultipleIds: [],
  }
}

export function resolveJaVolunteerExperienceFromParagraph(
  paragraph: WritingFormParagraph | undefined
): JaVolunteerExperience {
  if (!paragraph || paragraph.variant !== 'multiple_choice') return undefined
  const selectedId = paragraph.selectedPreviewSingleId
  if (selectedId === JA_VOLUNTEER_EXPERIENCE_OPTION_IDS.yes) return 'yes'
  if (selectedId === JA_VOLUNTEER_EXPERIENCE_OPTION_IDS.no) return 'no'
  return undefined
}

/** plugin 섹션 메타 — UJAT 추가 등록 draft seed 단락과 동일 패턴 */
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
    participatesInTitleNumbering: false,
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

export function resolveParticipatingVolunteerBasicInfoDescription(): string {
  const now = new Date()
  const year = now.getFullYear()
  const semester = now.getMonth() < 6 ? 1 : 2
  return `학년은 ${year}년 ${semester}학기 기준으로 기재해 주세요.`
}

export function createParticipatingVolunteerAddRegistrationDraft(): WritingFormDraft {
  const paragraphs: WritingFormParagraph[] = [
    createParticipatingVolunteerPersonalInfoTable(),
    createParticipatingVolunteerThirdPartyTable(),
    createSeedHorizontalTable(
      PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.basicInfo,
      '기본 정보',
      resolveParticipatingVolunteerBasicInfoDescription()
    ),
    createJaVolunteerExperienceMultipleChoiceParagraph(),
    createSeedHorizontalTable(
      PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.previousJaProgram,
      '이전 참여 JA 봉사 프로그램',
      ''
    ),
    createSeedHorizontalTable(
      PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.freeTextItems,
      '자유 작성 항목',
      '1~3번 문항은 자유롭게 작성 가능합니다.'
    ),
  ]
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs,
  })
}

/** @deprecated — `createParticipatingVolunteerAddRegistrationDraft` 사용 */
export function createParticipatingVolunteerAddRegistrationConsentParagraphs(): HorizontalTableParagraph[] {
  const draft = createParticipatingVolunteerAddRegistrationDraft()
  return draft.paragraphs.filter(
    (p): p is HorizontalTableParagraph =>
      p.variant === 'horizontal_table' &&
      (p.id === PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.personalInfoCollection ||
        p.id === PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.thirdPartyConsent)
  )
}
