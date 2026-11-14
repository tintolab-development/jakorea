import {
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'
import {
  INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION,
  isLegacyInstitutionSexOffenseConsentInquiryDescription,
} from '../lib/institution-sex-offense-consent-field-definitions.js'

/** 1사1교 프로그램 참여자 신청 폼 — 시드 단락 ID */
export const PROGRAM_APPLICATION_FORM_ECONOMY_IDS = {
  personalInfoCollection: 'program-application-economy-seed-personal-info',
  thirdPartyConsent: 'program-application-economy-seed-third-party',
  basicInfo: 'program-application-economy-seed-basic-info',
  guidance: 'program-application-economy-seed-guidance',
  sexOffenseConsentSubmissionRequest:
    'program-application-economy-seed-sex-offense-consent-submission',
  sexOffenseConsentInquiryMethod:
    'program-application-economy-seed-sex-offense-consent-inquiry',
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

const PERSONAL_INFO_PURPOSE_CELL =
  'JA 프로그램의 참가자 선발 및 프로그램 진행에 필요한 정보 안내'
const PERSONAL_INFO_RETENTION_CELL =
  '이용 기간: 해당 프로그램이 진행되는 기간\n보유 기간: 동의일로부터 3년 보관 후 파기'
/** 일반 참여기관 신청 폼과 동일 — 보유기간 열 고정 문구 */
const THIRD_PARTY_RETENTION_CELL = '동의일로부터 3년 보관 후 파기'
/** 1사1교 시안(9899:216613) — 수집·이용 / 제3자 제공 표 공통 수집 항목 */
const ECONOMY_COLLECTION_ITEMS_CELL = '이름, 학교명, 학교주소, 개인 연락처, e-mail'
const THIRD_PARTY_ITEMS_CELL = ECONOMY_COLLECTION_ITEMS_CELL

/**
 * 1사1교 시안(9899:216613) 성범죄경력 조회 동의서 단락 — 제목 붙여쓰기·온라인 교육 안내.
 * 일반 기관 신청 폼 공용 정의(`INSTITUTION_SEX_OFFENSE_CONSENT_*_SECTION`)는 바꾸지 않는다.
 */
const ECONOMY_SEX_OFFENSE_CONSENT_SUBMISSION_SECTION = {
  title: '성범죄경력 조회 동의서 제출 요청',
  description:
    '강사님들의 성범죄경력 조회 동의서 제출이 필요하신 경우, 동의서 제출을 요청해 주세요. 미요청 또는 교육이 온라인으로 진행되는 경우에는 동의서가 전달 되지 않습니다.',
} as const

const ECONOMY_SEX_OFFENSE_CONSENT_INQUIRY_TITLE = '성범죄경력 조회 동의서 조회 방식'
const THIRD_PARTY_PURPOSE_CELL =
  'JA 프로그램의 참가자 선발 및\n프로그램 진행에 필요한 정보 안내'

function createEconomyPersonalInfoHorizontalTable(): HorizontalTableParagraph {
  const colCount = 3
  const columnFields = Array.from({ length: colCount }, () => ({
    kind: 'text' as const,
    placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  }))
  const bodyRow = [
    {
      kind: 'text' as const,
      value: ECONOMY_COLLECTION_ITEMS_CELL,
    },
    {
      kind: 'text' as const,
      value: PERSONAL_INFO_PURPOSE_CELL,
    },
    {
      kind: 'text' as const,
      value: PERSONAL_INFO_RETENTION_CELL,
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
    { kind: 'text' as const, placeholder: '제공받는 곳을 입력해 주세요' },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
    { kind: 'text' as const, placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
  ]
  const bodyRow = [
    { kind: 'text' as const, value: '' },
    { kind: 'text' as const, value: THIRD_PARTY_ITEMS_CELL },
    { kind: 'text' as const, value: THIRD_PARTY_PURPOSE_CELL },
    { kind: 'text' as const, value: THIRD_PARTY_RETENTION_CELL },
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
    ...(id === PROGRAM_APPLICATION_FORM_ECONOMY_IDS.basicInfo
      ? { systemFieldKeys: ['educationFormat'] }
      : {}),
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
      PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentSubmissionRequest,
      ECONOMY_SEX_OFFENSE_CONSENT_SUBMISSION_SECTION.title,
      ECONOMY_SEX_OFFENSE_CONSENT_SUBMISSION_SECTION.description
    ),
    createEconomyPlaceholderTable(
      PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentInquiryMethod,
      ECONOMY_SEX_OFFENSE_CONSENT_INQUIRY_TITLE,
      INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION.description
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

function toProviderTextColumnField(
  field: NonNullable<HorizontalTableParagraph['columnFields']>[number]
): NonNullable<HorizontalTableParagraph['columnFields']>[number] {
  if (field.kind !== 'subjective') return field
  return {
    kind: 'text',
    placeholder: field.placeholder || '제공받는 곳을 입력해 주세요',
  }
}

/** 「제공받는 곳」을 주관식→텍스트로 맞추고, 셀·cellColumnFields kind도 함께 정규화 */
function migrateEconomyThirdPartyProviderColumn(
  paragraph: HorizontalTableParagraph
): HorizontalTableParagraph {
  const columnFields = paragraph.columnFields ?? []
  const firstField = columnFields[0]
  const needsFieldKind = firstField != null && firstField.kind === 'subjective'
  const fieldDataRows = (paragraph.fieldDataRows ?? []).map(cells =>
    cells.map(cell => ({ ...cell }))
  )
  const firstCell = fieldDataRows[0]?.[0]
  const needsCellKind = firstCell?.kind === 'subjective'
  const needsMatrixKind = (paragraph.cellColumnFields ?? []).some(
    row => row[0]?.kind === 'subjective'
  )

  if (!needsFieldKind && !needsCellKind && !needsMatrixKind) return paragraph

  const nextColumnFields = columnFields.map((field, idx) =>
    idx === 0 ? toProviderTextColumnField(field) : field
  )
  if (needsCellKind && firstCell != null && fieldDataRows[0]) {
    const value = 'value' in firstCell ? firstCell.value : ''
    fieldDataRows[0][0] = { kind: 'text', value }
  }
  const nextCellColumnFields = paragraph.cellColumnFields?.map(row =>
    row.map((field, colIdx) => (colIdx === 0 ? toProviderTextColumnField(field) : field))
  )
  return {
    ...paragraph,
    columnFields: nextColumnFields,
    fieldDataRows,
    ...(nextCellColumnFields != null ? { cellColumnFields: nextCellColumnFields } : {}),
  }
}

/** 구 시드 고정 문구 보정 */
export function migrateProgramApplicationFormEconomyParagraphs(
  draft: WritingFormDraft
): WritingFormDraft {
  let changed = false
  const paragraphs = draft.paragraphs.map(paragraph => {
    if (paragraph.kind !== 'single_item' || paragraph.variant !== 'horizontal_table') {
      return paragraph
    }
    if (
      paragraph.id === PROGRAM_APPLICATION_FORM_ECONOMY_IDS.basicInfo &&
      !paragraph.systemFieldKeys?.includes('educationFormat')
    ) {
      changed = true
      return {
        ...paragraph,
        systemFieldKeys: [...(paragraph.systemFieldKeys ?? []), 'educationFormat'],
      }
    }
    if (paragraph.id === PROGRAM_APPLICATION_FORM_ECONOMY_IDS.personalInfoCollection) {
      let next = patchHorizontalTableTextCell(paragraph, 0, 1, PERSONAL_INFO_PURPOSE_CELL)
      next = patchHorizontalTableTextCell(next, 0, 2, PERSONAL_INFO_RETENTION_CELL)
      if (next !== paragraph) changed = true
      return next
    }
    if (paragraph.id === PROGRAM_APPLICATION_FORM_ECONOMY_IDS.thirdPartyConsent) {
      let next = migrateEconomyThirdPartyProviderColumn(paragraph)
      next = patchHorizontalTableTextCell(next, 0, 3, THIRD_PARTY_RETENTION_CELL)
      if (next !== paragraph) changed = true
      return next
    }
    if (
      paragraph.id === PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentInquiryMethod &&
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
    !paragraphs.some(paragraph => paragraph.id === PROGRAM_APPLICATION_FORM_ECONOMY_IDS.guidance)
  ) {
    changed = true
    const guidance = createEconomyPlaceholderTable(
      PROGRAM_APPLICATION_FORM_ECONOMY_IDS.guidance,
      '안내 사항',
      '강사님들에게 제공 또는 요청할 사전 정보를 작성해 주세요.'
    )
    const basicInfoIndex = paragraphs.findIndex(
      paragraph => paragraph.id === PROGRAM_APPLICATION_FORM_ECONOMY_IDS.basicInfo
    )
    if (basicInfoIndex >= 0) {
      paragraphs.splice(basicInfoIndex + 1, 0, guidance)
    } else {
      paragraphs.push(guidance)
    }
  }
  return changed ? { ...draft, paragraphs } : draft
}
