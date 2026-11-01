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
    })
    expect(assigned?.scheduleLabel).toContain('2026.05.08')

    expect(view.bundle.rows[1]).toMatchObject({
      id: 'col-2',
      scheduleId: 11,
      classDisplay: { kind: 'dash' },
      partner: { kind: 'dash' },
      attendance: { kind: 'dash' },
      educationProgress: 'dash',
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
})
