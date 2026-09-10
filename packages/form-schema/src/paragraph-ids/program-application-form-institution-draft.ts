import {
  INSTITUTION_GUIDANCE_FIELDS,
  INSTITUTION_GUIDANCE_ANSWER_PLACEHOLDER,
  INSTITUTION_GUIDANCE_SECTION_DESCRIPTION,
} from '../lib/institution-guidance-field-definitions.js'
import {
  INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION,
  INSTITUTION_SEX_OFFENSE_CONSENT_SUBMISSION_SECTION,
} from '../lib/institution-sex-offense-consent-field-definitions.js'
import {
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type MultipleChoiceParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'

/** 프로그램 참여자 신청 폼 (학교) — 시드 단락 ID (개인용 ID와 절대 공유하지 않음) */
export const PROGRAM_APPLICATION_FORM_INSTITUTION_IDS = {
  personalInfoCollection: 'program-application-institution-seed-personal-info',
  thirdPartyConsent: 'program-application-institution-seed-third-party',
  basicInfo: 'program-application-institution-seed-basic-info',
  guidance: 'program-application-institution-seed-guidance',
  sexOffenseConsentSubmissionRequest:
    'program-application-institution-seed-sex-offense-consent-submission',
  sexOffenseConsentInquiryMethod:
    'program-application-institution-seed-sex-offense-consent-inquiry',
  scheduleChoice: 'program-application-institution-seed-schedule',
} as const

export const PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS = new Set<string>(
  Object.values(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS)
)

const PERSONAL_INFO_COLLECTION_BOTTOM =
  '위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

const PERSONAL_INFO_THIRD_PARTY_BOTTOM =
  '위의 개인정보 제3자 정보 제공·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

const PERSONAL_INFO_RETENTION_CELL =
  '이용 기간: 해당 프로그램이 진행되는 기간\n보유 기간: 동의일로부터 3년 보관 후 폐기'

const THIRD_PARTY_RETENTION_CELL = '동의일로부터 3년 보관 후 폐기'

const SCHEDULE_PARAGRAPH_DESCRIPTION =
  '프로그램 등록 시 노출되는 항목에 따라 설명글을 작성해 주세요.'

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
      value: PERSONAL_INFO_RETENTION_CELL,
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
    { kind: 'text' as const, value: THIRD_PARTY_RETENTION_CELL },
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

function createInstitutionGuidanceHorizontalTable(): HorizontalTableParagraph {
  const colCount = 2
  const columnFields = [
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    {
      kind: 'subjective' as const,
      placeholder: INSTITUTION_GUIDANCE_ANSWER_PLACEHOLDER,
    },
  ]
  const fieldDataRows = INSTITUTION_GUIDANCE_FIELDS.map(field => [
    {
      kind: 'text' as const,
      value: `${field.title}\n${field.description}`,
    },
    { kind: 'subjective' as const, value: '' },
  ])

  return normalizeHorizontalTableParagraph({
    id: PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '안내 사항',
    paragraphDescription: INSTITUTION_GUIDANCE_SECTION_DESCRIPTION,
    participatesInTitleNumbering: true,
    tableFlavor: 'field',
    columnHeaders: ['항목', '내용'],
    dataRows: fieldDataRows.map(() => Array.from({ length: colCount }, () => '')),
    columnFields,
    fieldDataRows,
    bottomText: '',
    showBottomText: false,
    showBottomConsent: false,
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
    paragraphDescription: SCHEDULE_PARAGRAPH_DESCRIPTION,
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
    createInstitutionGuidanceHorizontalTable(),
    createInstitutionSeedHorizontalTable(
      PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentSubmissionRequest,
      INSTITUTION_SEX_OFFENSE_CONSENT_SUBMISSION_SECTION.title,
      INSTITUTION_SEX_OFFENSE_CONSENT_SUBMISSION_SECTION.description
    ),
    createInstitutionSeedHorizontalTable(
      PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod,
      INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION.title,
      INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION.description
    ),
    createInstitutionScheduleMultipleChoice(),
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

/** 구 시드 고정 문구 보정 · 일정 단락이 없으면 맨 뒤에 추가 */
export function migrateProgramApplicationFormInstitutionParagraphs(
  draft: WritingFormDraft
): WritingFormDraft {
  let changed = false
  const paragraphs = draft.paragraphs.map(paragraph => {
    if (
      paragraph.id === PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection &&
      paragraph.kind === 'single_item' &&
      paragraph.variant === 'horizontal_table'
    ) {
      const next = patchHorizontalTableTextCell(paragraph, 0, 2, PERSONAL_INFO_RETENTION_CELL)
      if (next !== paragraph) changed = true
      return next
    }
    if (
      paragraph.id === PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent &&
      paragraph.kind === 'single_item' &&
      paragraph.variant === 'horizontal_table'
    ) {
      const next = patchHorizontalTableTextCell(paragraph, 0, 3, THIRD_PARTY_RETENTION_CELL)
      if (next !== paragraph) changed = true
      return next
    }
    if (
      paragraph.id === PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice &&
      paragraph.kind === 'single_item' &&
      paragraph.variant === 'multiple_choice' &&
      paragraph.paragraphDescription !== SCHEDULE_PARAGRAPH_DESCRIPTION
    ) {
      changed = true
      return { ...paragraph, paragraphDescription: SCHEDULE_PARAGRAPH_DESCRIPTION }
    }
    return paragraph
  })
  if (
    !paragraphs.some(
      paragraph => paragraph.id === PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice
    )
  ) {
    changed = true
    paragraphs.push(createInstitutionScheduleMultipleChoice())
  }
  return changed ? { ...draft, paragraphs } : draft
}
