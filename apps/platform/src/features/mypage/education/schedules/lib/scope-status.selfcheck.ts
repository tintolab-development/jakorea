import assert from 'node:assert/strict'
import { filterEducationSchedulesForMemberAssignment } from './scope-status.ts'

const items = [
  { id: 's1', scheduleId: undefined, sessionNumber: 1 },
  { id: '187394', scheduleId: 187394, sessionNumber: 2 },
  { id: 's3', scheduleId: undefined, sessionNumber: 3 },
  { id: 's4', scheduleId: undefined, sessionNumber: 4 },
] as const

assert.deepEqual(
  filterEducationSchedulesForMemberAssignment(items, 'ASSIGNMENT_SCOPED').map(item => item.id),
  ['187394'],
)
assert.deepEqual(
  filterEducationSchedulesForMemberAssignment(items, 'RECORDED_ONLY').map(item => item.id),
  ['187394'],
)
assert.equal(filterEducationSchedulesForMemberAssignment(items, 'PROGRAM_SCHEDULE').length, 4)
assert.equal(filterEducationSchedulesForMemberAssignment(items, 'NO_SCOPE_EVIDENCE').length, 4)
assert.equal(filterEducationSchedulesForMemberAssignment(items, null).length, 4)

console.log('scope-status.selfcheck: ok')
