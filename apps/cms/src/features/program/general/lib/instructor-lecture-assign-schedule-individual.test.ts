import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import {
  formatIndividualLectureAssignSlotLabel,
  formatIndividualLectureAssignTagLabel,
  getIndividualLectureAssignSlots,
  INDIVIDUAL_PROGRAM_LECTURE_SCHOOL_ID,
  isIndividualLectureAssignSlotDisabled,
  parseIndividualInstructorLectureAssignSchedule,
  resolveIndividualProgramEducationScheduleLines,
} from './instructor-lecture-assign-schedule'
import { MINIMAL_INDIVIDUAL_LECTURE_ASSIGN_SCHEDULE_LINES } from './individual-lecture-assign-demo'
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

function createInstructor(
  overrides: Partial<ApplicantInstructorRow> = {}
): ApplicantInstructorRow {
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

  it('교육 일정이 없는 개인 프로그램은 최소 demo 일정을 사용한다', () => {
    const program = createIndividualProgram()
    delete program.generalCommonInfo

    expect(resolveIndividualProgramEducationScheduleLines(program)).toEqual([
      ...MINIMAL_INDIVIDUAL_LECTURE_ASSIGN_SCHEDULE_LINES,
    ])
    expect(parseIndividualInstructorLectureAssignSchedule(program)).toHaveLength(2)
  })

  it('개인 프로그램 슬롯·태그 라벨을 시안 형식으로 만든다', () => {
    const date = dayjs('2026-04-20')

    expect(formatIndividualLectureAssignSlotLabel(date, '09:30 ~ 12:20', '2차시')).toBe(
      '26년 4월 20일(월) 09:30 ~ 12:20 | 2차시'
    )
    expect(formatIndividualLectureAssignTagLabel(date, '09:30 ~ 12:20')).toBe(
      '26년 4월 20일(월) 09:30 ~ 12:20'
    )
  })
})
