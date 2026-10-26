import assert from 'node:assert/strict'
import { normalizeHorizontalTableParagraph } from '@jakorea/form-schema/writing-form'
import { patchHorizontalTableDataCell } from './horizontal-table-preview.ts'

const paragraph = normalizeHorizontalTableParagraph({
  id: 'gemini-vt-instructor-seed-official-document',
  kind: 'single_item',
  variant: 'horizontal_table',
  requiredMark: true,
  paragraphTitle: '연수 공문',
  tableFlavor: 'text',
  columnHeaders: ['항목', '내용'],
  dataRows: [['', '']],
  columnFields: [],
  fieldDataRows: [],
  answerRequired: true,
})

const next = patchHorizontalTableDataCell(paragraph, 0, 1, '이름, 소속(학교)')
assert.deepEqual(next.dataRows, [['', '이름, 소속(학교)']])
assert.deepEqual(paragraph.dataRows, [['', '']])

console.log('horizontal-table-preview.test: ok')
