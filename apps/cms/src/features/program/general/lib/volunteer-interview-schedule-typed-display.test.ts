/** @vitest-environment node */
import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { mapAdminProgramDetailToProgram } from '@/features/program/general/api/adapters/general-program-adapters'
import { parseGeneralInterviewScheduleFromProgram } from '@/features/program/general/lib/general-interview-assign-schedule-utils'
import {
  resolveGeneralProgramVolunteerInterviewScheduleDisplay,
  resolveGeneralProgramVolunteerInterviewScheduleEditSeed,
  resolveGeneralProgramVolunteerInterviewSchedulePreviewSeed,
  typedVolunteerInterviewUnavailableDateIsos,
} from '@/features/program/general/lib/volunteer-interview-schedule-display'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'

/**
 * Part7 — CMS 면접 일정 화면은 봉사 행 typed(specific ∪ applied) → GET 표시 객체 → overlay 순으로 읽는다.
 * 신청폼 미리보기 seed 만 신청자 화면과 같은 GET 표시 객체(specific 우선 복사본)를 쓴다.
 */

const SLOT_A = `${Date.UTC(2026, 11, 7, 1, 0)}-${Date.UTC(2026, 11, 7, 1, 30)}`
const SLOT_B = `${Date.UTC(2026, 11, 7, 1, 30)}-${Date.UTC(2026, 11, 7, 2, 0)}`

const TYPED_186382 = {
  schemaVersion: 1,
  selectedSlotKeys: [SLOT_A, SLOT_B],
  timeUnit: 30,
  interviewTimeRange: ['2026-12-07T01:00:00Z', '2026-12-07T03:00:00Z'],
  specificUnavailableDates: ['2026-12-15'],
  appliedUnavailableDates: ['2026-12-10', '2026-12-15'],
  exclusionState: { excludeSaturday: true, excludeSunday: true, excludeHoliday: true },
  exceptions: [
    {
      id: '1793000000000',
      exceptionDate: '2026-12-08',
      selectedSlotKeys: [`${Date.UTC(2026, 11, 8, 1, 0)}-${Date.UTC(2026, 11, 8, 1, 30)}`],
    },
  ],
}

const SERVER_186382 = {
  periodStartDate: '2026-12-07',
  periodEndDate: '2026-12-20',
  availableTimeSlots: '10:00 ~ 10:30, 10:30 ~ 11:00',
  specificUnavailableDateIsos: ['2026-12-15'],
  recurringUnavailable: '토요일, 일요일, 공휴일',
  exceptions: [{ exceptionDateIso: '2026-12-08', availableTimeSlots: '10:00 ~ 10:30' }],
}

const OVERLAY: Record<string, unknown> = {
  'recruit.volunteer.interviewRequired': 'yes',
  'recruit.volunteer.interview.timeUnit': '30',
  'recruit.volunteer.interview.interviewTimeRange': [
    '2026-12-07T01:00:00.000Z',
    '2026-12-07T03:00:00.000Z',
  ],
  'recruit.volunteer.interview.selectedSlotKeys': [SLOT_A, SLOT_B],
  'recruit.volunteer.interview.appliedUnavailableDates': ['2026-12-10'],
}

function dto(args: {
  interviewConfig: unknown
  schedule?: Record<string, unknown>
  interviewEnabled?: boolean
  overlay?: Record<string, unknown>
  programType?: string
  volunteerRows?: number
}): ProgramResponse {
  const volunteer = (id: number) => ({
    id,
    recruitmentType: 'VOLUNTEER',
    targetType: 'COLLEGE_STUDENT',
    applicationType: 'VOLUNTEER',
    startAt: '2026-11-30T15:00:00Z',
    endAt: '2026-12-15T14:59:59.999Z',
    interviewEnabled: args.interviewEnabled ?? true,
    interviewConfig: args.interviewConfig,
  })
  return {
    id: 990000,
    programType: args.programType ?? 'GENERAL_ORGANIZATION',
    title: '[BOT-TEST-VOL] p7 display',
    startDate: '2026-12-01',
    endDate: '2027-02-28',
    serviceDetailJson: JSON.stringify({
      schemaVersion: 1,
      generalParticipantTypes: ['school_institution', 'volunteer'],
      generalVolunteerInterviewEnabled: true,
      generalCommonInfo: {
        volunteerRecruitmentInfo: {
          volunteerInterviewEnabled: true,
          interviewStartDate: '2026-12-06T15:00:00.000Z',
          interviewEndDate: '2026-12-20T14:59:59.999Z',
        },
        ...(args.schedule ? { volunteerInterviewScheduleInfo: args.schedule } : {}),
      },
      registration: { overlay: args.overlay ?? OVERLAY },
    }),
    recruitments: [
      { id: 2, recruitmentType: 'PARTICIPANT', targetType: 'ORGANIZATION', interviewConfig: null },
      ...Array.from({ length: args.volunteerRows ?? 1 }, (_, i) => volunteer(1 + i * 10)),
    ],
  } as unknown as ProgramResponse
}

function blocked(program: ReturnType<typeof mapAdminProgramDetailToProgram>, iso: string) {
  return parseGeneralInterviewScheduleFromProgram(program, new Set()).disabledDate(dayjs(iso))
}

describe('typed 불가일 합집합', () => {
  it('specific ∪ applied, 날짜순·중복 제거', () => {
    expect(typedVolunteerInterviewUnavailableDateIsos(TYPED_186382)).toEqual([
      '2026-12-10',
      '2026-12-15',
    ])
    expect(
      typedVolunteerInterviewUnavailableDateIsos({
        specificUnavailableDates: ['2026-12-20'],
        appliedUnavailableDates: null,
      })
    ).toEqual(['2026-12-20'])
    expect(typedVolunteerInterviewUnavailableDateIsos({})).toEqual([])
  })
})

describe('186382 모양(specific=[12-15], applied=[12-10,12-15])', () => {
  const program = mapAdminProgramDetailToProgram(
    dto({ interviewConfig: TYPED_186382, schedule: SERVER_186382 })
  )

  it('조회 Program 에 typed 를 싣는다', () => {
    expect(program.volunteerInterviewConfigFromServer).toEqual(TYPED_186382)
  })

  it('상세 표시 — 두 날짜 모두, 나머지는 서버 표시와 같다', () => {
    const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
    expect(display.specificUnavailableDates).toContain('2026.12.10')
    expect(display.specificUnavailableDates).toContain('2026.12.15')
    expect(display.recurringUnavailable).toBe(SERVER_186382.recurringUnavailable)
    expect(display.availableTimeSlots).toBe(SERVER_186382.availableTimeSlots)
    expect(display.exceptions).toEqual([
      {
        blockId: 1,
        exceptionDate: expect.stringContaining('2026.12.08'),
        exceptionDateIso: '2026-12-08',
        availableTimeSlots: '10:00 ~ 10:30',
      },
    ])
  })

  it('수정 seed — applied 에 두 날짜(저장 시 applied 로 나가 specific 은 그대로)', () => {
    const seed = resolveGeneralProgramVolunteerInterviewScheduleEditSeed(program)
    expect(seed?.appliedUnavailableDates).toEqual(['2026-12-10', '2026-12-15'])
    expect(seed?.selectedTimeSlotLabels).toEqual(['10:00 ~ 10:30', '10:30 ~ 11:00'])
    expect(seed?.timeUnit).toBe('30')
    expect(seed).toMatchObject({ excludeSaturday: true, excludeSunday: true, excludeHoliday: true })
  })

  it('신청폼 미리보기 seed — 신청자 화면과 같은 서버 복사본(12-15)', () => {
    expect(
      resolveGeneralProgramVolunteerInterviewSchedulePreviewSeed(program)?.appliedUnavailableDates
    ).toEqual(['2026-12-15'])
  })

  it('면접 배정 캘린더 — 12-10·12-15 모두 막는다(BE allowsSlot 합집합과 같다)', () => {
    expect(blocked(program, '2026-12-10')).toBe(true)
    expect(blocked(program, '2026-12-15')).toBe(true)
    expect(blocked(program, '2026-12-09')).toBe(false)
  })
})

describe('우선순위', () => {
  it('typed 가 서버 표시 객체보다 우선(서버 값이 오래돼도)', () => {
    const program = mapAdminProgramDetailToProgram(
      dto({
        interviewConfig: {
          ...TYPED_186382,
          specificUnavailableDates: [],
          appliedUnavailableDates: ['2026-12-17'],
        },
        schedule: SERVER_186382,
      })
    )
    const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
    expect(display.specificUnavailableDates).toContain('2026.12.17')
    expect(display.specificUnavailableDates).not.toContain('2026.12.15')
  })

  it('typed null(구 프로그램) — 서버 표시 객체', () => {
    const program = mapAdminProgramDetailToProgram(
      dto({ interviewConfig: null, schedule: SERVER_186382 })
    )
    expect(program.volunteerInterviewConfigFromServer).toBeNull()
    const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
    expect(display.specificUnavailableDates).toContain('2026.12.15')
    expect(display.specificUnavailableDates).not.toContain('2026.12.10')
  })

  it('typed 에 반복 불가 설정이 없으면 서버 반복 불가 문구', () => {
    const program = mapAdminProgramDetailToProgram(
      dto({ interviewConfig: { ...TYPED_186382, exclusionState: null }, schedule: SERVER_186382 })
    )
    expect(
      resolveGeneralProgramVolunteerInterviewScheduleDisplay(program).recurringUnavailable
    ).toBe(SERVER_186382.recurringUnavailable)
  })

  it('UJAT·봉사 행 여러 개는 typed 를 싣지 않는다', () => {
    expect(
      mapAdminProgramDetailToProgram(dto({ interviewConfig: TYPED_186382, programType: 'UJAT' }))
        .volunteerInterviewConfigFromServer
    ).toBeUndefined()
    expect(
      mapAdminProgramDetailToProgram(dto({ interviewConfig: TYPED_186382, volunteerRows: 2 }))
        .volunteerInterviewConfigFromServer
    ).toBeUndefined()
  })
})

describe('면접 여부 — typed 가 있으면 행 interviewEnabled', () => {
  it('행 false → Program·overlay 면접 여부 OFF', () => {
    const program = mapAdminProgramDetailToProgram(
      dto({ interviewConfig: { schemaVersion: 1 }, interviewEnabled: false })
    )
    expect(program.generalVolunteerInterviewEnabled).toBe(false)
    expect(program.registrationOverlay?.['recruit.volunteer.interviewRequired']).toBe('no')
  })

  it('행 true + overlay 에 면접 여부 없음 → yes 로 채운다', () => {
    const program = mapAdminProgramDetailToProgram(
      dto({ interviewConfig: TYPED_186382, overlay: {} })
    )
    expect(program.generalVolunteerInterviewEnabled).toBe(true)
    expect(program.registrationOverlay?.['recruit.volunteer.interviewRequired']).toBe('yes')
  })

  it('typed null 이면 기존 overlay·nested 값 유지', () => {
    const program = mapAdminProgramDetailToProgram(
      dto({ interviewConfig: null, interviewEnabled: false })
    )
    expect(program.registrationOverlay?.['recruit.volunteer.interviewRequired']).toBe('yes')
  })
})
