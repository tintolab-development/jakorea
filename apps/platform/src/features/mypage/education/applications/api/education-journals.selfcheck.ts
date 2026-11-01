import assert from 'node:assert/strict'
import { normalizePortalEducationJournalList } from './education-journals-normalize.ts'

assert.deepEqual(normalizePortalEducationJournalList([]), [])
assert.deepEqual(normalizePortalEducationJournalList({ items: [] }), [])
assert.deepEqual(
  normalizePortalEducationJournalList({
    success: true,
    data: [{ journalId: 1, originalFilename: 'a.xlsx' }],
  }),
  [{ journalId: 1, originalFilename: 'a.xlsx' }],
)
assert.deepEqual(
  normalizePortalEducationJournalList({
    success: true,
    data: { items: [{ journalId: 2 }] },
  }),
  [{ journalId: 2 }],
)

console.log('education-journals.selfcheck ok')
