import {
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type MultipleChoiceParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'

/** UJAT 프로그램 봉사자 신청 폼 — 시드 단락 ID */
export const UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS = {
  personalInfoCollection: 'ujat-program-application-volunteer-seed-personal-info',
  thirdPartyConsent: 'ujat-program-application-volunteer-seed-third-party',
  basicInfo: 'ujat-program-application-volunteer-seed-basic-info',
  previousTerm: 'ujat-program-application-volunteer-seed-previous-term',
  preferredRegion: 'ujat-program-application-volunteer-seed-preferred-region',
  educationExperience: 'ujat-program-application-volunteer-seed-education-experience',
  interviewSchedule: 'ujat-program-application-volunteer-seed-interview-schedule',
  freeTextItems: 'ujat-program-application-volunteer-seed-free-text-items',
  /** 제출 전 확인 — 객관식 단일 선택지(항목 1개 예외 허용) */
  submitConfirmation: 'ujat-program-application-volunteer-seed-submit-confirmation',
} as const

export const UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS = new Set<string>(
  Object.values(UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS)
)

/** 객관식 최소 2항 규칙 예외 — 시드 단락만 1항 유지 */
export function isUjatProgramApplicationVolunteerSingleOptionMultipleChoiceSeed(
  paragraphId: string
): boolean {
  return paragraphId === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.submitConfirmation
}

/** 희망 교육 활동 지역 — 8항도 가로 라디오(시안) */
export function isUjatProgramApplicationVolunteerPreferredRegionMultipleChoiceSeed(
  paragraphId: string
): boolean {
  return paragraphId === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.preferredRegion
}

export const UJAT_PROGRAM_APPLICATION_VOLUNTEER_PREFERRED_REGION_ITEMS: ReadonlyArray<{
  id: string
  label: string
}> = [
  { id: 'ujat-program-application-volunteer-preferred-region-seoul', label: '서울' },
  {
    id: 'ujat-program-application-volunteer-preferred-region-gyeonggi-south',
    label: '경기(남부)',
  },
  { id: 'ujat-program-application-volunteer-preferred-region-incheon', label: '인천' },
  { id: 'ujat-program-application-volunteer-preferred-region-daejeon', label: '대전' },
  { id: 'ujat-program-application-volunteer-preferred-region-daegu', label: '대구' },
  { id: 'ujat-program-application-volunteer-preferred-region-busan', label: '부산' },
  { id: 'ujat-program-application-volunteer-preferred-region-gwangju', label: '광주' },
  {
    id: 'ujat-program-application-volunteer-preferred-region-jeonbuk-jeonju',
    label: '전북(전주)',
  },
]

export const UJAT_PROGRAM_APPLICATION_VOLUNTEER_EDUCATION_EXPERIENCE_OPTION_IDS = {
  yes: 'ujat-program-application-volunteer-education-experience-yes',
  no: 'ujat-program-application-volunteer-education-experience-no',
} as const

const PERSONAL_INFO_RETENTION_CELL =
  '이용 기간: 해당 프로그램이 진행되는 기간\n보유 기간: 동의일로부터 3년 보관 후 폐기'
const THIRD_PARTY_RETENTION_CELL = '동의일로부터 3년 보관 후 폐기'
const FREE_TEXT_ITEMS_DESCRIPTION = '1~4번 문항은 자유롭게 작성 가능합니다.'

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
    id: UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection,
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
        { kind: 'text', value: '이름, 연락처, 성별, 학년, 이메일, 소속(학교)' },
        {
          kind: 'text',
          value: 'JA 프로그램 봉사활동 안내 및 진행에 필요한 정보 안내',
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
    id: UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent,
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
        { kind: 'text', value: '배정된 교육 대상 학교' },
        { kind: 'text', value: '이름, 연락처, 성별, 학년, 이메일, 소속(학교)' },
        {
          kind: 'text',
          value: 'JA 프로그램 봉사활동 안내 및\n프로그램 진행에 필요한 정보 안내',
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
  'ujat-program-application-volunteer-submit-confirmation-yes' as const

function createSubmitConfirmationMultipleChoiceParagraph(): MultipleChoiceParagraph {
  return {
    id: UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.submitConfirmation,
    kind: 'single_item',
    variant: 'multiple_choice',
    requiredMark: true,
    paragraphTitle: '상기 내용 모두 확인하였으며 현재 답변으로 제출합니다.',
    paragraphDescription:
      '*지원서 제출 후 수정이 불가하며, 지원자의 부주의로 잘못 작성하였을 경우 발생하는 불이익은 운영사무국에서 책임지지 않습니다.',
    participatesInTitleNumbering: true,
    answerRequired: true,
    allowMultiple: false,
    items: [
      {
        id: SUBMIT_CONFIRMATION_OPTION_ID,
        label: '네, 상기 내용 모두 확인하였으며, 대학생경제교육봉사단 UJAT N기로 지원합니다.',
      },
    ],
    selectedPreviewSingleId: null,
    selectedPreviewMultipleIds: [],
  }
}

function createPreferredRegionMultipleChoiceParagraph(): MultipleChoiceParagraph {
  return {
    id: UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.preferredRegion,
    kind: 'single_item',
    variant: 'multiple_choice',
    requiredMark: true,
    paragraphTitle: '희망 교육 활동 지역',
    paragraphDescription: '금요일 오전 활동이 가능한 지역을 선택해 주세요.',
    participatesInTitleNumbering: true,
    answerRequired: true,
    allowMultiple: false,
    items: UJAT_PROGRAM_APPLICATION_VOLUNTEER_PREFERRED_REGION_ITEMS.map(item => ({
      ...item,
    })),
    selectedPreviewSingleId: null,
    selectedPreviewMultipleIds: [],
  }
}

function createEducationExperienceMultipleChoiceParagraph(): MultipleChoiceParagraph {
  return {
    id: UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.educationExperience,
    kind: 'single_item',
    variant: 'multiple_choice',
    requiredMark: true,
    paragraphTitle: '교육 진행 경험 여부',
    paragraphDescription:
      '교육봉사, 강사 아르바이트 등 교육 진행 경험 여부를 선택해 주세요.',
    participatesInTitleNumbering: true,
    answerRequired: true,
    allowMultiple: false,
    items: [
      {
        id: UJAT_PROGRAM_APPLICATION_VOLUNTEER_EDUCATION_EXPERIENCE_OPTION_IDS.yes,
        label: '있음',
      },
      {
        id: UJAT_PROGRAM_APPLICATION_VOLUNTEER_EDUCATION_EXPERIENCE_OPTION_IDS.no,
        label: '없음',
      },
    ],
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
export function migrateUjatProgramApplicationVolunteerChoiceParagraphs(
  draft: WritingFormDraft
): WritingFormDraft {
  let changed = false
  const paragraphs = draft.paragraphs.map(paragraph => {
    if (
      paragraph.id === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.preferredRegion &&
      paragraph.kind === 'single_item' &&
      paragraph.variant === 'horizontal_table'
    ) {
      changed = true
      return createPreferredRegionMultipleChoiceParagraph()
    }
    if (
      paragraph.id === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.educationExperience &&
      paragraph.kind === 'single_item' &&
      paragraph.variant === 'horizontal_table'
    ) {
      changed = true
      return createEducationExperienceMultipleChoiceParagraph()
    }
    if (
      paragraph.id === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection &&
      paragraph.kind === 'single_item' &&
      paragraph.variant === 'horizontal_table'
    ) {
      const next = patchHorizontalTableTextCell(paragraph, 0, 2, PERSONAL_INFO_RETENTION_CELL)
      if (next !== paragraph) changed = true
      return next
    }
    if (
      paragraph.id === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent &&
      paragraph.kind === 'single_item' &&
      paragraph.variant === 'horizontal_table'
    ) {
      const next = patchHorizontalTableTextCell(paragraph, 0, 3, THIRD_PARTY_RETENTION_CELL)
      if (next !== paragraph) changed = true
      return next
    }
    if (
      paragraph.id === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems &&
      paragraph.kind === 'single_item' &&
      paragraph.paragraphDescription !== FREE_TEXT_ITEMS_DESCRIPTION
    ) {
      changed = true
      return { ...paragraph, paragraphDescription: FREE_TEXT_ITEMS_DESCRIPTION }
    }
    return paragraph
  })
  return changed ? { ...draft, paragraphs } : draft
}

export function createUjatProgramApplicationFormVolunteerDraft(): WritingFormDraft {
  const paragraphs: WritingFormParagraph[] = [
    createPersonalInfoCollectionParagraph(),
    createThirdPartyConsentParagraph(),
    createSeedHorizontalTable(
      UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.basicInfo,
      '기본 정보',
      '학년은 202N년 N학기 기준으로 기재해 주세요.'
    ),
    createSeedHorizontalTable(
      UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousTerm,
      '이전 UJAT 활동 기수',
      '이전에 UJAT 활동한 활동 기수 기재 및 해당 기수의 UJAT 수료증 이미지 파일을 첨부해야 수료증 전형으로 서류전형 통과가 가능합니다.'
    ),
    createPreferredRegionMultipleChoiceParagraph(),
    createEducationExperienceMultipleChoiceParagraph(),
    createSeedHorizontalTable(
      UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule,
      '면접 진행 가능 일정',
      '서류 합격 시 면접이 진행됩니다. 면접 진행이 가능한 일정을 모두 선택해 주세요.'
    ),
    createSeedHorizontalTable(
      UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems,
      '자유 작성 항목',
      FREE_TEXT_ITEMS_DESCRIPTION
    ),
    createSubmitConfirmationMultipleChoiceParagraph(),
  ]
  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs,
  })
}
