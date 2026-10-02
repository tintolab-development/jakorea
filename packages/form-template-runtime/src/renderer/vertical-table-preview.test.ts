/**
 * vertical-table-preview — layout resolver + fill patches
 */
import assert from 'node:assert/strict'
import {
  createVerticalTableParagraph,
  normalizeVerticalTableParagraph,
  type VerticalTableParagraph,
} from '@jakorea/form-schema/writing-form'
import {
  patchVerticalTableBottomConsent,
  patchVerticalTableCell,
  patchVerticalTableCompositeTime,
  patchVerticalTableFileNames,
  patchVerticalTableMultipleChoice,
  resolveVerticalTablePreviewLayout,
} from './vertical-table-preview.ts'

function assertNormalizedPreserved(next: VerticalTableParagraph) {
  assert.deepEqual(next, normalizeVerticalTableParagraph(next))
}

const singleColumn = createVerticalTableParagraph('vt-single', 'text')
const singleLayout = resolveVerticalTablePreviewLayout(singleColumn)
assert.equal(singleLayout.paragraph.verticalTableFlavor, 'text')
assert.ok(singleLayout.rows.length >= 1)
assert.equal(singleLayout.rows[0]?.stageCount, 1)
assert.equal(singleLayout.rows[0]?.stages.length, 1)
assert.equal(singleLayout.rows[0]?.stages[0]?.kind, 'text')

const twoColumn: VerticalTableParagraph = normalizeVerticalTableParagraph({
  ...createVerticalTableParagraph('vt-two', 'subjective'),
  rows: [
    {
      stageCount: 2,
      headers: ['시작', '종료'],
      cells: ['', ''],
      stageKinds: ['subjective', 'date_time'],
    },
  ],
})
const twoLayout = resolveVerticalTablePreviewLayout(twoColumn)
assert.equal(twoLayout.rows.length, 1)
assert.equal(twoLayout.rows[0]?.stageCount, 2)
assert.equal(twoLayout.rows[0]?.stages.length, 2)
assert.equal(twoLayout.rows[0]?.stages[0]?.kind, 'subjective')
assert.equal(twoLayout.rows[0]?.stages[1]?.kind, 'date_time')
assert.equal(twoLayout.rows[0]?.stages[0]?.header, '시작')
assert.equal(twoLayout.rows[0]?.stages[1]?.header, '종료')

const fileStage: VerticalTableParagraph = normalizeVerticalTableParagraph({
  ...createVerticalTableParagraph('vt-file', 'text'),
  rows: [
    {
      stageCount: 1,
      headers: ['증빙'],
      cells: [''],
      stageKinds: ['file_attachment'],
    },
    {
      stageCount: 1,
      headers: ['메모'],
      cells: [''],
      stageKinds: ['subjective'],
    },
  ],
})
const fileLayout = resolveVerticalTablePreviewLayout(fileStage)
assert.equal(fileLayout.paragraph.verticalTableFlavor, 'text')
assert.equal(fileLayout.rows[0]?.stages[0]?.kind, 'file_attachment')
assert.equal(fileLayout.rows[0]?.stages[0]?.header, '증빙')
assert.equal(fileLayout.rows[1]?.stages[0]?.kind, 'subjective')

const legacyFile: VerticalTableParagraph = {
  ...createVerticalTableParagraph('vt-legacy-file', 'text'),
  verticalTableFlavor: 'file_attachment',
  verticalFileAttachmentHeaderLabel: '첨부 서류',
  rows: [
    {
      stageCount: 1,
      headers: [''],
      cells: [''],
    },
  ],
}
const legacyLayout = resolveVerticalTablePreviewLayout(legacyFile)
assert.equal(legacyLayout.paragraph.verticalTableFlavor, 'text')
assert.equal(legacyLayout.paragraph.verticalFileAttachmentHeaderLabel, undefined)
assert.equal(legacyLayout.rows[0]?.stages[0]?.kind, 'file_attachment')
assert.equal(legacyLayout.rows[0]?.stages[0]?.header, '첨부 서류')
assert.deepEqual(legacyLayout.paragraph.rows[0]?.stageKinds, ['file_attachment'])

const patchedCell = patchVerticalTableCell(singleColumn, 0, 0, '입력값')
assertNormalizedPreserved(patchedCell)
assert.equal(patchedCell.rows[0]?.cells[0], '입력값')
assert.equal(patchedCell.verticalTableFlavor, 'text')

const patchedConsent = patchVerticalTableBottomConsent(singleColumn, 'disagree')
assertNormalizedPreserved(patchedConsent)
assert.equal(patchedConsent.bottomConsent, 'disagree')

const dateRow: VerticalTableParagraph = normalizeVerticalTableParagraph({
  ...createVerticalTableParagraph('vt-date', 'date_time'),
  rows: [
    {
      stageCount: 1,
      headers: ['일정'],
      cells: ['2026-10-02'],
      stageKinds: ['date_time'],
      dateTimeStageModes: ['date_time'],
    },
  ],
})
const patchedTime = patchVerticalTableCompositeTime(dateRow, 0, 0, '14:30')
assertNormalizedPreserved(patchedTime)
assert.equal(patchedTime.rows[0]?.dateTimeStage0AuxTime, '14:30')
assert.equal(patchedTime.rows[0]?.dateTimeStage1Time, '14:30')
assert.equal(patchedTime.rows[0]?.cells[0], '2026-10-02')

const choiceRow: VerticalTableParagraph = normalizeVerticalTableParagraph({
  ...createVerticalTableParagraph('vt-choice', 'multiple_choice'),
  verticalChoiceOptions: ['A', 'B', 'C'],
  rows: [
    {
      stageCount: 1,
      headers: ['선택'],
      cells: [''],
      stageKinds: ['multiple_choice'],
    },
  ],
})
const patchedChoice = patchVerticalTableMultipleChoice(choiceRow, 0, 0, ['A', 'C'])
assertNormalizedPreserved(patchedChoice)
assert.deepEqual(patchedChoice.rows[0]?.choiceMultipleSelections?.[0], ['A', 'C'])
assert.deepEqual(patchedChoice.verticalChoiceOptions, ['A', 'B', 'C'])

const textFlavorMultiple: VerticalTableParagraph = normalizeVerticalTableParagraph({
  ...createVerticalTableParagraph('vt-text-multi', 'text'),
  rows: [
    {
      stageCount: 1,
      headers: ['다중'],
      cells: [''],
      stageKinds: ['multiple_choice'],
      choiceMultipleSelections: [['A']],
    },
  ],
  verticalChoiceOptions: ['A', 'B', 'C'],
})
assert.equal(textFlavorMultiple.verticalTableFlavor, 'text')
assert.deepEqual(textFlavorMultiple.rows[0]?.stageKinds, ['multiple_choice'])
assert.deepEqual(textFlavorMultiple.rows[0]?.choiceMultipleSelections?.[0], ['A'])
const textFlavorMultipleLayout = resolveVerticalTablePreviewLayout(textFlavorMultiple)
assert.equal(textFlavorMultipleLayout.rows[0]?.stages[0]?.kind, 'multiple_choice')
assert.deepEqual(textFlavorMultipleLayout.rows[0]?.stages[0]?.multipleSelected, ['A'])

const patchedFiles = patchVerticalTableFileNames(fileStage, 0, 0, ['a.png', 'b.jpg'])
assertNormalizedPreserved(patchedFiles)
assert.equal(patchedFiles.rows[0]?.cells[0], 'a.png | b.jpg')
assert.equal(patchedFiles.rows[1]?.cells[0], '')
assert.deepEqual(patchedFiles.rows[0]?.stageKinds, ['file_attachment'])

const fileLayoutAfterPatch = resolveVerticalTablePreviewLayout(patchedFiles)
assert.deepEqual(fileLayoutAfterPatch.rows[0]?.stages[0]?.fileNames, ['a.png', 'b.jpg'])

console.log('vertical-table-preview.test: ok')
