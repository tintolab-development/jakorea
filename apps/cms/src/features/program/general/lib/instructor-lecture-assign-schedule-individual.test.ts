import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import {
  buildIndividualLectureAssignSlotsFromScheduleSlots,
  mapLectureAssignItemsToApprovalAssignments,
  parseScheduleIdFromSlotKey,
  toIndividualLectureAssignItem,
  formatIndividualLectureAssignSlotLabel,
  formatIndividualLectureAssignTagLabel,
  getIndividualLectureAssignSlots,
  INDIVIDUAL_PROGRAM_LECTURE_SCHOOL_ID,
  isIndividualLectureAssignSlotDisabled,
  parseIndividualInstructorLectureAssignSchedule,
  resolveIndividualProgramEducationScheduleLines,
} from './instructor-lecture-assign-schedule'
import dayjs from 'dayjs'

function createIndividualProgram(): Program {
  return {
    id: 'individual-program-1',
    sponsorId: 'sponsor-1',
    title: '개인 프로그램',
    mainTitle: '개인 프로그램',
    type: 'offline',
    format: 'workshop',
    category: 'individual',
    rounds: [],
    startDate: '2026-04-01T00:00:00+09:00',
    endDate: '2026-05-31T23:59:59+09:00',
    applicationStartDate: '2026-03-01T00:00:00+09:00',
    applicationEndDate: '2026-03-31T23:59:59+09:00',
    status: 'active',
    lifecycleStatus: 'recruiting_instructors',
    generalProgramAudience: 'individual',
    generalCommonInfo: {
      educationScheduleLines: [
        '26년 4월 20일(월) 09:30 ~ 12:20',
        '26년 4월 27일(월) 09:30 ~ 12:20',
      ],
    },
    createdAt: '2026-01-01T00:00:00+09:00',
    updatedAt: '2026-01-01T00:00:00+09:00',
  }
}

function createInstructor(overrides: Partial<ApplicantInstructorRow> = {}): ApplicantInstructorRow {
  return {
    id: 'instructor-1',
    no: 1,
    instructorName: '박틴토',
    lectureExperienceYears: 3,
    educationLevel: '대학교',
    educationSchoolName: '테스트대',
    contact: '010-0000-0000',
    email: 'tinto@naver.com',
    address: '서울',
    approvalStatus: 'pending',
    schoolName: '-',
    preferredScheduleSlots: [
      {
        slotKey: `2026-04-20|${INDIVIDUAL_PROGRAM_LECTURE_SCHOOL_ID}|1`,
        assignable: true,
      },
      {
        slotKey: `2026-04-27|${INDIVIDUAL_PROGRAM_LECTURE_SCHOOL_ID}|2`,
        assignable: false,
      },
    ],
    ...overrides,
  }
}

describe('individual instructor lecture assign schedule', () => {
  it('프로그램 등록 일정을 슬롯 목록으로 파싱한다', () => {
    const slots = parseIndividualInstructorLectureAssignSchedule(createIndividualProgram())

    expect(slots).toHaveLength(2)
    expect(slots[0]?.sessionLabel).toBe('1차시')
    expect(slots[0]?.timeRange).toBe('09:30 ~ 12:20')
    expect(slots[1]?.sessionLabel).toBe('2차시')
  })

  it('일정별 scheduleLead 선택값을 승인 payload에 그대로 반영한다', () => {
    const assignments = mapLectureAssignItemsToApprovalAssignments([
      {
        slotKey: '186659',
        scheduleId: 186659,
        dateKey: '2026-04-20',
        schoolId: INDIVIDUAL_PROGRAM_LECTURE_SCHOOL_ID,
        schoolName: '개인 프로그램',
        sessionLabel: '1차시',
        timeRange: '09:30 ~ 12:20',
        dateLabel: '26년 4월 20일(월)',
        tagLabel: '26년 4월 20일(월) 09:30 ~ 12:20',
        scheduleLead: false,
      },
      {
        slotKey: '186660',
        scheduleId: 186660,
        dateKey: '2026-04-27',
        schoolId: INDIVIDUAL_PROGRAM_LECTURE_SCHOOL_ID,
        schoolName: '개인 프로그램',
        sessionLabel: '2차시',
        timeRange: '09:30 ~ 12:20',
        dateLabel: '26년 4월 27일(월)',
        tagLabel: '26년 4월 27일(월) 09:30 ~ 12:20',
        scheduleLead: true,
      },
    ])

    expect(assignments.map(assignment => assignment.scheduleLead)).toEqual([false, true])
  })

  it('강사 배정 불가 일정은 비활성화한다', () => {
    const program = createIndividualProgram()
    const instructor = createInstructor()
    const slots = getIndividualLectureAssignSlots(program, instructor, [instructor])

    expect(slots[0]?.disabled).toBe(false)
    expect(slots[1]?.disabled).toBe(true)
  })

  it('배정 불가 선호 일정이 없으면 슬롯을 활성 상태로 둔다', () => {
    const program = createIndividualProgram()
    const instructor = createInstructor({ preferredScheduleSlots: undefined })
    const slots = parseIndividualInstructorLectureAssignSchedule(program)

    expect(isIndividualLectureAssignSlotDisabled(slots[1]!, instructor)).toBe(false)
  })

  it('교육 일정이 없는 개인 프로그램은 빈 일정을 반환한다', () => {
    const program = createIndividualProgram()
    delete program.generalCommonInfo

    expect(resolveIndividualProgramEducationScheduleLines(program)).toEqual([])
    expect(parseIndividualInstructorLectureAssignSchedule(program)).toHaveLength(0)
  })

  it('상세 응답 일정은 assignable false도 비활성 슬롯으로 포함한다', () => {
    const slots = buildIndividualLectureAssignSlotsFromScheduleSlots(
      [
        {
          scheduleId: 186626,
          startAt: '2026-04-20T09:30:00',
          endAt: '2026-04-20T12:20:00',
          assignable: true,
        },
        {
          scheduleId: 186627,
          startAt: '2026-04-27T09:30:00',
          endAt: '2026-04-27T12:20:00',
          assignable: false,
        },
        {
          scheduleId: 186628,
          startAt: '2026-04-21T09:00:00',
          endAt: '2026-04-23T18:00:00',
          assignable: null,
        },
        {
          scheduleId: 186626,
          startAt: '2026-04-20T09:30:00',
          endAt: '2026-04-20T12:20:00',
          assignable: true,
        },
      ],
      { schoolName: '개인 프로그램', allInstructors: [] }
    )

    expect(slots.map(slot => slot.key)).toEqual([
      '186626:2026-04-20T09:30:00',
      '186628:2026-04-21T09:00:00',
      '186627:2026-04-27T09:30:00',
    ])
    expect(slots[0]?.disabled).toBe(false)
    expect(slots.find(slot => slot.key === '186627:2026-04-27T09:30:00')?.disabled).toBe(true)
    expect(slots[0]?.scheduleId).toBe(186626)
  })

  it('PERIOD composite slotKey에서 scheduleId를 추출해 승인 payload를 만든다', () => {
    const slot = buildIndividualLectureAssignSlotsFromScheduleSlots(
      [
        {
          scheduleId: 186659,
          startAt: '2026-10-28T00:00:00+09:00',
          endAt: '2026-11-12T23:59:59+09:00',
          assignable: true,
          label: '26년 10월 28일(수) ~ 26년 11월 12일(목)',
        },
      ],
      { schoolName: '프로그램', allInstructors: [] }
    )[0]!

    expect(parseScheduleIdFromSlotKey(slot.key)).toBe(186659)
    const [assignment] = mapLectureAssignItemsToApprovalAssignments([
      toIndividualLectureAssignItem(slot),
    ])
    expect(assignment).toEqual({
      scheduleId: 186659,
      scheduleLead: true,
    })
  })

  it('같은 scheduleId의 PERIOD 구간은 각각 슬롯으로 만든다', () => {
    const slots = buildIndividualLectureAssignSlotsFromScheduleSlots(
      [
        {
          scheduleId: 186659,
          startAt: '2026-10-28T00:00:00+09:00',
          endAt: '2026-11-12T23:59:59+09:00',
          assignable: true,
          label: '26년 10월 28일(수) ~ 26년 11월 12일(목)',
        },
        {
          scheduleId: 186659,
          startAt: '2026-11-25T00:00:00+09:00',
          endAt: '2026-12-11T23:59:59+09:00',
          assignable: true,
          label: '26년 11월 25일(수) ~ 26년 12월 11일(금)',
        },
      ],
      { schoolName: '개인 프로그램', allInstructors: [] }
    )

    expect(slots).toHaveLength(2)
    expect(slots[0]?.label).toBe('26년 10월 28일(수) ~ 26년 11월 12일(목)')
    expect(slots[1]?.label).toBe('26년 11월 25일(수) ~ 26년 12월 11일(금)')
  })

  it('여러 날에 걸친 일정은 종료 날짜까지 라벨에 표시한다', () => {
    const [slot] = buildIndividualLectureAssignSlotsFromScheduleSlots(
      [
        {
          scheduleId: 1,
          startAt: '2026-04-20T09:00:00',
          endAt: '2026-04-22T18:00:00',
          assignable: true,
        },
      ],
      { schoolName: '개인 프로그램', allInstructors: [] }
    )

    expect(slot?.label).toBe('2026. 04. 20(월) 09:00 ~ 2026. 04. 22(수) 18:00')
  })

  it('개인 프로그램 슬롯·태그 라벨을 시안 형식으로 만든다', () => {
    const date = dayjs('2026-04-20')

    expect(formatIndividualLectureAssignSlotLabel(date, '09:30 ~ 12:20', '2차시')).toBe(
      '2026. 04. 20(월) 09:30 ~ 12:20 | 2차시'
    )
    expect(formatIndividualLectureAssignTagLabel(date, '09:30 ~ 12:20')).toBe(
      '2026. 04. 20(월) 09:30 ~ 12:20'
    )
  })
})
