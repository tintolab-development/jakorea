import {
  INSTITUTION_GUIDANCE_FIELDS,
  INSTITUTION_GUIDANCE_ANSWER_PLACEHOLDER,
  INSTITUTION_GUIDANCE_SECTION_DESCRIPTION,
} from '../lib/institution-guidance-field-definitions.js'
import {
  INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION,
  isLegacyInstitutionSexOffenseConsentInquiryDescription,
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
import {
  APPLICATION_FORM_PERSONAL_INFO_RETENTION_CELL,
  APPLICATION_FORM_THIRD_PARTY_RETENTION_CELL,
} from './application-form-privacy-retention.js'

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

/**
 * 일반_참여 기관 신청 폼 시안(12875:513810) 성범죄경력 조회 동의서 단락 — 제목 붙여쓰기·온라인 교육 안내.
 * 1사1교 시드와 같은 문구. 공용 정의(`INSTITUTION_SEX_OFFENSE_CONSENT_*_SECTION`, Platform 마이페이지 안내 사항)는 바꾸지 않는다.
 */
const GENERAL_SEX_OFFENSE_CONSENT_SUBMISSION_SECTION = {
  title: '성범죄경력 조회 동의서 제출 요청',
  description:
    '강사님들의 성범죄경력 조회 동의서 제출이 필요하신 경우, 동의서 제출을 요청해 주세요. 미요청 또는 교육이 온라인으로 진행되는 경우에는 동의서가 전달 되지 않습니다.',
} as const

const GENERAL_SEX_OFFENSE_CONSENT_INQUIRY_TITLE = '성범죄경력 조회 동의서 조회 방식'

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
      value: '이름, 학교명, 학교주소, 개인 연락처, e-mail',
    },
    {
      kind: 'text' as const,
      value: 'JA 프로그램의 참가자 선발 및 프로그램 진행에 필요한 정보 안내',
    },
    {
      kind: 'text' as const,
      value: APPLICATION_FORM_PERSONAL_INFO_RETENTION_CELL,
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
      value: '이름, 학교명, 학교주소, 개인 연락처, e-mail',
    },
    {
      kind: 'text' as const,
      value: 'JA 프로그램의 참가자 선발 및\n프로그램 진행에 필요한 정보 안내',
    },
    { kind: 'text' as const, value: APPLICATION_FORM_THIRD_PARTY_RETENTION_CELL },
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
  paragraphDescription: string,
  systemFieldKeys?: string[]
): HorizontalTableParagraph {
  return normalizeHorizontalTableParagraph({
    id,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: title,
    paragraphDescription,
    ...(systemFieldKeys != null ? { systemFieldKeys } : {}),
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

/** Platform 신청 작성·CMS와 동일 안내 사항 필드 정의 */
export {
  INSTITUTION_GUIDANCE_ANSWER_MAX_LENGTH,
  INSTITUTION_GUIDANCE_ANSWER_PLACEHOLDER,
  INSTITUTION_GUIDANCE_FIELDS,
  INSTITUTION_GUIDANCE_SECTION_DESCRIPTION,
  type InstitutionGuidanceFieldDefinition,
  type InstitutionGuidanceFieldId,
} from '../lib/institution-guidance-field-definitions.js'

export function createProgramApplicationFormInstitutionDraft(): WritingFormDraft {
  const paragraphs: WritingFormParagraph[] = [
    createInstitutionPersonalInfoHorizontalTable(),
    createInstitutionThirdPartyHorizontalTable(),
    createInstitutionSeedHorizontalTable(
      PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo,
      '기본 정보',
      '설명 입력',
      ['educationFormat']
    ),
    createInstitutionGuidanceHorizontalTable(),
    createInstitutionSeedHorizontalTable(
      PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentSubmissionRequest,
      GENERAL_SEX_OFFENSE_CONSENT_SUBMISSION_SECTION.title,
      GENERAL_SEX_OFFENSE_CONSENT_SUBMISSION_SECTION.description
    ),
    createInstitutionSeedHorizontalTable(
      PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod,
      GENERAL_SEX_OFFENSE_CONSENT_INQUIRY_TITLE,
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
      paragraph.id === PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo &&
      paragraph.kind === 'single_item' &&
      paragraph.variant === 'horizontal_table' &&
      !paragraph.systemFieldKeys?.includes('educationFormat')
    ) {
      changed = true
      return {
        ...paragraph,
        systemFieldKeys: [...(paragraph.systemFieldKeys ?? []), 'educationFormat'],
      }
    }
    if (
      paragraph.id === PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection &&
      paragraph.kind === 'single_item' &&
      paragraph.variant === 'horizontal_table'
    ) {
      const next = patchHorizontalTableTextCell(paragraph, 0, 2, APPLICATION_FORM_PERSONAL_INFO_RETENTION_CELL)
      if (next !== paragraph) changed = true
      return next
    }
    if (
      paragraph.id === PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent &&
      paragraph.kind === 'single_item' &&
      paragraph.variant === 'horizontal_table'
    ) {
      const next = patchHorizontalTableTextCell(paragraph, 0, 3, APPLICATION_FORM_THIRD_PARTY_RETENTION_CELL)
      if (next !== paragraph) changed = true
      return next
    }
    if (
      paragraph.id === PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod &&
      isLegacyInstitutionSexOffenseConsentInquiryDescription(paragraph.paragraphDescription)
    ) {
      changed = true
      return {
        ...paragraph,
        paragraphDescription: INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION.description,
      }
    }
    return paragraph
  })
  if (
    !paragraphs.some(
      paragraph => paragraph.id === PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance
    )
  ) {
    changed = true
    const guidance = createInstitutionGuidanceHorizontalTable()
    const basicInfoIndex = paragraphs.findIndex(
      paragraph => paragraph.id === PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo
    )
    if (basicInfoIndex >= 0) {
      paragraphs.splice(basicInfoIndex + 1, 0, guidance)
    } else {
      paragraphs.push(guidance)
    }
  }
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
