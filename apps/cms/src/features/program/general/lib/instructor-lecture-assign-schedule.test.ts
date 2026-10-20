import { describe, expect, it } from 'vitest'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import {
  formatLectureAssignTagLabel,
  getSchoolIdForDateFromAssignments,
  isLectureAssignSlotDisabled,
  parseInstructorLectureAssignScheduleFromInstitutions,
  toLectureAssignItem,
  type InstructorLectureAssignItem,
  type InstructorLectureAssignSlot,
} from './instructor-lecture-assign-schedule'
import dayjs from 'dayjs'

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
  it('배정 칩은 학교명을 약식 없이 그대로 표기한다', () => {
    expect(formatLectureAssignTagLabel(dayjs('2026-11-03'), '부명초등학교')).toBe(
      '2026. 11. 03(화) 부명초등학교'
    )
    expect(toLectureAssignItem(gangseoSlot).tagLabel).toBe('2026. 03. 19(목) 강서초등학교')
  })

  it('같은 날 다른 기관 슬롯은 비활성화한다', () => {
    const assigned: InstructorLectureAssignItem[] = [toLectureAssignItem(gangseoSlot)]
    expect(getSchoolIdForDateFromAssignments(assigned, '2026-03-19')).toBe('assign-school-gangseo')
    expect(isLectureAssignSlotDisabled(otherSchoolSlot, assigned)).toBe(true)
  })

  it('같은 날 동일 기관의 다른 차시는 활성 상태를 유지한다', () => {
    const assigned: InstructorLectureAssignItem[] = [toLectureAssignItem(gangseoSlot)]
    expect(isLectureAssignSlotDisabled(gangseoSecondSession, assigned)).toBe(false)
  })

  it('remote 승인 기관 슬롯은 resolvedScheduleId를 approve scheduleId로 쓴다', () => {
    const institution: ApplicantSchoolRow = {
      id: '1691183',
      no: 1,
      schoolName: '부산 미래고',
      region: '부산',
      educationGrade: '고2',
      classCount: 2,
      studentCount: 40,
      teacherName: '김교사',
      approvalStatus: 'approved',
      programId: '168004',
      sessions: [
        {
          round: 1,
          date: '2026. 10. 20',
          dayOfWeek: '화',
          duration: '1차시',
          format: '단독',
          classNum: '1교시',
          timeRange: '1교시',
          resolvedScheduleId: 8801,
        },
      ],
    }
    const parsed = parseInstructorLectureAssignScheduleFromInstitutions([institution])
    const slots = parsed.slotsByDateKey.get('2026-10-20') ?? []
    expect(slots).toHaveLength(1)
    expect(slots[0]?.key).toBe('8801')
    expect(slots[0]?.disabled).toBe(false)
  })

  it('시간이 누락된 기관 일정도 승인 모달용 슬롯으로 안전하게 변환한다', () => {
    const institution = {
      id: '1691405',
      no: 1,
      schoolName: '서울 미래초',
      region: '서울',
      educationGrade: '초1',
      classCount: 1,
      studentCount: 20,
      teacherName: '김교사',
      approvalStatus: 'approved',
      programId: '186234',
      sessions: [
        {
          round: 1,
          date: '2026. 10. 20',
          dayOfWeek: '화',
          duration: '1차시',
          format: '단독',
          classNum: '1교시',
          timeRange: undefined,
        },
      ],
    } as unknown as ApplicantSchoolRow

    const slots =
      parseInstructorLectureAssignScheduleFromInstitutions([institution]).slotsByDateKey.get(
        '2026-10-20'
      ) ?? []

    expect(slots[0]?.timeRange).toBe('종일')
  })

  it('배정 항목 삭제 시 해당 날짜 기관 잠금이 해제된다', () => {
    const assigned: InstructorLectureAssignItem[] = [toLectureAssignItem(gangseoSlot)]
    const cleared: InstructorLectureAssignItem[] = []
    expect(isLectureAssignSlotDisabled(otherSchoolSlot, assigned)).toBe(true)
    expect(isLectureAssignSlotDisabled(otherSchoolSlot, cleared)).toBe(false)
  })
})
