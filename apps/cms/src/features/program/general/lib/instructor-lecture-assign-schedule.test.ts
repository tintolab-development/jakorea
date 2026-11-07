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
      '2026.11.03(화) 부명초등학교'
    )
    expect(toLectureAssignItem(gangseoSlot).tagLabel).toBe('2026.03.19(목) 강서초등학교')
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
          date: '2026.10.20',
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
    expect(slots[0]?.key).toBe('1691183|8801')
    expect(slots[0]?.scheduleId).toBe(8801)
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
          date: '2026.10.20',
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

  describe('배정된 일정(sessionSource: assigned)', () => {
    type AssignedSession = NonNullable<
      ApplicantSchoolRow['confirmedListAssignmentSessions']
    >[number]
    const assignedSession = (partial: Partial<AssignedSession>): AssignedSession => ({
      round: 99,
      date: '2026.10.27',
      dayOfWeek: '화',
      duration: '-',
      format: '-',
      classNum: '99차시',
      timeRange: '09:00',
      status: 'pending',
      resolvedScheduleId: 100,
      startAt: '2026-10-27T09:00:00+09:00',
      endAt: '2026-10-27T09:40:00+09:00',
      sessionNo: 2,
      ...partial,
    })
    const org = (
      id: string,
      organizationId: number,
      sessions: AssignedSession[],
      hope: AssignedSession[] = []
    ) =>
      ({
        id,
        organizationId,
        no: 1,
        schoolName: 'QA 제휴학교',
        region: '서울특별시 강남구',
        educationGrade: '초1',
        classCount: 1,
        studentCount: 20,
        teacherName: '김교사',
        approvalStatus: 'approved',
        programId: '186408',
        sessions: hope,
        confirmedListAssignmentSessions: sessions,
      }) as unknown as ApplicantSchoolRow

    it('희망 일정이 아니라 배정된 일정(confirmedListAssignmentSessions)만 카드로 만든다', () => {
      const hopeOnly = assignedSession({ resolvedScheduleId: 555, date: '2026.10.28' })
      const parsed = parseInstructorLectureAssignScheduleFromInstitutions(
        [org('1', 10, [assignedSession({})], [hopeOnly])],
        { sessionSource: 'assigned' }
      )
      expect(parsed.slotsByDateKey.get('2026-10-27')).toHaveLength(1)
      expect(parsed.slotsByDateKey.has('2026-10-28')).toBe(false)
    })

    it('배정 일정이 없는 승인 기관은 카드가 없다', () => {
      const parsed = parseInstructorLectureAssignScheduleFromInstitutions(
        [org('1', 10, [], [assignedSession({})])],
        { sessionSource: 'assigned' }
      )
      expect(parsed.slotsByDateKey.size).toBe(0)
    })

    it('회차 라벨은 sessionNo만 쓰고, 시간은 시작~종료로 표기한다', () => {
      const [slot] =
        parseInstructorLectureAssignScheduleFromInstitutions(
          [org('1', 10, [assignedSession({ sessionNo: 5, round: 1 })])],
          { sessionSource: 'assigned' }
        ).slotsByDateKey.get('2026-10-27') ?? []
      expect(slot?.sessionLabel).toBe('5회차')
      expect(slot?.timeRange).toBe('09:00 ~ 09:40')
    })

    it('sessionNo가 없으면 round/index로 대체하지 않고 "-"로 표기한다', () => {
      const [slot] =
        parseInstructorLectureAssignScheduleFromInstitutions(
          [org('1', 10, [assignedSession({ sessionNo: null, round: 3 })])],
          { sessionSource: 'assigned' }
        ).slotsByDateKey.get('2026-10-27') ?? []
      expect(slot?.sessionLabel).toBe('-')
    })

    it('같은 기관·같은 일정이라도 신청(application)이 다르면 카드를 합치지 않는다', () => {
      const slots =
        parseInstructorLectureAssignScheduleFromInstitutions(
          [org('1001', 10, [assignedSession({})]), org('1002', 10, [assignedSession({})])],
          { sessionSource: 'assigned' }
        ).slotsByDateKey.get('2026-10-27') ?? []
      expect(slots).toHaveLength(2)
      expect(slots.map(slot => slot.key).sort()).toEqual(['1001|100', '1002|100'])
      expect(slots.every(slot => slot.scheduleId === 100)).toBe(true)
      expect(toLectureAssignItem(slots[0]!).organizationApplicationId).toBe(1001)
    })

    it('같은 신청·같은 일정의 중복 sessions(OSA 학급별 row)는 한 장으로 합친다', () => {
      const slots =
        parseInstructorLectureAssignScheduleFromInstitutions(
          [org('1001', 10, [assignedSession({}), assignedSession({})])],
          { sessionSource: 'assigned' }
        ).slotsByDateKey.get('2026-10-27') ?? []
      expect(slots).toHaveLength(1)
    })

    it('하루 1개 기관 잠금은 기관(organizationId) 기준이라 같은 기관의 다른 신청은 열려 있다', () => {
      const slots =
        parseInstructorLectureAssignScheduleFromInstitutions(
          [
            org('1001', 10, [assignedSession({})]),
            org('1002', 10, [assignedSession({ resolvedScheduleId: 101 })]),
            org('2001', 20, [assignedSession({ resolvedScheduleId: 102 })]),
          ],
          { sessionSource: 'assigned' }
        ).slotsByDateKey.get('2026-10-27') ?? []
      const first = slots.find(slot => slot.schoolId === '1001')!
      const sameOrgOtherApp = slots.find(slot => slot.schoolId === '1002')!
      const otherOrg = slots.find(slot => slot.schoolId === '2001')!
      const assigned = [toLectureAssignItem(first)]
      expect(isLectureAssignSlotDisabled(sameOrgOtherApp, assigned)).toBe(false)
      expect(isLectureAssignSlotDisabled(otherOrg, assigned)).toBe(true)
    })

    it('일정 ID 미확정 세션 카드는 비활성화된다', () => {
      const parsed = parseInstructorLectureAssignScheduleFromInstitutions(
        [org('1', 10, [assignedSession({ resolvedScheduleId: null, scheduleUnresolved: true })])],
        { sessionSource: 'assigned' }
      )
      const slot = parsed.slotsByDateKey.get('2026-10-27')?.[0]
      expect(slot?.disabled).toBe(true)
    })
  })
})
