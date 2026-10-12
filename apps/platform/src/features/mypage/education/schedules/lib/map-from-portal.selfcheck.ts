import assert from 'node:assert/strict'
import { mapPortalEducationSchedule } from './map-from-portal.ts'

const withId = mapPortalEducationSchedule(
  {
    scheduleId: 12,
    sessionNo: 2,
    title: '1차 교육',
    startAt: '2026-04-04T10:00:00+09:00',
    endAt: '2026-04-04T12:00:00+09:00',
    locationName: '서울',
    attendanceStatus: 'PRESENT',
  },
  0,
)
assert.ok(withId)
assert.equal(withId.id, '12')
assert.equal(withId.sessionNumber, 2)
assert.equal(withId.title, '1차 교육')
assert.equal(withId.heldAt, '2026-04-04T10:00:00+09:00')
assert.equal(withId.attendanceStatus, 'present')
assert.equal(withId.assignment, undefined)

const noScheduleId = mapPortalEducationSchedule(
  {
    sessionNo: 3,
    startAt: '2026-04-05T10:00:00',
    locationName: '부산센터',
    attendanceStatus: 'EXCUSED',
  },
  2,
)
assert.ok(noScheduleId)
assert.equal(noScheduleId.id, 'schedule-3-2')
assert.equal(noScheduleId.title, '부산센터')
assert.equal(noScheduleId.attendanceStatus, 'excused')

const missingStart = mapPortalEducationSchedule({ scheduleId: 1, title: 'x' }, 0)
assert.equal(missingStart, null)

const titleFallback = mapPortalEducationSchedule({ startAt: '2026-01-01T00:00:00' }, 4)
assert.ok(titleFallback)
assert.equal(titleFallback.sessionNumber, 5)
assert.equal(titleFallback.title, '5회차')

console.log('map-from-portal.selfcheck: ok')
