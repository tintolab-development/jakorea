import assert from 'node:assert/strict'
import { filterEducationSchedulesForMemberAssignment } from './scope-status.ts'

const items = [
  { id: 's1', scheduleId: undefined, sessionNumber: 1 },
  { id: '187394', scheduleId: 187394, sessionNumber: 2 },
  { id: 's3', scheduleId: undefined, sessionNumber: 3 },
  { id: 's4', scheduleId: undefined, sessionNumber: 4 },
] as const

assert.deepEqual(
  filterEducationSchedulesForMemberAssignment(items).map(item => item.id),
  ['187394'],
)
assert.deepEqual(
  filterEducationSchedulesForMemberAssignment([
    { id: 'null', scheduleId: null },
    { id: 'zero', scheduleId: 0 },
    { id: 'ok', scheduleId: 1 },
  ]).map(item => item.id),
  ['ok'],
)

console.log('scope-status.selfcheck: ok')
