import { describe, expect, it } from 'vitest'
import { buildParticipatingInstructorWaitingSchoolRowsFromBoard } from './build-participating-instructor-assignment-rows'
import type { InstructorAssignmentListItemEnriched } from '@/features/program/general/api/instructor-assignment-types'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'

function session(
  scheduleId: number | null,
  date: string,
  overrides: Partial<ParticipatingSchoolSession> = {}
): ParticipatingSchoolSession {
  return {
    round: 1,
    date,
    dayOfWeek: '화',
    duration: '60분',
    format: '공통 교육 예정',
    classNum: '1교시',
    timeRange: '18:57 ~ 19:57',
    status: 'pending',
    resolvedScheduleId: scheduleId,
    scheduleUnresolved: scheduleId == null,
    ...overrides,
  }
}

function school(
  id: string,
  orgAppId: string,
  name: string,
  sessions: ParticipatingSchoolSession[],
  overrides: Partial<ParticipatingSchoolRow> = {}
): ParticipatingSchoolRow {
  return {
    id,
    no: 1,
    schoolName: name,
    region: '-',
    educationGrade: '-',
    classCount: 0,
    studentCount: 0,
    lectureRound: '',
    textbookStatus: 'not_applicable',
    approvalStatus: 'approved',
    teacherName: '-',
    instructors: '',
    organizationApplicationId: orgAppId,
    sessions,
    ...overrides,
  }
}

function assignment(
  assignmentId: number,
  instructorMemberId: number,
  organizationApplicationId: number,
  scheduleId: number,
  assignmentStatus = 'ASSIGNED'
): InstructorAssignmentListItemEnriched {
  return {
    assignmentId,
    programId: 186416,
    scheduleId,
    organizationApplicationId,
    instructorMemberId,
    assignmentStatus,
  } as InstructorAssignmentListItemEnriched
}

function instructor(memberId: string): ParticipatingInstructorRow {
  return { id: `p-${memberId}`, memberId } as ParticipatingInstructorRow
}

/** program 186416 실제 응답 기준 */
const schoolRows = [
  school('1695006', '1691530', '광주누리초등학교', [session(187446, '2026.11.03')], {
    preferredEducationSchedules: [
      { scheduleId: 184988, round: 1, startAt: '2026-11-03T09:57:00Z', endAt: '2026-11-03T10:57:00Z', label: null },
    ],
  }),
  school('1695004', '1691529', 'QA 제휴학교', [session(187447, '2026.11.05')]),
  school('1694993', '1691527', 'QA 제휴학교', [session(187429, '2026.11.11')]),
]

const assignments = [
  assignment(1694872, 190076, 1691530, 187446),
  assignment(1694871, 190076, 1691527, 187429),
  assignment(1694870, 190076, 1691529, 187447),
  assignment(1694868, 190102, 1691527, 187429),
]

function build(input: {
  memberId: string
  schoolRows?: ParticipatingSchoolRow[]
  assignments?: InstructorAssignmentListItemEnriched[]
  isCompanySchool?: boolean
}) {
  return buildParticipatingInstructorWaitingSchoolRowsFromBoard({
    instructor: instructor(input.memberId),
    schoolRows: input.schoolRows ?? schoolRows,
    instructorList: [],
    assignedSchoolIds: new Set(),
    isCompanySchool: input.isCompanySchool ?? false,
    assignments: input.assignments ?? assignments,
    instructorMemberId: input.memberId,
  })
}

describe('buildParticipatingInstructorWaitingSchoolRowsFromBoard', () => {
  it('program 186416: waiting list is empty for both 공하은 and 최지원', () => {
    expect(build({ memberId: '190076' })).toEqual([])
    expect(build({ memberId: '190102' })).toEqual([])
    expect(build({ memberId: '190102', isCompanySchool: true })).toEqual([])
  })

  it('excludes schedules assigned to another instructor', () => {
    const rows = build({ memberId: '190102', assignments: [assignment(1, 190076, 1691529, 187447)] })
    expect(rows.map(r => r.schoolId).sort()).toEqual(['1694993', '1695006'])
  })

  it('keeps only the unassigned schedule of a school', () => {
    const rows = build({
      memberId: '190102',
      schoolRows: [
        school('1695004', '1691529', 'QA 제휴학교', [
          session(187447, '2026.11.05'),
          session(187448, '2026.11.06', { round: 2, dayOfWeek: '금' }),
        ]),
      ],
      assignments: [assignment(1, 190076, 1691529, 187447)],
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.sessions?.map(s => s.resolvedScheduleId)).toEqual([187448])
    expect(rows[0]?.assignmentStatus).toBe('waiting')
  })

  it('1사1교: drops assigned date groups only', () => {
    const rows = build({
      memberId: '190102',
      isCompanySchool: true,
      schoolRows: [
        school('1695004', '1691529', 'QA 제휴학교', [
          session(187447, '2026.11.05'),
          session(187448, '2026.11.06', { round: 2, dayOfWeek: '금' }),
        ]),
      ],
      assignments: [assignment(1, 190076, 1691529, 187447)],
    })
    expect(rows.map(r => r.resolvedScheduleId)).toEqual([187448])
  })

  it('cancelled assignment does not exclude the schedule', () => {
    const rows = build({
      memberId: '190102',
      schoolRows: [schoolRows[1]!],
      assignments: [assignment(1, 190076, 1691529, 187447, 'CANCELLED')],
    })
    expect(rows.map(r => r.schoolId)).toEqual(['1695004'])
  })

  it('uses confirmed sessions, not preferred schedules', () => {
    const rows = build({ memberId: '190102', schoolRows: [schoolRows[0]!], assignments: [] })
    expect(rows[0]?.sessions?.map(s => s.resolvedScheduleId)).toEqual([187446])
  })

  it('excludes schools whose schedule is unresolved', () => {
    const rows = build({
      memberId: '190102',
      schoolRows: [school('x', '9', '미확정학교', [session(null, '2026.11.07')])],
      assignments: [],
    })
    expect(rows).toEqual([])
  })
})
