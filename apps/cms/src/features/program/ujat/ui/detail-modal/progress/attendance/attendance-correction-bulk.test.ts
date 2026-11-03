import { describe, expect, it } from 'vitest'
import { buildUjatAttendanceCorrectionBulkItem } from './attendance-correction-bulk'
import type { UjatAttendanceVolunteerRow } from './types'

const baseRow: UjatAttendanceVolunteerRow = {
  id: '42',
  name: '홍길동',
  assignedClass: '1학년 1반',
  contact: '010-0000-0000',
  email: 'a@b.c',
  status: 'present',
  checkInTime: '9:05',
  isDropout: false,
}

describe('buildUjatAttendanceCorrectionBulkItem', () => {
  it('maps a single corrected row for bulk-upsert', () => {
    expect(buildUjatAttendanceCorrectionBulkItem(baseRow)).toEqual({
      participantId: 42,
      status: 'PRESENT',
      absenceReason: null,
      arrivalTime: '09:05',
    })
  })

  it('sends absenceReason only for excused_absence', () => {
    expect(
      buildUjatAttendanceCorrectionBulkItem({
        ...baseRow,
        status: 'excused_absence',
        excusedReason: '  개인 사정  ',
        checkInTime: '9:00',
      })
    ).toEqual({
      participantId: 42,
      status: 'EXCUSED',
      absenceReason: '개인 사정',
      arrivalTime: null,
    })
  })

  it('rejects unprocessed rows', () => {
    expect(() =>
      buildUjatAttendanceCorrectionBulkItem({ ...baseRow, status: 'unprocessed' })
    ).toThrow('UNPROCESSED_ATTENDANCE')
  })
})
