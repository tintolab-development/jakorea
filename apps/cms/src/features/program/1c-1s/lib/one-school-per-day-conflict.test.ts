import { describe, expect, it } from 'vitest'
import {
  buildOccupiedLectureDatesByInstructorKeys,
  buildScheduleLectureDateById,
  extractLectureDateKey,
  isOneSchoolPerDayConflictErrorCode,
  ONE_COMPANY_ONE_SCHOOL_INSTRUCTOR_DAY_CONFLICT,
  resolveOneSchoolPerDayAssignmentStatus,
} from './one-school-per-day-conflict'

describe('one-school-per-day-conflict', () => {
  it('extractLectureDateKey는 ISO·점표기·표시 문자열을 YYYY-MM-DD로 정규화한다', () => {
    expect(extractLectureDateKey('2026-09-12T09:00:00')).toBe('2026-09-12')
    expect(extractLectureDateKey('2026. 09. 12')).toBe('2026-09-12')
    expect(extractLectureDateKey('2026.09.12(금)')).toBe('2026-09-12')
    expect(extractLectureDateKey('2026-09-12(금) 09:00 ~ 11:00')).toBe('2026-09-12')
    expect(extractLectureDateKey(undefined)).toBeNull()
  })

  it('ONE-02: 강사 D가 D기관 충돌일에 배정되면 C 희망일과 충돌한다', () => {
    const scheduleDateById = buildScheduleLectureDateById([
      { scheduleId: 9001, startAt: '2026-09-12T09:00:00' },
      { scheduleId: 9002, startAt: '2026-09-20T09:00:00' },
    ])
    const occupied = buildOccupiedLectureDatesByInstructorKeys(
      [
        {
          assignmentId: 1,
          participantId: 170034,
          instructorMemberId: 170024,
          scheduleId: 9001,
          organizationApplicationId: 170014,
          assignmentStatus: 'ASSIGNED',
        },
      ],
      scheduleDateById
    )

    expect(occupied.get('170024')?.has('2026-09-12')).toBe(true)
    expect(occupied.get('170034')?.has('2026-09-12')).toBe(true)
    expect(
      resolveOneSchoolPerDayAssignmentStatus('2026. 09. 12(금)', occupied.get('170024'))
    ).toBe('unavailable')
    expect(
      resolveOneSchoolPerDayAssignmentStatus('2026-09-20', occupied.get('170024'))
    ).toBe('waiting')
  })

  it('취소 배정은 점유에서 제외한다', () => {
    const scheduleDateById = buildScheduleLectureDateById([
      { scheduleId: 1, startAt: '2026-09-12' },
    ])
    const occupied = buildOccupiedLectureDatesByInstructorKeys(
      [
        {
          instructorMemberId: 170024,
          scheduleId: 1,
          assignmentStatus: 'CANCELLED',
        },
      ],
      scheduleDateById
    )
    expect(occupied.size).toBe(0)
  })

  it('충돌 error code를 인식한다', () => {
    expect(isOneSchoolPerDayConflictErrorCode(ONE_COMPANY_ONE_SCHOOL_INSTRUCTOR_DAY_CONFLICT)).toBe(
      true
    )
    expect(isOneSchoolPerDayConflictErrorCode('OTHER')).toBe(false)
  })
})
