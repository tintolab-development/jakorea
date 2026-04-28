/**
 * 양식 테스트 > 테이블 모음
 * — 가로형(텍스트·필드) + 세로형(텍스트·주관식·날짜/시간·단일·다중 선택); 우측 커스텀 필드는 선택된 단락 기준.
 */

import { HorizontalTableFormEditor } from '@/features/template/ui/form-set/horizontal-table-form-editor'
import {
  DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER,
  createDefaultHorizontalTableDraft,
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  normalizeHorizontalTableParagraph,
  normalizeVerticalTableParagraph,
  verticalTableParagraphOutlineLabel,
  type HorizontalTableColumnField,
  type HorizontalTableFieldCellValue,
  type HorizontalTableParagraph,
  type VerticalTableFlavor,
  type VerticalTableParagraph,
  type VerticalTableRow,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import './form-test-table-components-page.css'

/** 양식 테스트 — 주관식 세로형 데모(스테이지별 항목명·플레이스홀더) */
const FORM_TEST_VT_SUBJECTIVE_DEMO_ROWS: VerticalTableRow[] = [
  {
    stageCount: 1,
    headers: ['주관식형'],
    cells: [''],
    placeholderHints: [DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER],
  },
  {
    stageCount: 2,
    headers: ['주관식형 02', '샘플 03'],
    cells: ['', ''],
    placeholderHints: [DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER, 'sample'],
  },
]

/** 양식 테스트 — 날짜/시간형 세로형 데모(1단 날짜 · 2단 날짜 + 시간) */
const FORM_TEST_VT_DATETIME_DEMO_ROWS: VerticalTableRow[] = [
  {
    stageCount: 1,
    headers: ['날짜/시간형'],
    cells: [''],
  },
  {
    stageCount: 2,
    headers: ['날짜/시간형 02', '샘플 03'],
    cells: ['', ''],
    placeholderHints: ['', 'sample'],
    dateTimeStage1Time: '',
  },
]

/** 양식 테스트 — 세로형 단일선택 데모(1단 · 2단 두 쌍) */
const FORM_TEST_VT_SINGLE_CHOICE_DEMO_ROWS: VerticalTableRow[] = [
  { stageCount: 1, headers: ['단일선택형'], cells: [''] },
  {
    stageCount: 2,
    headers: ['단일선택형 02', '샘플 03'],
    cells: ['', ''],
  },
]

/** 양식 테스트 — 세로형 다중선택 데모 */
const FORM_TEST_VT_MULTIPLE_CHOICE_DEMO_ROWS: VerticalTableRow[] = [
  {
    stageCount: 1,
    headers: ['다중선택형'],
    cells: [''],
    choiceMultipleSelections: [[]],
  },
  {
    stageCount: 2,
    headers: ['다중선택형 02', '샘플 03'],
    cells: ['', ''],
    choiceMultipleSelections: [[], []],
  },
]

const FORM_TEST_HT_TABLE_TEXT_ID = 'form-test-ht-table-text'
const FORM_TEST_HT_TABLE_FIELD_ID = 'form-test-ht-table-field'
const FORM_TEST_VT_TEXT_ID = 'form-test-vt-text'
const FORM_TEST_VT_SUBJECTIVE_ID = 'form-test-vt-subjective'
const FORM_TEST_VT_DATETIME_ID = 'form-test-vt-datetime'
const FORM_TEST_VT_SINGLE_CHOICE_ID = 'form-test-vt-single-choice'
const FORM_TEST_VT_MULTIPLE_CHOICE_ID = 'form-test-vt-multiple-choice'

const FORM_TEST_FIELD_COLUMN_HEADERS = [
  '주관식형',
  '드롭다운형',
  '날짜/시간형',
  '단일선택형',
  '다중선택형',
] as const

const FORM_TEST_FIELD_COLUMN_FIELDS: HorizontalTableColumnField[] = [
  { kind: 'subjective', placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER },
  {
    kind: 'dropdown',
    placeholder: '전체',
    options: ['A', 'B', 'C'],
  },
  {
    kind: 'dateTime',
    dateTimeMode: 'date',
    placeholder: '날짜를 선택해 주세요',
  },
  { kind: 'single', options: ['A', 'B', 'C'] },
  { kind: 'multiple', options: ['A', 'B', 'C'] },
]

const FORM_TEST_FIELD_FIRST_ROW: HorizontalTableFieldCellValue[] = [
  { kind: 'subjective', value: '' },
  { kind: 'dropdown', value: '' },
  { kind: 'dateTime', value: '' },
  { kind: 'single', value: 'B' },
  { kind: 'multiple', values: ['B', 'C'] },
]

function buildFormTestVerticalParagraph(
  id: string,
  flavor: VerticalTableFlavor,
  demoRows?: VerticalTableParagraph['rows']
): VerticalTableParagraph {
  const rows =
    demoRows ??
    ([
      { stageCount: 1, headers: [''], cells: [''] },
      {
        stageCount: 2,
        headers: ['', ''],
        cells: ['', ''],
      },
    ] as VerticalTableParagraph['rows'])
  return normalizeVerticalTableParagraph({
    id,
    kind: 'single_item',
    variant: 'vertical_table',
    verticalTableFlavor: flavor,
    requiredMark: true,
    paragraphTitle: verticalTableParagraphOutlineLabel(flavor),
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    ...(flavor === 'single_choice' || flavor === 'multiple_choice'
      ? { verticalChoiceOptions: ['A', 'B', 'C'] }
      : {}),
    rows,
    bottomText: '',
    showBottomText: false,
    showBottomConsent: false,
    answerRequired: true,
  })
}

function buildFormTestFieldTableParagraph(id: string): HorizontalTableParagraph {
  const colCount = FORM_TEST_FIELD_COLUMN_HEADERS.length
  return normalizeHorizontalTableParagraph({
    id,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '테이블_가로형(필드형)',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    tableFlavor: 'field',
    columnHeaders: [...FORM_TEST_FIELD_COLUMN_HEADERS],
    dataRows: [Array.from({ length: colCount }, () => '')],
    columnFields: FORM_TEST_FIELD_COLUMN_FIELDS.map((f): HorizontalTableColumnField => {
      if (f.kind === 'dropdown' || f.kind === 'single' || f.kind === 'multiple') {
        return { ...f, options: [...f.options] }
      }
      return { ...f }
    }),
    fieldDataRows: [
      FORM_TEST_FIELD_FIRST_ROW.map((c): HorizontalTableFieldCellValue =>
        c.kind === 'multiple' ? { kind: 'multiple', values: [...c.values] } : { ...c }
      ),
    ],
    bottomText: '',
    showBottomText: false,
    showBottomConsent: false,
    answerRequired: true,
  })
}

function createFormTestTableComponentsDraft(): WritingFormDraft {
  const base = createDefaultHorizontalTableDraft()
  const t0 = base.paragraphs[0]
  if (t0 == null || t0.kind !== 'single_item' || t0.variant !== 'horizontal_table') return base

  const tableText: HorizontalTableParagraph = { ...t0, id: FORM_TEST_HT_TABLE_TEXT_ID }
  const tableField = buildFormTestFieldTableParagraph(FORM_TEST_HT_TABLE_FIELD_ID)
  const vtText = buildFormTestVerticalParagraph(FORM_TEST_VT_TEXT_ID, 'text')
  const vtSubjective = buildFormTestVerticalParagraph(
    FORM_TEST_VT_SUBJECTIVE_ID,
    'subjective',
    FORM_TEST_VT_SUBJECTIVE_DEMO_ROWS
  )
  const vtDateTime = buildFormTestVerticalParagraph(
    FORM_TEST_VT_DATETIME_ID,
    'date_time',
    FORM_TEST_VT_DATETIME_DEMO_ROWS
  )
  const vtSingleChoice = buildFormTestVerticalParagraph(
    FORM_TEST_VT_SINGLE_CHOICE_ID,
    'single_choice',
    FORM_TEST_VT_SINGLE_CHOICE_DEMO_ROWS
  )
  const vtMultipleChoice = buildFormTestVerticalParagraph(
    FORM_TEST_VT_MULTIPLE_CHOICE_ID,
    'multiple_choice',
    FORM_TEST_VT_MULTIPLE_CHOICE_DEMO_ROWS
  )

  return {
    ...base,
    paragraphs: [
      tableText,
      tableField,
      vtText,
      vtSubjective,
      vtDateTime,
      vtSingleChoice,
      vtMultipleChoice,
    ],
  }
}

const FORM_TEST_TABLE_DRAFT = createFormTestTableComponentsDraft()

export function FormTestTableComponentsPage() {
  return (
    <div className="template-form-tab__content form-test-table-components-page">
      <HorizontalTableFormEditor
        variant="embedded"
        initialDraft={FORM_TEST_TABLE_DRAFT}
        initialActiveParagraphId={FORM_TEST_VT_MULTIPLE_CHOICE_ID}
      />
    </div>
  )
}

export default FormTestTableComponentsPage
