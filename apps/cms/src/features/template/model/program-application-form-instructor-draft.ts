import {
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  normalizeHorizontalTableParagraph,
  normalizeVerticalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type VerticalTableParagraph,
  type VerticalTableRow,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

/** 프로그램 강사 신청 폼 — 시드 단락 ID */
export const PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS = {
  personalInfoCollection: 'program-instructor-application-seed-personal-info',
  thirdPartyConsent: 'program-instructor-application-seed-third-party',
  crimeRecord: 'program-instructor-application-seed-crime-record',
  unavailableDates: 'program-instructor-application-seed-unavailable-dates',
  availableSchedule: 'program-instructor-application-seed-available-schedule',
} as const

export const PROGRAM_APPLICATION_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS = new Set<string>(
  Object.values(PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS)
)

const PERSONAL_INFO_COLLECTION_BOTTOM =
  '위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

const PERSONAL_INFO_THIRD_PARTY_BOTTOM =
  '위의 개인정보 제3자 정보 제공·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

function createInstructorPersonalInfoHorizontalTable(): HorizontalTableParagraph {
  const colCount = 3
  const columnFields = Array.from({ length: colCount }, () => ({
    kind: 'text' as const,
    placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  }))
  const bodyRow = [
    {
      kind: 'text' as const,
      value: '이름, 연락처(휴대전화번호), 이메일',
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
    id: PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.personalInfoCollection,
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

function createInstructorThirdPartyHorizontalTable(): HorizontalTableParagraph {
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
      value: '이름, 연락처(휴대전화번호), 이메일',
    },
    {
      kind: 'text' as const,
      value: 'JA 프로그램의 참가자 선발 및\n프로그램 진행에 필요한 정보 안내',
    },
    { kind: 'text' as const, value: '1년' },
  ]
  return normalizeHorizontalTableParagraph({
    id: PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.thirdPartyConsent,
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

/** 본문은 `InstructorCrimeRecordParagraph`로 대체 — 카드 메타만 유지 */
function createInstructorCrimeRecordPlaceholderTable(): HorizontalTableParagraph {
  return normalizeHorizontalTableParagraph({
    id: PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.crimeRecord,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '성범죄 경력 조회서 제출',
    paragraphDescription: '학교에 전달할 성범죄 경력 조회서 파일을 제출해 주세요.',
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

function createUnavailableDatesVerticalTable(): VerticalTableParagraph {
  const row = (label: string): VerticalTableRow => ({
    stageCount: 1,
    headers: [label],
    cells: [''],
    stageKinds: ['date_time'],
    dateTimeSingleStageMode: 'date',
    placeholderHints: ['일정 선택'],
  })
  return normalizeVerticalTableParagraph({
    id: PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.unavailableDates,
    kind: 'single_item',
    variant: 'vertical_table',
    verticalTableFlavor: 'date_time',
    requiredMark: true,
    paragraphTitle: '강의 진행 불가 일정',
    paragraphDescription: '강의 진행이 불가한 일정을 모두 선택해 주세요.',
    participatesInTitleNumbering: true,
    rows: [row('강의 불가 일정 01'), row('강의 불가 일정 02')],
    bottomText: '',
    showBottomText: false,
    showBottomConsent: false,
    bottomConsent: 'agree',
    answerRequired: true,
  })
}

/** 본문은 `InstructorAvailableScheduleParagraph`로 대체 */
function createAvailableSchedulePlaceholderTable(): HorizontalTableParagraph {
  return normalizeHorizontalTableParagraph({
    id: PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '강의 진행 가능 일정',
    paragraphDescription: '강의 진행이 가능한 일정을 모두 선택해 주세요.',
    participatesInTitleNumbering: true,
    tableFlavor: 'text',
    columnHeaders: ['강의 진행 가능일', ''],
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

export function createProgramApplicationFormInstructorDraft(): WritingFormDraft {
  const paragraphs: WritingFormParagraph[] = [
    createInstructorPersonalInfoHorizontalTable(),
    createInstructorThirdPartyHorizontalTable(),
    createInstructorCrimeRecordPlaceholderTable(),
    createUnavailableDatesVerticalTable(),
    createAvailableSchedulePlaceholderTable(),
  ]
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs,
  })
}
