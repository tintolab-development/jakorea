import { describe, expect, it } from 'vitest'
import type {
  UjatAllocationMatrixResponse,
  UjatAssignmentSubmissionsResponse,
  UjatAttendanceItemDto,
  UjatPartnerAssignmentResponse,
} from '@/features/program/ujat/api/education-execution-api'
import type { ProgramAbsenceReasonItem } from '@/features/program/general/api/absence-reasons'
import { buildVolunteerAssignmentProgressView } from './assignment-progress-adapter'

const matrix: UjatAllocationMatrixResponse = {
  columns: [
    {
      columnKey: 'col-1',
      scheduleId: 10,
      educationStartAt: '2026-05-08',
      organizationApplicationId: 3,
      organizationName: '한빛초등학교',
    },
    {
      columnKey: 'col-2',
      scheduleId: 11,
      educationStartAt: '2026-05-15',
      organizationApplicationId: 4,
      organizationName: '별빛초등학교',
    },
  ],
  volunteers: [
    {
      participantId: 7,
      memberId: 70,
      volunteerName: '이봉사',
      totalAssignedDays: 2,
      giveUp: false,
      cells: [
        {
          columnKey: 'col-1',
          scheduleId: 10,
          educationSlotId: 501,
          classLabel: '3-1',
          attendanceManager: true,
          assignmentGroupId: 'grp-1',
          organizationApplicationId: 3,
          assignmentStatus: 'ASSIGNED',
        },
        { columnKey: 'col-2', scheduleId: 11 },
      ],
    },
    {
      participantId: 8,
      memberId: 80,
      volunteerName: '김파트너',
      totalAssignedDays: 1,
      cells: [
        {
          columnKey: 'col-1',
          scheduleId: 10,
          educationSlotId: 501,
          classLabel: '3-1',
          assignmentStatus: 'ASSIGNED',
        },
      ],
    },
    {
      participantId: 9,
      memberId: 90,
      volunteerName: '박많이',
      totalAssignedDays: 4,
      cells: [],
    },
  ],
}

const submissions: UjatAssignmentSubmissionsResponse = {
  sessions: [
    {
      scheduleId: 10,
      educationDate: '2026-05-08',
      volunteers: [
        {
          participantId: 7,
          institutionName: '한빛초등학교',
          assignedClass: '3-1',
          plan: { status: 'SUBMITTED', formResponseId: 15 },
          log: { status: 'NOT_SUBMITTED' },
        },
      ],
    },
  ],
}

const partnerAssignments: Record<string, UjatPartnerAssignmentResponse[]> = {
  '10': [
    {
      assignmentGroupId: 'old',
      scheduleId: 10,
      status: 'CANCELLED',
      primaryParticipantId: 7,
      secondaryParticipantId: 9,
      cancelledAt: '2026-05-01T00:00:00Z',
    },
    {
      assignmentGroupId: 'grp-1',
      scheduleId: 10,
      status: 'ASSIGNED',
      primaryParticipantId: 7,
      secondaryParticipantId: 8,
      educationSlotId: 501,
      classLabel: '3-1',
      organizationApplicationId: 3,
      attendanceManagerParticipantId: 7,
      assignedAt: '2026-05-02T00:00:00Z',
      assignmentNotificationSent: false,
    },
  ],
}

const attendances: Record<string, UjatAttendanceItemDto[]> = {
  '10': [{ participantId: 7, scheduleId: 10, status: 'LATE', arrivalTime: '09:10:00' }],
}

const absenceReasons: ProgramAbsenceReasonItem[] = [
  {
    submissionId: 5,
    participantId: 7,
    scheduleId: 10,
    scheduleStartAt: '2026-05-08',
    reason: '병원 진료',
    fileObjectIds: [99],
    originalFileNames: ['note.pdf'],
  },
  {
    submissionId: 6,
    participantId: 9,
    scheduleId: 10,
    reason: '다른 봉사자',
  },
]

describe('buildVolunteerAssignmentProgressView', () => {
  it('배정·파트너·출결·과제·불참 사유를 봉사자 행으로 매핑한다', () => {
    const view = buildVolunteerAssignmentProgressView({
      participantId: 7,
      memberId: '70',
      matrix,
      submissions,
      partnerAssignmentsByScheduleId: partnerAssignments,
      attendancesByScheduleId: attendances,
      absenceReasons,
    })

    expect(view.bundle.rows).toHaveLength(2)
    const assigned = view.bundle.rows[0]
    expect(assigned).toMatchObject({
      id: 'col-1',
      scheduleId: 10,
      participantId: 7,
      role: 'attendance_manager',
      assignedInstitution: { kind: 'name', value: '한빛초등학교' },
      partner: { kind: 'name', value: '김파트너' },
      classDisplay: { kind: 'class', label: '3-1' },
      attendance: { kind: 'late', time: '9:10' },
      educationPlanSubmitted: true,
      educationPlanFormResponseId: 15,
      educationLogSubmitted: false,
      educationProgress: 'completed',
      educationSlotId: 501,
      assignmentGroupId: 'grp-1',
      organizationApplicationId: 3,
      selfIsSecondary: false,
      isWithdrawn: false,
      assignmentNotificationSent: false,
      canAssignAttendanceManager: true,
    })
    expect(assigned?.scheduleLabel).toContain('2026.05.08')

    expect(view.bundle.rows[1]).toMatchObject({
      id: 'col-2',
      scheduleId: 11,
      classDisplay: { kind: 'dash' },
      partner: { kind: 'dash' },
      attendance: { kind: 'dash' },
      educationProgress: 'dash',
      canAssignAttendanceManager: false,
    })

    expect(view.bundle.attendanceSummary).toEqual({
      completionStatus: '수료 완료',
      lateCountLabel: '1회',
    })
    expect(view.bundle.absenceReasons).toEqual([
      expect.objectContaining({
        id: '5',
        dateLabel: '5월 8일(금)',
        reason: '병원 진료',
        fileName: 'note.pdf',
        fileObjectIds: [99],
      }),
    ])
    // 501은 이미 2인 배정이라 교육 배정(미배정 학급) 옵션에서 제외
    expect(view.assignOptionsByRowId['col-1']?.classOptions).toEqual([])
    expect(view.assignOptionsByRowId['col-1']?.partnerOptions.map(option => option.value)).toEqual([
      '8',
      '9',
    ])
  })

  it.each([
    ['SUBMITTED', 15, true],
    ['APPROVED', 16, true],
    ['DEADLINE_MISSED', 17, true],
    ['FEEDBACK_REQUESTED', 18, true],
    ['REVISED', 19, true],
    ['NOT_SUBMITTED', null, false],
    ['  ', null, false],
    ['UNKNOWN', 20, false],
    [null, null, false],
  ] as const)('문서 status %s formResponseId %s 제출 %s', (status, responseId, submitted) => {
    const view = buildVolunteerAssignmentProgressView({
      participantId: 7,
      matrix,
      submissions: {
        sessions: [
          {
            scheduleId: 10,
            volunteers: [
              {
                participantId: 7,
                plan: { status, formResponseId: responseId },
                log: { status, formResponseId: responseId },
              },
            ],
          },
        ],
      },
      partnerAssignmentsByScheduleId: {},
      attendancesByScheduleId: {},
      absenceReasons: [],
    })
    const row = view.bundle.rows.find(item => item.scheduleId === 10)
    expect(row?.educationPlanSubmitted).toBe(submitted)
    expect(row?.educationLogSubmitted).toBe(submitted)
    expect(row?.educationPlanFormResponseId).toBe(responseId ?? undefined)
    expect(row?.educationLogFormResponseId).toBe(responseId ?? undefined)
    expect(row?.educationProgress).toBe(submitted ? 'completed' : 'scheduled')
  })

  it('org temporary slots 중 미배정 학급만 교육 배정 옵션으로 둔다', () => {
    const view = buildVolunteerAssignmentProgressView({
      participantId: 7,
      memberId: '70',
      matrix,
      submissions,
      partnerAssignmentsByScheduleId: partnerAssignments,
      attendancesByScheduleId: attendances,
      absenceReasons: [],
      orgSlots: [
        {
          slotId: 501,
          scheduleId: 10,
          organizationApplicationId: 3,
          classLabel: '3-1',
        },
        {
          slotId: 502,
          scheduleId: 10,
          organizationApplicationId: 3,
          classLabel: '3-2',
        },
        {
          slotId: 601,
          scheduleId: 11,
          organizationApplicationId: 4,
          classLabel: '4-1',
        },
      ],
    })

    expect(view.assignOptionsByRowId['col-1']?.classOptions).toEqual([
      { value: '502', label: '3-2' },
    ])
    expect(view.assignOptionsByRowId['col-2']?.classOptions).toEqual([
      { value: '601', label: '4-1' },
    ])
  })

  it('활동 포기 봉사자는 학급·출결을 활동 포기로 두고 수료 불가를 표시한다', () => {
    const view = buildVolunteerAssignmentProgressView({
      participantId: 7,
      memberId: '70',
      matrix: {
        ...matrix,
        volunteers: matrix.volunteers?.map(volunteer =>
          volunteer.participantId === 7 ? { ...volunteer, giveUp: true } : volunteer
        ),
      },
      submissions,
      partnerAssignmentsByScheduleId: partnerAssignments,
      attendancesByScheduleId: attendances,
      absenceReasons: [],
    })

    expect(view.bundle.rows.every(row => row.classDisplay.kind === 'withdrawn')).toBe(true)
    expect(view.bundle.rows.every(row => row.attendance.kind === 'withdrawn')).toBe(true)
    expect(view.bundle.attendanceSummary.completionStatus).toBe('수료 불가(활동 포기)')
  })

  it('ASSIGNED인데 matrix classLabel이 비면 partner-assignment로 백필하지 않고 —만 둔다', () => {
    const view = buildVolunteerAssignmentProgressView({
      participantId: 7,
      memberId: '70',
      matrix: {
        ...matrix,
        volunteers: [
          {
            participantId: 7,
            memberId: 70,
            volunteerName: '이봉사',
            totalAssignedDays: 1,
            cells: [
              {
                columnKey: 'col-1',
                scheduleId: 10,
                educationSlotId: 501,
                classLabel: null,
                assignmentStatus: 'ASSIGNED',
                organizationApplicationId: 3,
              },
            ],
          },
        ],
      },
      submissions: { sessions: [] },
      partnerAssignmentsByScheduleId: {
        '10': [
          {
            assignmentGroupId: 'grp-1',
            scheduleId: 10,
            status: 'ASSIGNED',
            primaryParticipantId: 7,
            secondaryParticipantId: 8,
            educationSlotId: 501,
            classLabel: '2학년 9반',
            organizationApplicationId: 3,
          },
        ],
      },
      attendancesByScheduleId: {},
      absenceReasons: [],
    })

    expect(view.bundle.rows[0]?.classDisplay).toEqual({ kind: 'class', label: '—' })
    expect(view.bundle.rows[0]?.canAssignAttendanceManager).toBe(true)
  })

  it('allocation-matrix에 없는 일정은 submissions로 행을 만들지 않는다', () => {
    const view = buildVolunteerAssignmentProgressView({
      participantId: 7,
      memberId: '70',
      matrix,
      submissions: {
        sessions: [
          ...(submissions.sessions ?? []),
          {
            scheduleId: 99,
            educationDate: '2026-06-01',
            volunteers: [
              {
                participantId: 7,
                institutionName: '문서만있는학교',
                assignedClass: '1-1',
              },
            ],
          },
        ],
      },
      partnerAssignmentsByScheduleId: partnerAssignments,
      attendancesByScheduleId: attendances,
      absenceReasons: [],
    })

    expect(view.bundle.rows.map(row => row.scheduleId)).toEqual([10, 11])
  })

  it('프로그램 등록만 된 미배정 봉사자는 출결 담당 지정을 막는다', () => {
    const view = buildVolunteerAssignmentProgressView({
      participantId: 1695064,
      memberId: '190070',
      matrix: {
        columns: [
          {
            columnKey: '187580:1',
            scheduleId: 187580,
            educationStartAt: '2026-11-01',
            organizationName: '테스트초',
          },
        ],
        volunteers: [
          {
            participantId: 1695064,
            memberId: 190070,
            volunteerName: '여지은',
            cells: [
              {
                columnKey: '187580:1',
                scheduleId: 187580,
                assignmentStatus: 'UNASSIGNED',
              },
            ],
          },
        ],
      },
      submissions: { sessions: [] },
      partnerAssignmentsByScheduleId: {},
      attendancesByScheduleId: {},
      absenceReasons: [],
    })

    expect(view.bundle.rows[0]).toMatchObject({
      participantId: 1695064,
      canAssignAttendanceManager: false,
      classDisplay: { kind: 'dash' },
    })
  })
})
