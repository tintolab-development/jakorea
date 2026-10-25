/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'
import {
  mapAdminProgramDetailToProgram,
  mapGeneralProgramToCreateRequest,
} from '@/features/program/general/api/adapters/general-program-adapters'
import { resolveGeneralProgramVolunteerInterviewScheduleDisplay } from '@/features/program/general/lib/volunteer-interview-schedule-display'
import { applySavedRecruitmentOntoProgram } from '@/features/program/shared/lib/persist-recruitment-row-save'

/**
 * Part6(JABACK 2026-10-25 BE 후속) 전 parity — 3cb760062에서 만든 스냅샷.
 * - 생성 본문: 봉사 행 recruitments[] 와 overlay 면접 키(일반 기관·개인 × 면접 ON/OFF)
 * - 상세 「면접 진행 가능 일정」 표시값(서버 GET 응답 → FE 매핑 → 표시)
 * - 모집 행 저장 후 재조회 병합 결과의 volunteerInterviewScheduleInfo
 */

const SLOT_A = `${Date.UTC(2026, 11, 7, 1, 0)}-${Date.UTC(2026, 11, 7, 1, 30)}`
const SLOT_B = `${Date.UTC(2026, 11, 7, 1, 30)}-${Date.UTC(2026, 11, 7, 2, 0)}`
const EX_SLOT = `${Date.UTC(2026, 11, 9, 5, 0)}-${Date.UTC(2026, 11, 9, 5, 30)}`

/** volunteer-interview-patch-strip-parity 와 같은 overlay(테스트 파일 import 시 그 파일 테스트가 다시 돌아 복사) */
const STRIP_PARITY_OVERLAY: Record<string, unknown> = {
  'recruit.volunteer.interviewRequired': 'yes',
  'recruit.volunteer.interviewMethod': 'online',
  'recruit.volunteer.interview.timeUnit': '30',
  'recruit.volunteer.interview.interviewTimeRange': [
    '2026-12-07T01:00:00.000Z',
    '2026-12-07T03:00:00.000Z',
  ],
  'recruit.volunteer.interview.interviewTime': '2026-12-07T01:00:00.000Z',
  'recruit.volunteer.interview.selectedSlotKeys': [SLOT_A, SLOT_B],
  'recruit.volunteer.interview.appliedUnavailableDates': ['2026-12-10'],
  'recruit.volunteer.interview.specificUnavailableDates': ['2026-12-10'],
  'recruit.volunteer.interview.exclusionState': {
    excludeNone: false,
    excludeSaturday: true,
    excludeSunday: true,
    excludeHoliday: true,
  },
  'recruit.volunteer.interview.exception.1765000000000.exceptionDate': '2026-12-08T15:00:00.000Z',
  'recruit.volunteer.interview.exception.1765000000000.exceptionDateIso':
    '2026-12-08T15:00:00.000Z',
  'recruit.volunteer.interview.exception.1765000000000.selectedSlotKeys': [EX_SLOT],
  'recruit.volunteer.interview.exception.1765000000000.timeUnit': '30',
  'recruit.volunteer.interview.exception.1765000000000.interviewTimeRange': [
    '2026-12-09T05:00:00.000Z',
    '2026-12-09T06:00:00.000Z',
  ],
  'generalRegistration.basicInfo.educationVenueDetail': '본관',
}

function stripParityProgram(
  overlay: Record<string, unknown>,
  overrides: Partial<Program> = {}
): Program {
  return {
    id: '990000',
    title: '[BOT-TEST-VOL] parity',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    sponsorId: 's1',
    status: 'pending',
    lifecycleStatus: 'recruiting_volunteers',
    backendProgramType: 'GENERAL_ORGANIZATION',
    rounds: [],
    startDate: '2026-12-01',
    endDate: '2027-02-28',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    generalCommonInfo: { sponsorManagerLine: 'A' },
    registrationOverlay: overlay,
    programRecruitments: [
      { id: 990002, recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION' },
      {
        id: 990001,
        recruitmentType: 'VOLUNTEER',
        applicationType: 'VOLUNTEER',
        targetType: 'COLLEGE_STUDENT',
        interviewEnabled: true,
        recruitTerm: null,
      },
    ],
    ...overrides,
  } as Program
}

function overlayOf(serviceDetailJson: string | null | undefined): Record<string, unknown> {
  if (!serviceDetailJson) return {}
  const parsed = JSON.parse(serviceDetailJson) as { registration?: { overlay?: unknown } }
  return (parsed.registration?.overlay as Record<string, unknown>) ?? {}
}

const OFF_OVERLAY: Record<string, unknown> = {
  'recruit.volunteer.interviewRequired': 'no',
  'generalRegistration.basicInfo.educationVenueDetail': '본관',
}

function individualProgram(overlay: Record<string, unknown>): Program {
  return stripParityProgram(overlay, {
    category: 'individual',
    backendProgramType: 'GENERAL_INDIVIDUAL',
    generalProgramAudience: 'individual',
    generalParticipantTypes: ['individual', 'volunteer'],
    programRecruitments: [
      { id: 990012, recruitmentType: 'PARTICIPANT', applicationType: 'INDIVIDUAL' },
      {
        id: 990011,
        recruitmentType: 'VOLUNTEER',
        applicationType: 'VOLUNTEER',
        targetType: 'COLLEGE_STUDENT',
        recruitTerm: null,
      },
    ] as Program['programRecruitments'],
  })
}

function organizationProgram(overlay: Record<string, unknown>, interviewOn: boolean): Program {
  return stripParityProgram(overlay, {
    generalProgramAudience: 'organization',
    generalParticipantTypes: ['school_institution', 'volunteer'],
    generalVolunteerInterviewEnabled: interviewOn,
  })
}

function createProjection(program: Program) {
  const body = mapGeneralProgramToCreateRequest(program)
  const overlay = overlayOf(body.serviceDetailJson)
  return {
    programType: body.programType,
    recruitments: body.recruitments,
    overlayInterviewKeys: Object.fromEntries(
      Object.entries(overlay).filter(([key]) => key.startsWith('recruit.volunteer.interview'))
    ),
  }
}

const SERVER_SCHEDULE_TYPED = {
  periodStartDate: '2026-12-07',
  periodEndDate: '2026-12-20',
  availableTimeSlots: '10:00 ~ 10:30',
  specificUnavailableDateIsos: ['2026-12-15'],
  recurringUnavailable: '토요일, 일요일',
  exceptions: [{ exceptionDateIso: '2026-12-08', availableTimeSlots: '14:00 ~ 14:30' }],
}

const TYPED_CONFIG = {
  schemaVersion: 1,
  selectedSlotKeys: [`${Date.UTC(2026, 11, 7, 1, 0)}-${Date.UTC(2026, 11, 7, 1, 30)}`],
  timeUnit: 30,
  interviewTimeRange: ['2026-12-07T01:00:00Z', '2026-12-07T03:00:00Z'],
  appliedUnavailableDates: ['2026-12-15'],
  specificUnavailableDates: [],
  exclusionState: { excludeSaturday: true, excludeSunday: true, excludeHoliday: false },
  exceptions: [
    {
      id: '1765000000000',
      exceptionDate: '2026-12-08',
      selectedSlotKeys: [`${Date.UTC(2026, 11, 8, 5, 0)}-${Date.UTC(2026, 11, 8, 5, 30)}`],
    },
  ],
}

function scheduleDto(args: {
  programType?: 'GENERAL_ORGANIZATION' | 'GENERAL_INDIVIDUAL'
  overlay: Record<string, unknown>
  schedule: Record<string, unknown> | undefined
  interviewConfig: unknown
  interviewEnabled?: boolean
}): ProgramResponse {
  const generalCommonInfo: Record<string, unknown> = {
    volunteerRecruitmentInfo: { volunteerInterviewEnabled: args.interviewEnabled ?? true },
  }
  if (args.schedule !== undefined) generalCommonInfo.volunteerInterviewScheduleInfo = args.schedule
  return {
    id: 990000,
    programType: args.programType ?? 'GENERAL_ORGANIZATION',
    title: '[BOT-TEST-VOL] parity',
    startDate: '2026-12-01',
    endDate: '2027-02-28',
    serviceDetailJson: JSON.stringify({
      schemaVersion: 1,
      generalCommonInfo,
      registration: { overlay: args.overlay },
    }),
    recruitments: [
      {
        id: 990002,
        recruitmentType: 'PARTICIPANT',
        targetType: 'ORGANIZATION',
        interviewConfig: null,
      },
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

describe('BE 후속 parity (part6) — 생성 본문', () => {
  it('일반 기관 + 봉사 면접 ON', () => {
    expect(createProjection(organizationProgram(STRIP_PARITY_OVERLAY, true))).toMatchSnapshot()
  })
  it('일반 기관 + 봉사 면접 OFF', () => {
    expect(createProjection(organizationProgram(OFF_OVERLAY, false))).toMatchSnapshot()
  })
  it('일반 개인 + 봉사 면접 ON', () => {
    expect(createProjection(individualProgram(STRIP_PARITY_OVERLAY))).toMatchSnapshot()
  })
  it('일반 개인 + 봉사 면접 OFF', () => {
    expect(createProjection(individualProgram(OFF_OVERLAY))).toMatchSnapshot()
  })
})

describe('BE 후속 parity (part6) — 상세 면접 일정 표시', () => {
  it('typed(12/15) ≠ overlay(12/10), 서버 표시 객체는 typed 기준', () => {
    const program = mapAdminProgramDetailToProgram(
      scheduleDto({
        overlay: STRIP_PARITY_OVERLAY,
        schedule: SERVER_SCHEDULE_TYPED,
        interviewConfig: TYPED_CONFIG,
      })
    )
    expect(resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)).toMatchSnapshot()
  })
  it('typed 빈 객체 저장 — 서버 표시 객체는 기간만', () => {
    const program = mapAdminProgramDetailToProgram(
      scheduleDto({
        overlay: STRIP_PARITY_OVERLAY,
        schedule: { periodStartDate: '2026-12-07', periodEndDate: '2026-12-20' },
        interviewConfig: { schemaVersion: 1 },
      })
    )
    expect(resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)).toMatchSnapshot()
  })
  it('typed null 구 프로그램 — 서버 표시 객체는 overlay 기준', () => {
    const program = mapAdminProgramDetailToProgram(
      scheduleDto({
        overlay: STRIP_PARITY_OVERLAY,
        schedule: {
          periodStartDate: '2026-12-07',
          periodEndDate: '2026-12-20',
          availableTimeSlots: '10:00 ~ 10:30, 10:30 ~ 11:00',
          specificUnavailableDateIsos: ['2026-12-10'],
          recurringUnavailable: '토요일, 일요일, 공휴일',
          exceptions: [{ exceptionDateIso: '2026-12-09', availableTimeSlots: '14:00 ~ 14:30' }],
        },
        interviewConfig: null,
      })
    )
    expect(resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)).toMatchSnapshot()
  })
})

describe('BE 후속 parity (part6) — 모집 행 저장 후 재조회 병합', () => {
  it('patch 의 overlay 계산 표시 객체 vs 재조회 서버 표시 객체', () => {
    const fetched = mapAdminProgramDetailToProgram(
      scheduleDto({
        overlay: STRIP_PARITY_OVERLAY,
        schedule: SERVER_SCHEDULE_TYPED,
        interviewConfig: TYPED_CONFIG,
      })
    )
    const patch: Partial<Program> = {
      registrationOverlay: STRIP_PARITY_OVERLAY,
      generalCommonInfo: {
        volunteerInterviewScheduleInfo: {
          specificUnavailableDateIsos: ['2026-12-10'],
          specificUnavailableDates: '2026.12.10(목)',
          availableTimeSlots: '10:00 ~ 10:30, 10:30 ~ 11:00',
        },
      },
    }
    const merged = applySavedRecruitmentOntoProgram({
      fetched,
      draft: fetched,
      patch,
      audience: 'volunteer',
    })
    expect(merged.generalCommonInfo?.volunteerInterviewScheduleInfo).toMatchSnapshot()
  })
})
