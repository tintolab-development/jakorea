/**
 * 테이블 셀 날짜/시간 normalize · 주관식 maxLength 기본값 · dropdown selector
 */
import assert from 'node:assert/strict'
import {
  createParagraphByDetail,
  createShortEssayDefault,
  normalizeHorizontalDateTimeMode,
  normalizeHorizontalTableParagraph,
  normalizeVerticalTableParagraph,
  normalizeWritingFormDraft,
  paragraphDetailSelectValue,
  SHORT_ESSAY_MAX_LENGTH,
  type HorizontalTableParagraph,
  type VerticalTableParagraph,
  type WritingFormDraft,
} from '@jakorea/form-schema/writing-form'

assert.equal(normalizeHorizontalDateTimeMode('dateTime'), 'date')
assert.equal(normalizeHorizontalDateTimeMode('date_time'), 'date')
assert.equal(normalizeHorizontalDateTimeMode('time'), 'time')
assert.equal(normalizeHorizontalDateTimeMode('date'), 'date')

const htRaw = {
  id: 'ht-dt',
  kind: 'single_item',
  variant: 'horizontal_table',
  tableFlavor: 'field',
  columnHeaders: ['일정'],
  dataRows: [['']],
  columnFields: [
    {
      kind: 'dateTime',
      dateTimeMode: 'dateTime',
      placeholder: '',
    },
  ],
  fieldDataRows: [[{ kind: 'dateTime', value: '' }]],
  bottomText: '',
  showBottomText: false,
  showBottomConsent: false,
  answerRequired: true,
  requiredMark: true,
  paragraphTitle: '',
  paragraphDescription: '',
  participatesInTitleNumbering: true,
} as unknown as HorizontalTableParagraph

const ht = normalizeHorizontalTableParagraph(htRaw)
assert.equal(ht.columnFields[0]?.kind, 'dateTime')
if (ht.columnFields[0]?.kind === 'dateTime') {
  assert.equal(ht.columnFields[0].dateTimeMode, 'date')
}

const vtTime = normalizeVerticalTableParagraph({
  id: 'vt-t',
  kind: 'single_item',
  variant: 'vertical_table',
  verticalTableFlavor: 'date_time',
  rows: [
    {
      stageCount: 1,
      headers: ['시각'],
      cells: [''],
      stageKinds: ['date_time'],
      dateTimeStageModes: ['time'],
    },
  ],
  bottomText: '',
  showBottomText: false,
  showBottomConsent: false,
  answerRequired: true,
  requiredMark: true,
  paragraphTitle: '',
  paragraphDescription: '',
  participatesInTitleNumbering: true,
} as VerticalTableParagraph)
assert.deepEqual(vtTime.rows[0]?.stageKinds, ['time'])
assert.equal(vtTime.rows[0]?.dateTimeStageModes, undefined)

const essay = createShortEssayDefault('se-1')
assert.equal(essay.maxLength, SHORT_ESSAY_MAX_LENGTH)

const draft = normalizeWritingFormDraft({
  paragraphs: [{ ...essay, maxLength: undefined }],
} as WritingFormDraft)
const normalizedEssay = draft.paragraphs[0]
assert.ok(normalizedEssay?.kind === 'single_item' && normalizedEssay.variant === 'short_essay')
assert.equal(normalizedEssay.maxLength, SHORT_ESSAY_MAX_LENGTH)

const dropdown = createParagraphByDetail('dropdown', 'dd-1')
assert.equal(paragraphDetailSelectValue(dropdown), 'dropdown')

console.log('draft-schema.normalize-date-time.test.ts: ok')
