import assert from 'node:assert/strict'
import {
  findSettlementApplicationForLectureAssignment,
  isKnownSettlementApplicationSubmitted,
} from './settlement-join.ts'

assert.equal(isKnownSettlementApplicationSubmitted(undefined), false)
assert.equal(isKnownSettlementApplicationSubmitted({}), false)
assert.equal(
  isKnownSettlementApplicationSubmitted({ applicationId: 1, status: 'DRAFT' }),
  false,
)
assert.equal(
  isKnownSettlementApplicationSubmitted({ applicationId: 1, status: 'NOT_SUBMITTED' }),
  false,
)
assert.equal(
  isKnownSettlementApplicationSubmitted({
    applicationId: 9,
    assignmentId: 10,
    status: 'WAITING_CONFIRM',
    submittedAt: '2026-11-06T01:00:00Z',
  }),
  true,
)
assert.equal(
  isKnownSettlementApplicationSubmitted({ applicationId: 9, status: 'REJECTED' }),
  true,
)

const rows = [
  {
    applicationId: 1,
    assignmentId: 10,
    programScheduleId: 88,
    programId: 100,
    status: 'WAITING_CONFIRM',
    submittedAt: '2026-11-01T00:00:00Z',
  },
  {
    applicationId: 2,
    assignmentId: 11,
    programScheduleId: 89,
    programId: 100,
    status: 'DRAFT',
  },
]
assert.equal(
  isKnownSettlementApplicationSubmitted(
    findSettlementApplicationForLectureAssignment(rows, {
      assignmentId: 10,
      scheduleId: 88,
      programId: 100,
    }),
  ),
  true,
)
assert.equal(
  isKnownSettlementApplicationSubmitted(
    findSettlementApplicationForLectureAssignment(rows, {
      assignmentId: 11,
      scheduleId: 89,
      programId: 100,
    }),
  ),
  false,
)
assert.equal(
  findSettlementApplicationForLectureAssignment(rows, {
    assignmentId: 99,
    scheduleId: 1,
    programId: 100,
  }),
  undefined,
)

console.log('settlement-join.selfcheck: ok')
