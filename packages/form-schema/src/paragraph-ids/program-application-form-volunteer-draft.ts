import {
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type MultipleChoiceParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'

/** 프로그램 봉사자 신청 폼 — 시드 단락 ID */
export const PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS = {
  personalInfoCollection: 'program-volunteer-application-seed-personal-info',
  thirdPartyConsent: 'program-volunteer-application-seed-third-party',
  jaVolunteerExperience: 'program-volunteer-application-seed-ja-experience',
  previousJaProgram: 'program-volunteer-application-seed-previous-ja-program',
  freeTextItems: 'program-volunteer-application-seed-free-text-items',
  interviewSchedule: 'program-volunteer-application-seed-interview-schedule',
} as const

export const PROGRAM_VOLUNTEER_JA_EXPERIENCE_OPTION_IDS = {
  yes: 'program-volunteer-application-ja-experience-yes',
  no: 'program-volunteer-application-ja-experience-no',
} as const

export const PROGRAM_APPLICATION_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS = new Set<string>(
  Object.values(PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS)
)

const PERSONAL_INFO_COLLECTION_BOTTOM =
  '위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

const PERSONAL_INFO_THIRD_PARTY_BOTTOM =
  '위의 개인정보 제3자 정보 제공·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

function createVolunteerPersonalInfoHorizontalTable(): HorizontalTableParagraph {
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
    id: PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection,
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

function createVolunteerThirdPartyHorizontalTable(): HorizontalTableParagraph {
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
    id: PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent,
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

function createJaVolunteerExperienceMultipleChoiceParagraph(): MultipleChoiceParagraph {
  return {
    id: PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.jaVolunteerExperience,
    kind: 'single_item',
    variant: 'multiple_choice',
    requiredMark: true,
    paragraphTitle: 'JA 봉사 프로그램 진행 경험 여부',
    paragraphDescription: 'JA 봉사 프로그램 진행 이력 여부를 선택해 주세요.',
    participatesInTitleNumbering: true,
    answerRequired: true,
    allowMultiple: false,
    items: [
      { id: PROGRAM_VOLUNTEER_JA_EXPERIENCE_OPTION_IDS.yes, label: '있음' },
      { id: PROGRAM_VOLUNTEER_JA_EXPERIENCE_OPTION_IDS.no, label: '없음' },
    ],
    selectedPreviewSingleId: null,
    selectedPreviewMultipleIds: [],
  }
}

/** 본문은 `VolunteerPreviousJaProgramParagraph`로 대체 */
function createPreviousJaProgramPlaceholderTable(): HorizontalTableParagraph {
  return normalizeHorizontalTableParagraph({
    id: PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousJaProgram,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '이전 참여 JA 봉사 프로그램',
    paragraphDescription:
      '이전에 참여한 JA 봉사 프로그램명과 진행년도 및 해당 프로그램의 활동인증서 또는 수료증 파일을 첨부해 주세요.',
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

/** 본문은 `VolunteerFreeTextItemsParagraph`로 대체 */
function createVolunteerFreeTextItemsPlaceholderTable(): HorizontalTableParagraph {
  return normalizeHorizontalTableParagraph({
    id: PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '자유 작성 항목',
    paragraphDescription: '1~3번 문항은 자유롭게 작성 가능합니다.',
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

/** 본문은 `VolunteerInterviewAvailableScheduleParagraph`로 대체 */
function createVolunteerInterviewSchedulePlaceholderTable(): HorizontalTableParagraph {
  return normalizeHorizontalTableParagraph({
    id: PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '면접 진행 가능 일정',
    paragraphDescription:
      '서류 합격 시 면접이 진행됩니다. 면접이 진행 가능한 일정 모두 선택해 주세요',
    participatesInTitleNumbering: true,
    tableFlavor: 'text',
    columnHeaders: ['면접 진행 가능일', ''],
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

export function createProgramApplicationFormVolunteerDraft(): WritingFormDraft {
  const paragraphs: WritingFormParagraph[] = [
    createVolunteerPersonalInfoHorizontalTable(),
    createVolunteerThirdPartyHorizontalTable(),
    createJaVolunteerExperienceMultipleChoiceParagraph(),
    createPreviousJaProgramPlaceholderTable(),
    createVolunteerFreeTextItemsPlaceholderTable(),
    createVolunteerInterviewSchedulePlaceholderTable(),
  ]
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs,
  })
}
