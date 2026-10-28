import { describe, expect, it } from 'vitest'
import {
  buildUjatAttendanceSessionsFromMatrix,
  collectUnavailableScheduleIds,
  mapAllocationMatrixToRegionTableData,
  mapApiAttendanceStatusToUjatUi,
} from './allocation-matrix-adapters'
import type { UjatAllocationMatrixResponse } from './education-execution-api'

const MATRIX: UjatAllocationMatrixResponse = {
  programId: 1,
  educationRegionCode: 'SEOUL',
  columns: [
    {
      columnKey: '10:100',
      scheduleId: 10,
      educationStartAt: '2026-04-01T10:00:00+09:00',
      organizationApplicationId: 100,
      organizationName: '테스트초',
      organizationRegion: '강남구',
      educationRegionCode: 'SEOUL',
      classCount: 1,
    },
  ],
  volunteers: [
    {
      participantId: 201,
      volunteerName: '김봉사',
      giveUp: false,
      totalAssignedDays: 1,
      cells: [
        {
          columnKey: '10:100',
          scheduleId: 10,
          organizationApplicationId: 100,
          educationSlotId: 501,
          classLabel: '3-1',
          attendanceManager: true,
          singleAssignment: true,
          unavailable: false,
          needsReassignment: false,
          assignmentStatus: 'ASSIGNED',
        },
      ],
    },
    {
      participantId: 202,
      volunteerName: '이포기',
      giveUp: true,
      totalAssignedDays: 0,
      cells: [{ columnKey: '10:100', unavailable: true }],
    },
  ],
}

describe('mapAllocationMatrixToRegionTableData', () => {
  it('maps columns and assigned cells', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: MATRIX,
      regionKey: 'seoul',
    })
    expect(table.columns).toHaveLength(1)
    expect(table.columns[0]?.institutionName).toBe('테스트초')
    expect(table.columns[0]?.scheduleId).toBe('10')
    expect(table.columns[0]?.classSlots[0]?.id).toBe('501')
    expect(table.rows).toHaveLength(2)
    expect(table.rows[0]?.cells[0]).toMatchObject({
      kind: 'assigned',
      classLabel: '3-1',
      isAttendanceManager: true,
      isSolo: true,
    })
    expect(table.rows[1]?.isWithdrawnVolunteer).toBe(true)
    expect(table.rows[1]?.cells[0]).toMatchObject({ kind: 'empty', blockedEmpty: true })
  })

  it('배정 불가 셀에 BE unavailability 대체자 이름을 붙인다', () => {
    const matrix: UjatAllocationMatrixResponse = {
      ...MATRIX,
      volunteers: [
        MATRIX.volunteers![0]!,
        {
          participantId: 202,
          volunteerName: '이불가',
          cells: [{ columnKey: '10:100', scheduleId: 10, unavailable: true }],
        },
      ],
    }
    expect(collectUnavailableScheduleIds(matrix)).toEqual(['10'])

    const table = mapAllocationMatrixToRegionTableData({
      matrix,
      regionKey: 'seoul',
      unavailabilityByScheduleId: {
        '10': [{ scheduleId: 10, participantId: 202, replacementParticipantId: 201 }],
      },
    })
    expect(table.rows[1]?.cells[0]).toEqual({
      kind: 'empty',
      blockedEmpty: true,
      substituteName: '김봉사',
    })
  })

  it('같은 날 다른 일정의 활동 불가 행 대체자는 이 셀에 붙이지 않는다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        ...MATRIX,
        volunteers: [
          MATRIX.volunteers![0]!,
          {
            participantId: 202,
            volunteerName: '이불가',
            cells: [{ columnKey: '10:100', scheduleId: 10, unavailable: true }],
          },
        ],
      },
      regionKey: 'seoul',
      unavailabilityByScheduleId: {
        '10': [{ scheduleId: 11, participantId: 202, replacementParticipantId: 201 }],
      },
    })
    expect(table.rows[1]?.cells[0]).toEqual({ kind: 'empty', blockedEmpty: true })
  })

  it('대체자가 없으면 불가 표시만 남긴다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        ...MATRIX,
        volunteers: [
          {
            participantId: 202,
            volunteerName: '이불가',
            cells: [{ columnKey: '10:100', scheduleId: 10, unavailable: true }],
          },
        ],
      },
      regionKey: 'seoul',
      unavailabilityByScheduleId: {
        '10': [{ scheduleId: 10, participantId: 202, replacementParticipantId: null }],
      },
    })
    expect(table.rows[0]?.cells[0]).toEqual({ kind: 'empty', blockedEmpty: true })
  })
})

describe('buildUjatAttendanceSessionsFromMatrix', () => {
  it('builds sessions with attendance status', () => {
    const sessions = buildUjatAttendanceSessionsFromMatrix({
      matrix: MATRIX,
      attendancesByScheduleId: {
        '10': [{ participantId: 201, status: 'LATE', arrivalTime: '10:15:00' }],
      },
      regionKey: 'seoul',
      half: 'h1',
    })
    expect(sessions).toHaveLength(1)
    expect(sessions[0]?.scheduleId).toBe('10')
    expect(sessions[0]?.volunteers[0]?.status).toBe('late')
    expect(sessions[0]?.volunteers[0]?.checkInTime).toBe('10:15')
    expect(sessions[0]?.volunteers[0]?.assignedClass).toBe('3-1')
  })
})

describe('mapApiAttendanceStatusToUjatUi', () => {
  it('maps each recorded API status without changing its meaning', () => {
    expect(mapApiAttendanceStatusToUjatUi('PRESENT')).toBe('present')
    expect(mapApiAttendanceStatusToUjatUi('LATE')).toBe('late')
    expect(mapApiAttendanceStatusToUjatUi('ABSENT')).toBe('absent')
    expect(mapApiAttendanceStatusToUjatUi('EXCUSED')).toBe('excused_absence')
  })

  it('maps null, undefined, and non-attendance progress values to 미처리', () => {
    expect(mapApiAttendanceStatusToUjatUi(null)).toBe('unprocessed')
    expect(mapApiAttendanceStatusToUjatUi(undefined)).toBe('unprocessed')
    expect(mapApiAttendanceStatusToUjatUi('SCHEDULED')).toBe('unprocessed')
    expect(mapApiAttendanceStatusToUjatUi('COMPLETED')).toBe('unprocessed')
  })
})
