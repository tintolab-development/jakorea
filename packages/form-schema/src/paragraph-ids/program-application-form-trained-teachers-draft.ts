import {
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  normalizeHorizontalTableParagraph,
  normalizeWritingFormDraft,
  type HorizontalTableParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'

/** 교육받은 교사 프로그램 참여자 신청 폼 — 시드 단락 ID */
export const PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS = {
  personalInfoCollection: 'program-application-trained-teachers-seed-personal-info',
  thirdPartyConsent: 'program-application-trained-teachers-seed-third-party',
  basicInfo: 'program-application-trained-teachers-seed-basic-info',
  preferredSchedule: 'program-application-trained-teachers-seed-preferred-schedule',
} as const

export const PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_SEED_PARAGRAPH_IDS = new Set<string>(
  Object.values(PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS)
)

const PERSONAL_INFO_COLLECTION_BOTTOM =
  '위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

const PERSONAL_INFO_THIRD_PARTY_BOTTOM =
  '위의 개인정보 제3자 정보 제공·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.'

function createTrainedTeachersPersonalInfoHorizontalTable(): HorizontalTableParagraph {
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
      value:
        '- 이용 기간: 해당 프로그램이 진행되는 기간\n- 보유 기간: 동의일로부터 3년 보관 후 폐기',
    },
  ]

  return normalizeHorizontalTableParagraph({
    id: PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.personalInfoCollection,
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

function createTrainedTeachersThirdPartyHorizontalTable(): HorizontalTableParagraph {
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
    { kind: 'text' as const, value: '동의일로부터 3년 보관 후 폐기' },
  ]

  return normalizeHorizontalTableParagraph({
    id: PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.thirdPartyConsent,
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

function createTrainedTeachersPlaceholderTable(
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

export function createProgramApplicationFormTrainedTeachersDraft(): WritingFormDraft {
  const paragraphs: WritingFormParagraph[] = [
    createTrainedTeachersPersonalInfoHorizontalTable(),
    createTrainedTeachersThirdPartyHorizontalTable(),
    createTrainedTeachersPlaceholderTable(
      PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.basicInfo,
      '기본 정보',
      ''
    ),
    createTrainedTeachersPlaceholderTable(
      PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule,
      '진행 희망 교육 일정',
      '프로그램 등록 시 노출되는 항목에 따라 설명글을 작성해 주세요.'
    ),
  ]

  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs,
  })
}

/** 「제공받는 곳」 주관식→텍스트 정규화 */
function migrateTrainedTeachersThirdPartyProviderColumn(
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
  if (!needsFieldKind && !needsCellKind) return paragraph

  const nextColumnFields = columnFields.map((field, idx) => {
    if (idx !== 0 || field.kind !== 'subjective') return field
    return {
      kind: 'text' as const,
      placeholder: field.placeholder || '제공받는 곳을 입력해 주세요',
    }
  })
  if (needsCellKind && firstCell != null && fieldDataRows[0]) {
    const value = 'value' in firstCell ? firstCell.value : ''
    fieldDataRows[0][0] = { kind: 'text', value }
  }
  return { ...paragraph, columnFields: nextColumnFields, fieldDataRows }
}

/** 구 시드 보정 */
export function migrateProgramApplicationFormTrainedTeachersParagraphs(
  draft: WritingFormDraft
): WritingFormDraft {
  let changed = false
  const paragraphs = draft.paragraphs.map(paragraph => {
    if (
      paragraph.id !== PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.thirdPartyConsent ||
      paragraph.kind !== 'single_item' ||
      paragraph.variant !== 'horizontal_table'
    ) {
      return paragraph
    }
    const next = migrateTrainedTeachersThirdPartyProviderColumn(paragraph)
    if (next !== paragraph) changed = true
    return next
  })
  return changed ? { ...draft, paragraphs } : draft
}
