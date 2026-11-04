import { describe, expect, it } from 'vitest'
import {
  buildUjatAttendanceSessionsFromMatrix,
  collectUnavailableScheduleIds,
  mapAllocationMatrixToRegionTableData,
  mapApiAttendanceStatusToUjatUi,
  matrixColumnsIncludeEducationSlots,
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
    expect(table.columns[0]?.dateLabel).toBe('4월 1일')
    expect(table.columns[0]?.scheduleId).toBe('10')
    expect(table.columns[0]?.classSlots[0]?.id).toBe('501')
    expect(table.rows).toHaveLength(2)
    expect(table.rows[0]?.cells[0]).toMatchObject({
      kind: 'assigned',
      classLabel: '3-1',
      isAttendanceManager: true,
      isSolo: true,
      assignmentStatus: 'ASSIGNED',
      educationSlotId: '501',
    })
    expect(table.rows[1]?.isWithdrawnVolunteer).toBe(true)
    expect(table.rows[1]?.cells[0]).toMatchObject({ kind: 'empty', blockedEmpty: true })
  })

  it('organizationRegion null 은 빈 문자열 invent 없이 UI - 로 표시한다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        ...MATRIX,
        columns: [
          {
            ...MATRIX.columns![0],
            organizationRegion: null,
            educationStartAt: '2026-11-05T15:00:00Z',
          },
        ],
      },
      regionKey: 'seoul',
    })
    expect(table.columns[0]?.location).toBe('-')
    expect(table.columns[0]?.isoDate).toBe('2026-11-06')
    expect(table.columns[0]?.dateLabel).toBe('11월 6일')
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
    expect(
      collectUnavailableScheduleIds({
        ...matrix,
        volunteers: [
          {
            participantId: 202,
            volunteerName: '이불가',
            cells: [
              {
                columnKey: '10:100',
                scheduleId: 10,
                unavailable: true,
                replacementParticipantId: 201,
                replacementVolunteerName: '김봉사',
              },
            ],
          },
        ],
      })
    ).toEqual([])

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

  it('classCount만 있고 org/cell 슬롯이 없으면 classSlots를 invent하지 않는다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        ...MATRIX,
        columns: [{ ...MATRIX.columns![0]!, classCount: 3 }],
        volunteers: [
          {
            participantId: 201,
            volunteerName: '김미배정',
            cells: [{ columnKey: '10:100', scheduleId: 10, unavailable: false }],
          },
        ],
      },
      regionKey: 'seoul',
    })
    expect(table.columns[0]?.classSlots).toEqual([])
    expect(table.rows[0]?.cells[0]).toEqual({ kind: 'empty' })
  })

  it('org temporary slots가 있으면 educationSlotId invent 없이 그대로 쓴다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        ...MATRIX,
        columns: [{ ...MATRIX.columns![0]!, classCount: 5 }],
        volunteers: [
          {
            participantId: 201,
            volunteerName: '김미배정',
            cells: [{ columnKey: '10:100', scheduleId: 10 }],
          },
        ],
      },
      regionKey: 'seoul',
      orgSlots: [
        {
          slotId: 901,
          scheduleId: 10,
          organizationApplicationId: 100,
          grade: '2',
          className: '1반',
          classLabel: '2-1',
        },
        {
          slotId: 902,
          scheduleId: 10,
          organizationApplicationId: 100,
          classLabel: '2-2',
        },
      ],
    })
    expect(table.columns[0]?.classSlots).toEqual([
      { id: '901', classLabel: '2-1', isEducationSlotId: false },
      { id: '902', classLabel: '2-2', isEducationSlotId: false },
    ])
  })

  it('needsReassignment·singleAssignment 셀 플래그를 매핑한다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        ...MATRIX,
        volunteers: [
          {
            participantId: 201,
            volunteerName: '김단독',
            cells: [
              {
                columnKey: '10:100',
                scheduleId: 10,
                educationSlotId: 501,
                classLabel: '3-1',
                singleAssignment: true,
                needsReassignment: true,
                attendanceManager: false,
              },
            ],
          },
        ],
      },
      regionKey: 'seoul',
    })
    expect(table.rows[0]?.cells[0]).toMatchObject({
      kind: 'assigned',
      classLabel: '3-1',
      isSolo: true,
      isInvalidAssignment: true,
      isAttendanceManager: false,
    })
  })

  it('출결 뱃지는 ASSIGNED 이고 attendanceManager true 인 셀만 켠다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        ...MATRIX,
        volunteers: [
          {
            participantId: 201,
            volunteerName: '김출결',
            cells: [
              {
                columnKey: '10:100',
                scheduleId: 10,
                educationSlotId: 501,
                classLabel: '3-1',
                assignmentStatus: 'ASSIGNED',
                attendanceManager: true,
              },
            ],
          },
          {
            participantId: 202,
            volunteerName: '이재배정',
            cells: [
              {
                columnKey: '10:100',
                scheduleId: 10,
                educationSlotId: 501,
                classLabel: '3-1',
                assignmentStatus: 'REASSIGNMENT_REQUIRED',
                needsReassignment: true,
                attendanceManager: true,
              },
            ],
          },
        ],
      },
      regionKey: 'seoul',
    })
    expect(table.rows[0]?.cells[0]).toMatchObject({
      kind: 'assigned',
      assignmentStatus: 'ASSIGNED',
      isAttendanceManager: true,
    })
    expect(table.rows[1]?.cells[0]).toMatchObject({
      kind: 'assigned',
      assignmentStatus: 'REASSIGNMENT_REQUIRED',
      isAttendanceManager: false,
    })
  })

  it('columnKey가 없어도 scheduleId·organizationApplicationId로 셀을 매칭한다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        ...MATRIX,
        volunteers: [
          {
            participantId: 201,
            volunteerName: '김봉사',
            cells: [
              {
                scheduleId: 10,
                organizationApplicationId: 100,
                educationSlotId: 501,
                classLabel: '3-1',
                unavailable: false,
              },
            ],
          },
        ],
      },
      regionKey: 'seoul',
    })
    expect(table.rows[0]?.cells[0]).toMatchObject({
      kind: 'assigned',
      classLabel: '3-1',
    })
  })

  it('ASSIGNED인데 cell.classLabel이 비면 org temporary slot으로 백필하지 않고 —만 둔다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        ...MATRIX,
        volunteers: [
          {
            participantId: 201,
            volunteerName: '김봉사',
            cells: [
              {
                columnKey: '10:100',
                scheduleId: 10,
                educationSlotId: 901,
                classLabel: null,
                unavailable: false,
                assignmentStatus: 'ASSIGNED',
              },
            ],
          },
        ],
      },
      regionKey: 'seoul',
      orgSlots: [
        {
          slotId: 901,
          scheduleId: 10,
          organizationApplicationId: 100,
          classLabel: '2-1',
        },
      ],
    })
    expect(table.rows[0]?.cells[0]).toMatchObject({
      kind: 'assigned',
      classLabel: '—',
    })
  })

  it('FIRST_HALF columns=[]이면 cells=[]이고 totalAssignedDays 응답(0)을 그대로 둔다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        programId: 186495,
        educationRegionCode: 'SEOUL',
        semesterType: 'FIRST_HALF',
        columns: [],
        volunteers: [
          {
            participantId: 1,
            volunteerName: '김민수',
            totalAssignedDays: 0,
            cells: [],
          },
          {
            participantId: 2,
            volunteerName: '이서연',
            totalAssignedDays: 0,
            cells: [],
          },
        ],
      },
      regionKey: 'seoul',
    })
    expect(table.columns).toEqual([])
    expect(table.rows.map(row => row.totalAssignedDays)).toEqual([0, 0])
    expect(table.rows.every(row => row.cells.length === 0)).toBe(true)
  })

  it('SECOND_HALF ASSIGNED classLabel(2학년 1반/2반)을 matrix 응답 그대로 유지한다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        programId: 186495,
        educationRegionCode: 'SEOUL',
        semesterType: 'SECOND_HALF',
        columns: [
          {
            columnKey: '187580:1',
            scheduleId: 187580,
            organizationApplicationId: 1,
            educationStartAt: '2026-09-04T09:00:00+09:00',
            organizationName: '제이초등학교',
            organizationRegion: '강서구',
          },
          {
            columnKey: '187581:1',
            scheduleId: 187581,
            organizationApplicationId: 1,
            educationStartAt: '2026-09-11T09:00:00+09:00',
            organizationName: '제이초등학교',
            organizationRegion: '강서구',
          },
        ],
        volunteers: [
          {
            participantId: 1,
            volunteerName: '김민수',
            totalAssignedDays: 1,
            cells: [
              {
                columnKey: '187580:1',
                scheduleId: 187580,
                classLabel: '2학년 1반',
                unavailable: false,
                assignmentStatus: 'ASSIGNED',
              },
              {
                columnKey: '187581:1',
                scheduleId: 187581,
                classLabel: null,
                unavailable: false,
                assignmentStatus: 'UNASSIGNED',
              },
            ],
          },
          {
            participantId: 2,
            volunteerName: '이서연',
            totalAssignedDays: 1,
            cells: [
              {
                columnKey: '187580:1',
                scheduleId: 187580,
                classLabel: null,
                unavailable: false,
                assignmentStatus: 'UNASSIGNED',
              },
              {
                columnKey: '187581:1',
                scheduleId: 187581,
                classLabel: '2학년 2반',
                unavailable: false,
                assignmentStatus: 'ASSIGNED',
              },
            ],
          },
        ],
      },
      regionKey: 'seoul',
    })
    expect(table.columns.map(column => column.scheduleId)).toEqual(['187580', '187581'])
    expect(table.rows[0]?.totalAssignedDays).toBe(1)
    expect(table.rows[0]?.cells[0]).toMatchObject({
      kind: 'assigned',
      classLabel: '2학년 1반',
    })
    expect(table.rows[1]?.totalAssignedDays).toBe(1)
    expect(table.rows[1]?.cells[1]).toMatchObject({
      kind: 'assigned',
      classLabel: '2학년 2반',
    })
  })

  it('UNASSIGNED는 빈 칸이고 REASSIGNMENT_REQUIRED는 무효 배정으로 표시한다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        ...MATRIX,
        volunteers: [
          {
            participantId: 201,
            volunteerName: '김미배정',
            cells: [
              {
                columnKey: '10:100',
                scheduleId: 10,
                unavailable: false,
                assignmentStatus: 'UNASSIGNED',
              },
            ],
          },
          {
            participantId: 202,
            volunteerName: '이재배정',
            cells: [
              {
                columnKey: '10:100',
                scheduleId: 10,
                classLabel: '2학년 1반',
                unavailable: false,
                assignmentStatus: 'REASSIGNMENT_REQUIRED',
              },
            ],
          },
        ],
      },
      regionKey: 'seoul',
    })
    expect(table.rows[0]?.cells[0]).toEqual({ kind: 'empty' })
    expect(table.rows[1]?.cells[0]).toMatchObject({
      kind: 'assigned',
      classLabel: '2학년 1반',
      isInvalidAssignment: true,
    })
  })

  it('volunteers[].totalAssignedDays는 응답 값을 그대로 쓰고 cells로 재계산하지 않는다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        programId: 1,
        educationRegionCode: 'SEOUL',
        semesterType: 'FIRST_HALF',
        columns: [],
        volunteers: [
          {
            participantId: 201,
            volunteerName: '김봉사',
            totalAssignedDays: 3,
            cells: [],
          },
        ],
      },
      regionKey: 'seoul',
    })
    expect(table.columns).toEqual([])
    expect(table.rows[0]?.totalAssignedDays).toBe(3)
    expect(table.rows[0]?.cells).toEqual([])
  })

  it('columns가 비면 교육일 없는 빈 표로 두고 봉사자만 있는 반쪽 표를 만들지 않는다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        programId: 1,
        educationRegionCode: 'SEOUL',
        semesterType: 'FIRST_HALF',
        columns: [],
        volunteers: [
          {
            participantId: 201,
            volunteerName: '김봉사',
            totalAssignedDays: 1,
            cells: [],
          },
        ],
      },
      regionKey: 'seoul',
    })
    expect(table.columns).toEqual([])
    expect(table.rows).toHaveLength(1)
    expect(table.rows[0]?.cells).toEqual([])
  })

  it('column.educationSlots가 있으면 org slots보다 우선하고 classCount로 invent하지 않는다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        ...MATRIX,
        columns: [
          {
            ...MATRIX.columns![0]!,
            classCount: 5,
            educationSlots: [
              { educationSlotId: 701, classLabel: '1-1' },
              { educationSlotId: 702, grade: '1', className: '2반' },
            ],
          },
        ],
      },
      regionKey: 'seoul',
      orgSlots: [
        {
          slotId: 901,
          scheduleId: 10,
          organizationApplicationId: 100,
          classLabel: 'org-무시',
        },
      ],
    })
    expect(table.columns[0]?.classSlots).toEqual([
      { id: '701', classLabel: '1-1' },
      { id: '702', classLabel: '1학년 2반' },
    ])
    expect(matrixColumnsIncludeEducationSlots(MATRIX)).toBe(false)
    expect(matrixColumnsIncludeEducationSlots({ columns: [{ educationSlots: [] }] })).toBe(true)
    expect(matrixColumnsIncludeEducationSlots({ columns: [] })).toBe(true)
  })

  it('educationSlots=[]이면 org/cell로 학급을 invent하지 않는다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        ...MATRIX,
        columns: [
          {
            ...MATRIX.columns![0]!,
            classCount: 2,
            educationSlots: [],
          },
        ],
      },
      regionKey: 'seoul',
      orgSlots: [
        {
          slotId: 901,
          scheduleId: 10,
          organizationApplicationId: 100,
          classLabel: 'org-무시',
        },
      ],
    })
    expect(table.columns[0]?.classSlots).toEqual([])
  })

  it('educationStartAt UTC instant는 Seoul 달력일로 헤더를 만든다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        ...MATRIX,
        columns: [
          {
            ...MATRIX.columns![0]!,
            educationStartAt: '2026-10-31T15:00:00Z',
          },
        ],
      },
      regionKey: 'seoul',
    })
    expect(table.columns[0]?.isoDate).toBe('2026-11-01')
    expect(table.columns[0]?.dateLabel).toBe('11월 1일')
    expect(table.columns[0]?.educationStartAt).toBe('2026-10-31T15:00:00Z')
  })

  it('replacementParticipantId만 있어도 unavailability GET 대상을 건너뛴다', () => {
    expect(
      collectUnavailableScheduleIds({
        ...MATRIX,
        volunteers: [
          {
            participantId: 202,
            volunteerName: '이불가',
            cells: [
              {
                columnKey: '10:100',
                scheduleId: 10,
                unavailable: true,
                replacementParticipantId: 201,
                replacementVolunteerName: null,
              },
            ],
          },
        ],
      }),
    ).toEqual([])
  })

  it('unavailable이고 replacement가 둘 다 null이면 분홍만 두고 이름을 invent하지 않는다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        ...MATRIX,
        volunteers: [
          {
            participantId: 202,
            volunteerName: '이불가',
            cells: [
              {
                columnKey: '10:100',
                scheduleId: 10,
                unavailable: true,
                replacementParticipantId: 201,
                replacementVolunteerName: null,
              },
            ],
          },
        ],
      },
      regionKey: 'seoul',
    })
    expect(table.rows[0]?.cells[0]).toEqual({
      kind: 'empty',
      blockedEmpty: true,
    })
  })

  it('cell.replacementVolunteerName이 있으면 unavailability GET 없이 대체자를 붙인다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        ...MATRIX,
        volunteers: [
          {
            participantId: 202,
            volunteerName: '이불가',
            cells: [
              {
                columnKey: '10:100',
                scheduleId: 10,
                unavailable: true,
                replacementVolunteerName: '대체김',
              },
            ],
          },
        ],
      },
      regionKey: 'seoul',
    })
    expect(table.rows[0]?.cells[0]).toEqual({
      kind: 'empty',
      blockedEmpty: true,
      substituteName: '대체김',
    })
    expect(table.rows[0]?.name).toBe('이불가')
  })

  it('volunteerName이 비면 행 이름을 -로 둔다', () => {
    const table = mapAllocationMatrixToRegionTableData({
      matrix: {
        ...MATRIX,
        volunteers: [{ participantId: 201, volunteerName: '', cells: [] }],
      },
      regionKey: 'seoul',
    })
    expect(table.rows[0]?.name).toBe('-')
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
