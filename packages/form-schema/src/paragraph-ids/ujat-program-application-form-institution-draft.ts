import {
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type MultipleChoiceParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'

/** UJAT 프로그램 학교 신청 폼 — 시드 단락 ID */
export const UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS = {
  personalInfoCollection: 'ujat-program-application-institution-seed-personal-info',
  thirdPartyConsent: 'ujat-program-application-institution-seed-third-party',
  applicationRegion: 'ujat-program-application-institution-seed-application-region',
  basicInfo: 'ujat-program-application-institution-seed-basic-info',
  gradeApplicationInfo: 'ujat-program-application-institution-seed-grade-application-info',
  gradeClassTime: 'ujat-program-application-institution-seed-grade-class-time',
  preferredEducationSchedule: 'ujat-program-application-institution-seed-preferred-education-schedule',
  /** 제출 전 확인 — 객관식 단일 선택지(항목 1개 예외 허용) */
  submitConfirmation: 'ujat-program-application-institution-seed-submit-confirmation',
} as const

const PREFERRED_EDUCATION_SCHEDULE_DESCRIPTION =
  '* 금요일 1교시~4교시에 진행되며, 4교시 모두 교육 진행이 가능해야 합니다.\n' +
  '* 참여 가능한 모든 일정을 선택해 주시면, 선택해 주신 일정 중에서 조정하여 교육이 진행될 예정입니다.'

export const UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS = new Set<string>(
  Object.values(UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS)
)

/** 객관식 최소 2항 규칙 예외 — 시드 단락만 1항 유지 */
export function isUjatProgramApplicationInstitutionSingleOptionMultipleChoiceSeed(
  paragraphId: string
): boolean {
  return paragraphId === UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.submitConfirmation
}

/** 신청 지역 — 8항도 가로 라디오(봉사자 희망 교육 활동 지역과 동일 형식) */
export function isUjatProgramApplicationInstitutionApplicationRegionMultipleChoiceSeed(
  paragraphId: string
): boolean {
  return paragraphId === UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.applicationRegion
}

export const UJAT_PROGRAM_APPLICATION_INSTITUTION_APPLICATION_REGION_ITEMS: ReadonlyArray<{
  id: string
  label: string
}> = [
  { id: 'ujat-program-application-institution-application-region-seoul', label: '서울' },
  {
    id: 'ujat-program-application-institution-application-region-gyeonggi-south',
    label: '경기(남부)',
  },
  { id: 'ujat-program-application-institution-application-region-incheon', label: '인천' },
  { id: 'ujat-program-application-institution-application-region-daejeon', label: '대전' },
  { id: 'ujat-program-application-institution-application-region-daegu', label: '대구' },
  { id: 'ujat-program-application-institution-application-region-busan', label: '부산' },
  { id: 'ujat-program-application-institution-application-region-gwangju', label: '광주' },
  {
    id: 'ujat-program-application-institution-application-region-jeonbuk-jeonju',
    label: '전북(전주)',
  },
]

const PERSONAL_INFO_RETENTION_CELL =
  '이용 기간: 해당 프로그램이 진행되는 기간\n보유 기간: 동의일로부터 3년 보관 후 폐기'
const THIRD_PARTY_RETENTION_CELL = '5년'

const PERSONAL_INFO_COLLECTION_BOTTOM =
  '위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

const PERSONAL_INFO_THIRD_PARTY_BOTTOM =
  '위의 개인정보 제3자 정보 제공·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

function createPersonalInfoCollectionParagraph(): HorizontalTableParagraph {
  const colCount = 3
  const columnFields = Array.from({ length: colCount }, () => ({
    kind: 'text' as const,
    placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  }))
  return normalizeHorizontalTableParagraph({
    id: UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection,
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
        { kind: 'text', value: '이름, 연락처, 학교명, 학교 주소, 이메일 등' },
        {
          kind: 'text',
          value: 'JA 프로그램의 참가자 선발 및 프로그램 진행에 필요한 정보 안내',
        },
        {
          kind: 'text',
          value: PERSONAL_INFO_RETENTION_CELL,
        },
      ],
    ],
    bottomText: PERSONAL_INFO_COLLECTION_BOTTOM,
    showBottomText: true,
    showBottomConsent: true,
    bottomConsent: 'agree',
    answerRequired: true,
  })
}

function createThirdPartyConsentParagraph(): HorizontalTableParagraph {
  const colCount = 4
  return normalizeHorizontalTableParagraph({
    id: UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
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
        { kind: 'text', value: '제공받는 곳을 입력해 주세요' },
        { kind: 'text', value: '이름, 학교명, 학교주소, 개인 연락처, e-mail' },
        {
          kind: 'text',
          value: 'JA 프로그램의 참가자 선발 및\n프로그램 진행에 필요한 정보 안내',
        },
        { kind: 'text', value: THIRD_PARTY_RETENTION_CELL },
      ],
    ],
    bottomText: PERSONAL_INFO_THIRD_PARTY_BOTTOM,
    showBottomText: true,
    showBottomConsent: true,
    bottomConsent: 'agree',
    answerRequired: true,
  })
}

const SUBMIT_CONFIRMATION_OPTION_ID =
  'ujat-program-application-institution-submit-confirmation-yes' as const

export function buildUjatInstitutionSubmitConfirmationLabel(
  year: number = new Date().getFullYear()
): string {
  return `네, 상기 내용 모두 확인하였으며, ${year}년 JA Korea 초등 경제교육 대상 학교에 지원합니다.`
}

function createSubmitConfirmationMultipleChoiceParagraph(): MultipleChoiceParagraph {
  return {
    id: UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.submitConfirmation,
    kind: 'single_item',
    variant: 'multiple_choice',
    requiredMark: true,
    paragraphTitle: '상기 내용 모두 확인하였으며 현재 답변으로 제출합니다.',
    paragraphDescription:
      '*신청 학년 정보 및 교육 일정은 추후 수정이 가능하며, 교육자 배정 과정에서 조정될 수 있습니다.',
    participatesInTitleNumbering: true,
    answerRequired: true,
    allowMultiple: false,
    items: [
      {
        id: SUBMIT_CONFIRMATION_OPTION_ID,
        label: buildUjatInstitutionSubmitConfirmationLabel(),
      },
    ],
    selectedPreviewSingleId: null,
    selectedPreviewMultipleIds: [],
  }
}

function createApplicationRegionMultipleChoiceParagraph(): MultipleChoiceParagraph {
  return {
    id: UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.applicationRegion,
    kind: 'single_item',
    variant: 'multiple_choice',
    requiredMark: true,
    paragraphTitle: '신청 지역',
    paragraphDescription: '설명 입력',
    participatesInTitleNumbering: true,
    answerRequired: true,
    allowMultiple: false,
    items: UJAT_PROGRAM_APPLICATION_INSTITUTION_APPLICATION_REGION_ITEMS.map(item => ({
      ...item,
    })),
    selectedPreviewSingleId: null,
    selectedPreviewMultipleIds: [],
  }
}

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

export function createUjatProgramApplicationFormInstitutionDraft(): WritingFormDraft {
  const paragraphs: WritingFormParagraph[] = [
    createPersonalInfoCollectionParagraph(),
    createThirdPartyConsentParagraph(),
    createApplicationRegionMultipleChoiceParagraph(),
    createSeedHorizontalTable(
      UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo,
      '기본 정보',
      '설명 입력'
    ),
    createSeedHorizontalTable(
      UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeApplicationInfo,
      '학년 별 신청 정보',
      '학교에서 신청하는 모든 신청 학년 별 학급 수 및 반 별 학생 수를 작성해주세요.'
    ),
    createSeedHorizontalTable(
      UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeClassTime,
      '학년 별 수업 시간',
      '신청 학년 별 수업 진행 시간을 작성해주세요.'
    ),
    createSeedHorizontalTable(
      UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule,
      '진행 희망 교육 일정',
      PREFERRED_EDUCATION_SCHEDULE_DESCRIPTION
    ),
    createSubmitConfirmationMultipleChoiceParagraph(),
  ]
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs,
  })
}

function patchHorizontalTableTextCell(
  paragraph: HorizontalTableParagraph,
  row: number,
  col: number,
  value: string
): HorizontalTableParagraph {
  const fieldDataRows = (paragraph.fieldDataRows ?? []).map(cells =>
    cells.map(cell => ({ ...cell }))
  )
  const rowCells = fieldDataRows[row]
  const cell = rowCells?.[col]
  if (cell == null || cell.kind !== 'text' || cell.value === value) {
    return paragraph
  }
  rowCells[col] = { ...cell, value }
  return { ...paragraph, fieldDataRows }
}

/** 구 시드(가로표) → 객관식형 + JSON 시드 고정 문구 보정 */
export function migrateUjatProgramApplicationInstitutionParagraphs(
  draft: WritingFormDraft
): WritingFormDraft {
  let changed = false
  const paragraphs = draft.paragraphs.map(paragraph => {
    if (
      paragraph.id === UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.applicationRegion &&
      paragraph.kind === 'single_item' &&
      paragraph.variant === 'horizontal_table'
    ) {
      changed = true
      return createApplicationRegionMultipleChoiceParagraph()
    }
    if (
      paragraph.id === UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection &&
      paragraph.kind === 'single_item' &&
      paragraph.variant === 'horizontal_table'
    ) {
      const next = patchHorizontalTableTextCell(paragraph, 0, 2, PERSONAL_INFO_RETENTION_CELL)
      if (next !== paragraph) changed = true
      return next
    }
    if (
      paragraph.id === UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent &&
      paragraph.kind === 'single_item' &&
      paragraph.variant === 'horizontal_table'
    ) {
      const next = patchHorizontalTableTextCell(paragraph, 0, 3, THIRD_PARTY_RETENTION_CELL)
      if (next !== paragraph) changed = true
      return next
    }
    return paragraph
  })
  return changed ? { ...draft, paragraphs } : draft
}
