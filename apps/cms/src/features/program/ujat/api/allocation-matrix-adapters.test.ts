import { describe, expect, it } from 'vitest'
import {
  buildUjatAttendanceSessionsFromMatrix,
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
    expect(sessions[0]?.volunteers[0]?.assignedClass).toBe('3-1')
  })
})

describe('mapApiAttendanceStatusToUjatUi', () => {
  it('maps known statuses', () => {
    expect(mapApiAttendanceStatusToUjatUi('PRESENT')).toBe('present')
    expect(mapApiAttendanceStatusToUjatUi('EXCUSED')).toBe('excused_absence')
  })
})
