/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'
import { mapAdminProgramDetailToProgram } from '@/features/program/general/api/adapters/general-program-adapters'
import { resolveGeneralProgramVolunteerInterviewScheduleDisplay } from '@/features/program/general/lib/volunteer-interview-schedule-display'
import { parseGeneralInterviewScheduleFromProgram } from '@/features/program/general/lib/general-interview-assign-schedule-utils'
import { persistRecruitmentTabSave } from '@/features/program/shared/lib/persist-recruitment-row-save'

/**
 * Part6 FE 수용 기준 — CMS 「면접 진행 가능 일정」은 프로그램 GET 의
 * `generalCommonInfo.volunteerInterviewScheduleInfo` 를 그대로 보여 준다(overlay 재계산 없음).
 */

const rows = vi.hoisted(() => ({ patch: vi.fn() }))
vi.mock('@/features/program/shared/api/program-recruitment-rows', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  patchProgramRecruitment: rows.patch,
}))

const SLOT = (d: number, h: number, m: number) =>
  `${Date.UTC(2026, 11, d, h, m)}-${Date.UTC(2026, 11, d, h, m + 30)}`

/** 예전 overlay — 12/10 불가일, 10:00·10:30 슬롯 */
const OLD_OVERLAY: Record<string, unknown> = {
  'recruit.volunteer.interviewRequired': 'yes',
  'recruit.volunteer.interview.timeUnit': '30',
  'recruit.volunteer.interview.interviewTimeRange': [
    '2026-12-07T01:00:00.000Z',
    '2026-12-07T03:00:00.000Z',
  ],
  'recruit.volunteer.interview.selectedSlotKeys': [SLOT(7, 1, 0), SLOT(7, 1, 30)],
  'recruit.volunteer.interview.appliedUnavailableDates': ['2026-12-10'],
  'recruit.volunteer.interview.exclusionState': {
    excludeNone: false,
    excludeSaturday: true,
    excludeSunday: true,
    excludeHoliday: true,
  },
  'recruit.volunteer.interview.exception.1765000000000.exceptionDate': '2026-12-08T15:00:00.000Z',
  'recruit.volunteer.interview.exception.1765000000000.selectedSlotKeys': [SLOT(9, 5, 0)],
}

type ProgramType = 'GENERAL_ORGANIZATION' | 'GENERAL_INDIVIDUAL'

function dto(args: {
  programType: ProgramType
  schedule?: Record<string, unknown>
  interviewConfig: unknown
  interviewEnabled?: boolean
  overlay?: Record<string, unknown>
}): ProgramResponse {
  const generalCommonInfo: Record<string, unknown> = {
    volunteerRecruitmentInfo: {
      volunteerInterviewEnabled: args.interviewEnabled ?? true,
      volunteerInterviewEnabledLabel: (args.interviewEnabled ?? true) ? '면접 있음' : '면접 없음',
    },
  }
  if (args.schedule) generalCommonInfo.volunteerInterviewScheduleInfo = args.schedule
  const participant =
    args.programType === 'GENERAL_INDIVIDUAL'
      ? { id: 990012, recruitmentType: 'PARTICIPANT', targetType: 'INDIVIDUAL' }
      : { id: 990002, recruitmentType: 'PARTICIPANT', targetType: 'ORGANIZATION' }
  return {
    id: 990000,
    programType: args.programType,
    title: '[BOT-TEST-VOL] ssot',
    startDate: '2026-12-01',
    endDate: '2027-02-28',
    serviceDetailJson: JSON.stringify({
      schemaVersion: 1,
      generalCommonInfo,
      registration: { overlay: args.overlay ?? OLD_OVERLAY },
    }),
    recruitments: [
      { ...participant, interviewConfig: null },
      {
        id: 990001,
        recruitmentType: 'VOLUNTEER',
        targetType: 'COLLEGE_STUDENT',
        applicationType: 'VOLUNTEER',
        startAt: '2026-11-30T15:00:00Z',
        endAt: '2026-12-15T14:59:59.999Z',
        interviewEnabled: args.interviewEnabled ?? true,
        interviewConfig: args.interviewConfig,
      },
    ],
  } as unknown as ProgramResponse
}

const TYPED_1215 = {
  schemaVersion: 1,
  selectedSlotKeys: [SLOT(7, 2, 0)],
  timeUnit: 30,
  interviewTimeRange: ['2026-12-07T01:00:00Z', '2026-12-07T03:00:00Z'],
  appliedUnavailableDates: ['2026-12-15'],
  specificUnavailableDates: [],
  exclusionState: { excludeSaturday: true, excludeSunday: true, excludeHoliday: false },
  exceptions: [],
}
const SERVER_1215 = {
  periodStartDate: '2026-12-07',
  periodEndDate: '2026-12-20',
  availableTimeSlots: '11:00 ~ 11:30',
  specificUnavailableDateIsos: ['2026-12-15'],
  recurringUnavailable: '토요일, 일요일',
}

describe.each<ProgramType>(['GENERAL_ORGANIZATION', 'GENERAL_INDIVIDUAL'])(
  '%s — 면접 일정 표시는 서버 표시 객체',
  programType => {
    it('면접 ON: overlay 12/10 이 남아 있어도 표시는 서버(typed) 12/15', () => {
      const program = mapAdminProgramDetailToProgram(
        dto({ programType, schedule: SERVER_1215, interviewConfig: TYPED_1215 })
      )
      expect(program.volunteerInterviewScheduleInfoFromServer).toEqual(SERVER_1215)
      expect(resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)).toEqual({
        recurringUnavailable: '토요일, 일요일',
        specificUnavailableDates: '2026.12.15(화)',
        availableTimeSlots: '11:00 ~ 11:30',
        exceptions: [],
      })
    })

    it('overlay 로 재계산하지 않는다 — typed 값과 무관하게 서버 객체만 본다', () => {
      // typed null(구 프로그램)이라 FE overlay 는 12/10 그대로지만, 서버 객체가 12/15 면 12/15
      const program = mapAdminProgramDetailToProgram(
        dto({ programType, schedule: SERVER_1215, interviewConfig: null })
      )
      expect(
        (program.registrationOverlay ?? {})['recruit.volunteer.interview.appliedUnavailableDates']
      ).toEqual(['2026-12-10'])
      const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
      expect(display.specificUnavailableDates).toBe('2026.12.15(화)')
      expect(display.availableTimeSlots).toBe('11:00 ~ 11:30')
      expect(display.exceptions).toEqual([])
    })

    it('typed 빈 객체 저장 후 overlay 값이 일정 표시에 되살아나지 않는다', () => {
      const program = mapAdminProgramDetailToProgram(
        dto({
          programType,
          schedule: { periodStartDate: '2026-12-07', periodEndDate: '2026-12-20' },
          interviewConfig: { schemaVersion: 1 },
        })
      )
      expect(resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)).toEqual({
        recurringUnavailable: '-',
        specificUnavailableDates: '-',
        availableTimeSlots: '-',
        exceptions: [],
      })
      // 서버가 표시 객체 자체를 안 줘도 overlay 로 채우지 않는다
      const noObject = mapAdminProgramDetailToProgram(
        dto({ programType, interviewConfig: { schemaVersion: 1 } })
      )
      expect(noObject.volunteerInterviewScheduleInfoFromServer).toBeNull()
      expect(
        resolveGeneralProgramVolunteerInterviewScheduleDisplay(noObject).availableTimeSlots
      ).toBe('-')
    })

    it('면접 OFF: 서버 객체 없음 → 표시 값 없음(-), overlay 면접 키로 만들지 않음', () => {
      const program = mapAdminProgramDetailToProgram(
        dto({
          programType,
          interviewConfig: { schemaVersion: 1 },
          interviewEnabled: false,
          overlay: { 'recruit.volunteer.interviewRequired': 'no' },
        })
      )
      expect(resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)).toEqual({
        recurringUnavailable: '-',
        specificUnavailableDates: '-',
        availableTimeSlots: '-',
        exceptions: [],
      })
    })

    it('typed null 구 프로그램 — 서버 overlay fallback 객체(예외 포함)를 그대로', () => {
      const program = mapAdminProgramDetailToProgram(
        dto({
          programType,
          interviewConfig: null,
          schedule: {
            availableTimeSlots: '10:00 ~ 10:30, 10:30 ~ 11:00',
            specificUnavailableDateIsos: ['2026-12-10'],
            recurringUnavailable: '토요일, 일요일, 공휴일',
            exceptions: [{ exceptionDateIso: '2026-12-09', availableTimeSlots: '14:00 ~ 14:30' }],
          },
        })
      )
      expect(resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)).toEqual({
        recurringUnavailable: '토요일, 일요일, 공휴일',
        specificUnavailableDates: '2026.12.10(목)',
        availableTimeSlots: '10:00 ~ 10:30, 10:30 ~ 11:00',
        exceptions: [
          {
            blockId: 1,
            exceptionDate: '2026.12.09(수)',
            exceptionDateIso: '2026-12-09',
            availableTimeSlots: '14:00 ~ 14:30',
          },
        ],
      })
    })
  }
)

describe('null 과 [] 의미 유지', () => {
  it('specificUnavailableDateIsos: [] 는 불가일 없음(서버 문구로 대체하지 않음)', () => {
    const program = mapAdminProgramDetailToProgram(
      dto({
        programType: 'GENERAL_ORGANIZATION',
        interviewConfig: TYPED_1215,
        schedule: { specificUnavailableDateIsos: [], specificUnavailableDates: '2026.12.10(목)' },
      })
    )
    expect(
      resolveGeneralProgramVolunteerInterviewScheduleDisplay(program).specificUnavailableDates
    ).toBe('-')
  })
  it('specificUnavailableDateIsos 키가 없을 때만 서버 문구', () => {
    const program = mapAdminProgramDetailToProgram(
      dto({
        programType: 'GENERAL_ORGANIZATION',
        interviewConfig: TYPED_1215,
        schedule: { specificUnavailableDates: '2026.12.10(목)' },
      })
    )
    expect(
      resolveGeneralProgramVolunteerInterviewScheduleDisplay(program).specificUnavailableDates
    ).toBe('2026.12.10(목)')
  })
})

describe('면접 배정 캘린더도 같은 소스', () => {
  it('서버 불가일 12/15 만 막고 overlay 12/10 은 막지 않는다', () => {
    const program = mapAdminProgramDetailToProgram(
      dto({ programType: 'GENERAL_ORGANIZATION', schedule: SERVER_1215, interviewConfig: null })
    )
    const schedule = parseGeneralInterviewScheduleFromProgram(program, new Set())
    expect(schedule.clickableDateKeys.has('2026-12-15')).toBe(false)
    expect(schedule.clickableDateKeys.has('2026-12-10')).toBe(true)
  })
})

describe('서버 조회가 아닌 Program(등록 미리보기)은 기존 overlay 표시 유지', () => {
  it('volunteerInterviewScheduleInfoFromServer 가 없으면 overlay 로 표시', () => {
    const local = {
      id: 'local-1',
      title: 'local',
      registrationOverlay: OLD_OVERLAY,
      generalCommonInfo: {},
    } as unknown as Program
    const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(local)
    expect(display.specificUnavailableDates).toBe('2026.12.10(목)')
    expect(display.availableTimeSlots).toBe('10:00 ~ 10:30, 10:30 ~ 11:00')
  })
})

describe('모집 행 interviewConfig PATCH → 프로그램 GET 재조회 → 표시', () => {
  beforeEach(() => rows.patch.mockReset())

  it.each<ProgramType>(['GENERAL_ORGANIZATION', 'GENERAL_INDIVIDUAL'])(
    '%s: 불가일 12/10 → 12/15 저장 후 재조회한 서버 값으로 표시',
    async programType => {
      const baseline = mapAdminProgramDetailToProgram(
        dto({
          programType,
          interviewConfig: null,
          schedule: {
            specificUnavailableDateIsos: ['2026-12-10'],
            availableTimeSlots: '10:00 ~ 10:30',
          },
        })
      )
      expect(
        resolveGeneralProgramVolunteerInterviewScheduleDisplay(baseline).specificUnavailableDates
      ).toBe('2026.12.10(목)')
      const editedOverlay = {
        ...OLD_OVERLAY,
        'recruit.volunteer.interview.appliedUnavailableDates': ['2026-12-15'],
      }
      const order: string[] = []
      rows.patch.mockImplementation(async (_pid: number, rid: number) => {
        order.push('patch')
        return { id: rid, recruitmentType: 'VOLUNTEER' }
      })
      const refetchProgram = vi.fn(async () => {
        order.push('get')
        return mapAdminProgramDetailToProgram(
          dto({ programType, schedule: SERVER_1215, interviewConfig: TYPED_1215 })
        )
      })
      const patch: Partial<Program> = {
        registrationOverlay: editedOverlay,
        // 화면이 overlay 로 계산해 둔 옛 표시 객체 — 재조회 결과를 덮으면 안 된다
        generalCommonInfo: {
          volunteerInterviewScheduleInfo: {
            specificUnavailableDateIsos: ['2026-12-10'],
            specificUnavailableDates: '2026.12.10(목)',
          },
        },
      }
      const result = await persistRecruitmentTabSave({
        baseline,
        draft: { ...baseline, ...patch },
        patch,
        audience: 'volunteer',
        refetchProgram,
      })
      expect(order).toEqual(['patch', 'get'])
      const body = rows.patch.mock.calls[0]![2] as { interviewConfig?: Record<string, unknown> }
      // 객체 전체 교체 — 덮는 필드를 모두 담은 완전한 값(부분 객체 아님)
      expect(body.interviewConfig).toMatchObject({
        schemaVersion: 1,
        appliedUnavailableDates: ['2026-12-15'],
        selectedSlotKeys: [SLOT(7, 1, 0), SLOT(7, 1, 30)],
        timeUnit: 30,
        interviewTimeRange: ['2026-12-07T01:00:00.000Z', '2026-12-07T03:00:00.000Z'],
        exclusionState: { excludeSaturday: true, excludeSunday: true, excludeHoliday: true },
      })
      expect(Object.values(body.interviewConfig ?? {})).not.toContain(null)
      expect(result.mode).toBe('row')
      if (result.mode !== 'row') return
      expect(result.program.generalCommonInfo?.volunteerInterviewScheduleInfo).toEqual(SERVER_1215)
      expect(resolveGeneralProgramVolunteerInterviewScheduleDisplay(result.program)).toMatchObject({
        specificUnavailableDates: '2026.12.15(화)',
        availableTimeSlots: '11:00 ~ 11:30',
      })
    }
  )
})
