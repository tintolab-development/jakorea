import { describe, expect, it } from 'vitest'
import type { InstructorAssignmentAvailabilityItem } from '@/features/program/general/api/instructor-assignment-types'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'
import {
  INSTRUCTOR_ASSIGNMENT_AVAILABILITY_REASONS,
  INSTRUCTOR_ASSIGNMENT_AVAILABILITY_STATUSES,
  buildWaitingScheduleRowsFromAvailability,
  buildWaitingSchoolRowsFromAvailability,
  formatAvailabilityAssignedCountLabel,
  mapAvailabilityStatusToWaiting,
} from './instructor-assignment-availability'

function item(
  overrides: Partial<InstructorAssignmentAvailabilityItem> &
    Pick<InstructorAssignmentAvailabilityItem, 'scheduleId' | 'status'>
): InstructorAssignmentAvailabilityItem {
  return {
    organizationApplicationId: 1691529,
    startAt: '2026-11-12T01:00:00Z',
    endAt: '2026-11-12T03:00:00Z',
    reasons: [],
    assignedInstructorCount: 0,
    maxAssignableInstructors: 2,
    conflicts: [],
    ...overrides,
  }
}

function school(orgAppId: string, scheduleId: number): ParticipatingSchoolRow {
  const session: ParticipatingSchoolSession = {
    round: 1,
    date: '2026-11-12',
    dayOfWeek: '목',
    duration: '60분',
    format: '공통 교육 예정',
    classNum: '1교시',
    timeRange: '10:00 ~ 12:00',
    status: 'pending',
    resolvedScheduleId: scheduleId,
    scheduleUnresolved: false,
  }
  return {
    id: `school-${orgAppId}`,
    no: 1,
    schoolName: `기관 ${orgAppId}`,
    region: '서울',
    educationGrade: '초등',
    classCount: 0,
    studentCount: 0,
    lectureRound: '',
    textbookStatus: 'not_applicable',
    approvalStatus: 'approved',
    teacherName: '-',
    instructors: '',
    organizationApplicationId: orgAppId,
    sessions: [session],
  }
}

const instructor = { id: 'p-190102', memberId: '190102' } as ParticipatingInstructorRow

describe('availability OpenAPI literals', () => {
  it('status/reason enum 철자가 OpenAPI와 같다', () => {
    expect([...INSTRUCTOR_ASSIGNMENT_AVAILABILITY_STATUSES]).toEqual([
      'AVAILABLE',
      'UNAVAILABLE',
      'ASSIGNED',
      'ASSIGNMENT_CANCELLED',
    ])
    expect([...INSTRUCTOR_ASSIGNMENT_AVAILABILITY_REASONS]).toEqual([
      'CAPACITY_FULL',
      'TIME_CONFLICT_OTHER_PROGRAM',
      'TIME_CONFLICT_OTHER_ORGANIZATION',
      'SAME_ORGANIZATION_OTHER_SCHEDULE_ASSIGNED',
    ])
  })
})

describe('mapAvailabilityStatusToWaiting', () => {
  it('ASSIGNED는 대기 목록에서 제외한다', () => {
    expect(mapAvailabilityStatusToWaiting({ status: 'ASSIGNED', reasons: [] })).toBeNull()
  })

  it('AVAILABLE은 배정 대기', () => {
    expect(mapAvailabilityStatusToWaiting({ status: 'AVAILABLE', reasons: [] })).toEqual({
      assignmentStatus: 'waiting',
      assignmentStatusLabel: '배정 대기',
    })
  })

  it('ASSIGNMENT_CANCELLED는 배정 취소', () => {
    expect(
      mapAvailabilityStatusToWaiting({ status: 'ASSIGNMENT_CANCELLED', reasons: [] })
    ).toEqual({
      assignmentStatus: 'assignment_cancelled',
      assignmentStatusLabel: '배정 취소',
    })
  })

  it('UNAVAILABLE은 reasons[0]만 라벨로 쓴다', () => {
    expect(
      mapAvailabilityStatusToWaiting({
        status: 'UNAVAILABLE',
        reasons: ['TIME_CONFLICT_OTHER_PROGRAM', 'CAPACITY_FULL'],
      })
    ).toEqual({
      assignmentStatus: 'unavailable',
      assignmentStatusLabel: '배정 불가(다른 프로그램 시간 겹침)',
    })
  })
})

describe('buildWaitingSchoolRowsFromAvailability', () => {
  it('items 순서를 유지하고 ASSIGNED만 건너뛴다', () => {
    const rows = buildWaitingSchoolRowsFromAvailability({
      items: [
        item({
          organizationApplicationId: 1691529,
          scheduleId: 187447,
          status: 'AVAILABLE',
        }),
        item({
          organizationApplicationId: 1691529,
          scheduleId: 187448,
          status: 'UNAVAILABLE',
          reasons: ['CAPACITY_FULL'],
          assignedInstructorCount: 2,
          maxAssignableInstructors: 2,
        }),
        item({
          organizationApplicationId: 1691530,
          scheduleId: 187450,
          status: 'ASSIGNED',
        }),
        item({
          organizationApplicationId: 1691532,
          scheduleId: 187452,
          status: 'ASSIGNMENT_CANCELLED',
          endAt: null,
        }),
      ],
      instructor,
      schoolRows: [school('1691529', 187447), school('1691532', 187452)],
      scheduleLabelById: new Map(),
      instructorMemberId: '190102',
    })

    expect(rows.map(row => row.resolvedScheduleId)).toEqual([187447, 187448, 187452])
    expect(rows.map(row => row.assignmentStatus)).toEqual([
      'waiting',
      'unavailable',
      'assignment_cancelled',
    ])
    expect(rows[1]?.assignmentStatusLabel).toBe('배정 불가(정원)')
    expect(rows[1]?.assignedInstructorCountLabel).toBe('2/2명')
  })
})

describe('buildWaitingScheduleRowsFromAvailability', () => {
  it('개인형은 organizationApplicationId 없이 scheduleId만 쓴다', () => {
    const rows = buildWaitingScheduleRowsFromAvailability({
      items: [
        item({
          organizationApplicationId: null,
          scheduleId: 187460,
          status: 'AVAILABLE',
          assignedInstructorCount: 0,
          maxAssignableInstructors: null,
        }),
        item({
          organizationApplicationId: null,
          scheduleId: 187461,
          status: 'UNAVAILABLE',
          reasons: ['TIME_CONFLICT_OTHER_ORGANIZATION'],
        }),
      ],
      instructor,
      scheduleLabelById: new Map(),
      lectureLocationByScheduleId: new Map([['187460', '서울시 강남구']]),
      instructorMemberId: '190102',
    })

    expect(rows).toHaveLength(2)
    expect(rows[0]?.organizationApplicationId).toBeUndefined()
    expect(rows[0]?.lectureLocation).toBe('서울시 강남구')
    expect(rows[0]?.assignedInstructorCountLabel).toBe('0명')
    expect(rows[1]?.assignmentStatusLabel).toBe('배정 불가(다른 기관 시간 겹침)')
  })
})

describe('formatAvailabilityAssignedCountLabel', () => {
  it('서버 null은 임의 분모를 만들지 않는다', () => {
    expect(formatAvailabilityAssignedCountLabel(null, 4)).toBe('-')
    expect(formatAvailabilityAssignedCountLabel(1, null)).toBe('1명')
    expect(formatAvailabilityAssignedCountLabel(1, 4)).toBe('1/4명')
  })
})
