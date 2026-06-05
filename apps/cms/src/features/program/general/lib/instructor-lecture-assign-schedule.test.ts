import { describe, expect, it } from 'vitest'
import {
  getSchoolIdForDateFromAssignments,
  isLectureAssignSlotDisabled,
  toLectureAssignItem,
  type InstructorLectureAssignItem,
  type InstructorLectureAssignSlot,
} from './instructor-lecture-assign-schedule'

const gangseoSlot: InstructorLectureAssignSlot = {
  key: '2026-03-19|assign-school-gangseo|1',
  dateKey: '2026-03-19',
  schoolId: 'assign-school-gangseo',
  schoolName: '강서초등학교',
  region: '서울특별시',
  sessionRound: 1,
  sessionLabel: '1차시',
  timeRange: '9:20 ~ 12:00',
  assignedCount: 0,
}

const otherSchoolSlot: InstructorLectureAssignSlot = {
  key: '2026-03-19|assign-school-1|1',
  dateKey: '2026-03-19',
  schoolId: 'assign-school-1',
  schoolName: '학교명 1',
  region: '서울특별시',
  sessionRound: 1,
  sessionLabel: '1차시',
  timeRange: '9:20 ~ 12:00',
  assignedCount: 0,
}

const gangseoSecondSession: InstructorLectureAssignSlot = {
  ...gangseoSlot,
  key: '2026-03-19|assign-school-gangseo|2',
  sessionRound: 2,
  sessionLabel: '2차시',
  timeRange: '13:00 ~ 15:00',
}

describe('instructor-lecture-assign-schedule', () => {
  it('같은 날 다른 기관 슬롯은 비활성화한다', () => {
    const assigned: InstructorLectureAssignItem[] = [toLectureAssignItem(gangseoSlot)]
    expect(getSchoolIdForDateFromAssignments(assigned, '2026-03-19')).toBe('assign-school-gangseo')
    expect(isLectureAssignSlotDisabled(otherSchoolSlot, assigned)).toBe(true)
  })

  it('같은 날 동일 기관의 다른 차시는 활성 상태를 유지한다', () => {
    const assigned: InstructorLectureAssignItem[] = [toLectureAssignItem(gangseoSlot)]
    expect(isLectureAssignSlotDisabled(gangseoSecondSession, assigned)).toBe(false)
  })

  it('배정 항목 삭제 시 해당 날짜 기관 잠금이 해제된다', () => {
    const assigned: InstructorLectureAssignItem[] = [toLectureAssignItem(gangseoSlot)]
    const cleared: InstructorLectureAssignItem[] = []
    expect(isLectureAssignSlotDisabled(otherSchoolSlot, assigned)).toBe(true)
    expect(isLectureAssignSlotDisabled(otherSchoolSlot, cleared)).toBe(false)
  })
})
