import {
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableFieldCellValue,
  type HorizontalTableParagraph,
  type MultipleChoiceParagraph,
  type ShortEssayParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'

export const PROGRAM_PARTICIPANT_APPLICATION_IDS = {
  personalInfoCollection: 'program-participant-application-seed-personal-info',
  thirdPartyConsent: 'program-participant-application-seed-third-party',
  selfIntro: 'program-participant-application-seed-self-intro',
  teamInfo: 'program-participant-application-seed-team-info',
  scheduleChoice: 'program-participant-application-seed-schedule',
} as const

export const PROGRAM_PARTICIPANT_APPLICATION_SEED_PARAGRAPH_IDS = new Set<string>(
  Object.values(PROGRAM_PARTICIPANT_APPLICATION_IDS)
)

const PERSONAL_INFO_COLLECTION_BOTTOM =
  '위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

const PERSONAL_INFO_THIRD_PARTY_BOTTOM =
  '위의 개인정보 제3자 정보 제공·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

/** `tableFlavor: 'text'` + 단일 행이면 normalize가 본문을 th용 placeholder로만 옮기고 td가 비게 됨 → 필드형으로 td 값 유지 */
function createPersonalInfoHorizontalTable(): HorizontalTableParagraph {
  const colCount = 3
  const columnFields = Array.from({ length: colCount }, () => ({
    kind: 'text' as const,
    placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  }))
  const bodyRow: HorizontalTableFieldCellValue[] = [
    {
      kind: 'text',
      value: '이름, 연락처(휴대전화번호), 이메일, 소속(학교), 학년, 성별',
    },
    {
      kind: 'text',
      value: 'JA 프로그램의 참가자 선발 및 프로그램 진행에 필요한 정보 안내',
    },
    {
      kind: 'text',
      value:
        '- 이용 기간: 해당 프로그램이 진행되는 기간\n- 보유 기간: 프로그램 종료로부터 1년 보관 후 폐기',
    },
  ]
  return normalizeHorizontalTableParagraph({
    id: PROGRAM_PARTICIPANT_APPLICATION_IDS.personalInfoCollection,
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

function createThirdPartyHorizontalTable(): HorizontalTableParagraph {
  const colCount = 4
  const columnFields = [
    { kind: 'text' as const, placeholder: '제공받는 곳을 입력해 주세요' },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
  ]
  const bodyRow: HorizontalTableFieldCellValue[] = [
    { kind: 'text', value: '' },
    {
      kind: 'text',
      value: '이름, 연락처(휴대전화번호), 이메일,\n소속(학교), 학년, 성별',
    },
    {
      kind: 'text',
      value: 'JA 프로그램의 참가자 선발 및\n프로그램 진행에 필요한 정보 안내',
    },
    { kind: 'text', value: '5년' },
  ]
  return normalizeHorizontalTableParagraph({
    id: PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent,
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

function createSelfIntroShortEssay(): ShortEssayParagraph {
  return {
    id: PROGRAM_PARTICIPANT_APPLICATION_IDS.selfIntro,
    kind: 'single_item',
    variant: 'short_essay',
    requiredMark: true,
    paragraphTitle: '자기소개 및 지원동기',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    answerRequired: true,
    showItemTitle: false,
    bodyPlaceholder: '자유롭게 작성해 주세요',
    bodyText: '',
  }
}

/** 본문은 `ProgramApplicationFormIndividualTeamInfoParagraph`로 대체 */
function createTeamInfoPlaceholderTable(): HorizontalTableParagraph {
  return normalizeHorizontalTableParagraph({
    id: PROGRAM_PARTICIPANT_APPLICATION_IDS.teamInfo,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '팀 정보',
    paragraphDescription:
      '팀원 모두 ★반드시 개별로 신청서 작성★하여 제출해야 합니다. (팀장은 신청 시 팀원 중 한 명만 선택해 주세요)',
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

function createScheduleMultipleChoice(): MultipleChoiceParagraph {
  return {
    id: PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice,
    kind: 'single_item',
    variant: 'multiple_choice',
    requiredMark: true,
    paragraphTitle: '진행 희망 교육 일정',
    paragraphDescription:
      '진행 가능한 일정을 모두 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다.',
    participatesInTitleNumbering: true,
    answerRequired: true,
    allowMultiple: true,
    items: [
      { id: 'participant-schedule-slot-1', label: '26년 4월 20일(일) 9:30 ~ 12:20' },
      { id: 'participant-schedule-slot-2', label: '26년 4월 27일(월) 13:00 ~ 15:50' },
    ],
    selectedPreviewSingleId: null,
    selectedPreviewMultipleIds: [],
  }
}

export function createProgramParticipantApplicationDraft(): WritingFormDraft {
  const paragraphs: WritingFormParagraph[] = [
    createPersonalInfoHorizontalTable(),
    createThirdPartyHorizontalTable(),
    createSelfIntroShortEssay(),
    createTeamInfoPlaceholderTable(),
    createScheduleMultipleChoice(),
  ]
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs,
  })
}
