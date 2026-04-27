/**
 * 양식 테스트 > 테이블 가로형
 * — 한 에디터에서 텍스트형·필드형 가로형 테이블만 두 단락으로 두고, 우측 커스텀 필드는 선택된 단락 기준 하나만 둔다.
 */

import { HorizontalTableFormEditor } from '@/features/template/ui/form-set/horizontal-table-form-editor'
import {
  createDefaultHorizontalTableDraft,
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  normalizeHorizontalTableParagraph,
  type HorizontalTableColumnField,
  type HorizontalTableFieldCellValue,
  type HorizontalTableParagraph,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import './form-test-table-components-page.css'

const FORM_TEST_HT_TABLE_TEXT_ID = 'form-test-ht-table-text'
const FORM_TEST_HT_TABLE_FIELD_ID = 'form-test-ht-table-field'

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
    showBottomText: true,
    answerRequired: true,
  })
}

function createFormTestTableComponentsDraft(): WritingFormDraft {
  const base = createDefaultHorizontalTableDraft()
  const t0 = base.paragraphs[0]
  if (t0 == null || t0.kind !== 'single_item' || t0.variant !== 'horizontal_table') return base

  const tableText: HorizontalTableParagraph = { ...t0, id: FORM_TEST_HT_TABLE_TEXT_ID }
  const tableField = buildFormTestFieldTableParagraph(FORM_TEST_HT_TABLE_FIELD_ID)

  return {
    ...base,
    paragraphs: [tableText, tableField],
  }
}

const FORM_TEST_TABLE_DRAFT = createFormTestTableComponentsDraft()

export function FormTestTableComponentsPage() {
  return (
    <div className="template-form-tab__content form-test-table-components-page">
      <HorizontalTableFormEditor
        variant="embedded"
        initialDraft={FORM_TEST_TABLE_DRAFT}
        initialActiveParagraphId={FORM_TEST_HT_TABLE_TEXT_ID}
      />
    </div>
  )
}

export default FormTestTableComponentsPage
