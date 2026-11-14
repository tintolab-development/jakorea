import assert from 'node:assert/strict'
import type { EducationApplicationListItem } from '../model/types'
import { summarizeMypageProgramStatsFromApplications } from './application-list-tab-stats.ts'

function row(id: string, displayStatus: EducationApplicationListItem['displayStatus']) {
  return {
    id,
    programId: 'p',
    categoryLabel: 'c',
    title: 't',
    recruitmentPeriodLabel: '-',
    operatingPeriodLabel: '-',
    recruitmentStatus: 'closed' as const,
    educationTargetLabel: '-',
    educationFormLabel: '-',
    displayStatus,
    detailCase: 'instructor' as const,
  } satisfies EducationApplicationListItem
}

const items: EducationApplicationListItem[] = [
  row('1', 'waiting_result'),
  row('2', 'document_passed'),
  row('3', 'in_progress'),
  row('4', 'completed'),
  row('5', 'rejected'),
]

const stats = summarizeMypageProgramStatsFromApplications(items)
assert.equal(stats.applied, 2)
assert.equal(stats.inProgress, 1)
assert.equal(stats.completed, 1)

const withDuplicateAndCancelled = summarizeMypageProgramStatsFromApplications([
  ...items,
  row('3', 'in_progress'),
  row('6', 'cancelled'),
  row('7', 'approval_cancelled'),
])
assert.equal(withDuplicateAndCancelled.applied, 2)
assert.equal(withDuplicateAndCancelled.inProgress, 1)
assert.equal(withDuplicateAndCancelled.completed, 1)

console.log('application-list-tab-stats.selfcheck: ok')
