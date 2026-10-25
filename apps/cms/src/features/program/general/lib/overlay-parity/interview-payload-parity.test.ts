/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'
import {
  mapAdminProgramDetailToProgram,
  mapGeneralProgramToCreateRequest,
  mapGeneralProgramToUpdateRequest,
} from '@/features/program/general/api/adapters/general-program-adapters'
import { buildGeneralRecruitmentNestedSnapshotServiceDetailJson } from '@/features/program/general/lib/persist-recruitment-nested-snapshot'
import {
  resolveGeneralProgramVolunteerInterviewScheduleDisplay,
  resolveGeneralProgramVolunteerInterviewScheduleEditSeed,
} from '@/features/program/general/lib/volunteer-interview-schedule-display'
import { parseGeneralInterviewScheduleFromProgram } from '@/features/program/general/lib/general-interview-assign-schedule-utils'
import { buildProgramRecruitmentRowSaveRequest } from '@/features/program/shared/lib/persist-recruitment-row-save'
import dayjs from 'dayjs'

/**
 * Part7(keonhee 회신 2026-10-25 21:09) 전 parity — 679499a46에서 만든 스냅샷.
 * - 저장 본문: 생성·프로그램 PATCH(공통정보형·모집형)·nested 스냅샷 PATCH·모집 행 PATCH 의
 *   봉사 행 필드, generalCommonInfo.volunteerInterviewScheduleInfo, overlay 봉사 면접 키
 * - CMS 면접 일정 표시·수정 seed·신청폼 미리보기 seed·배정 캘린더 불가일 (186382 모양: specific≠applied)
 */

const SLOT_A = `${Date.UTC(2026, 11, 7, 1, 0)}-${Date.UTC(2026, 11, 7, 1, 30)}`
const SLOT_B = `${Date.UTC(2026, 11, 7, 1, 30)}-${Date.UTC(2026, 11, 7, 2, 0)}`
const EX_SLOT = `${Date.UTC(2026, 11, 9, 5, 0)}-${Date.UTC(2026, 11, 9, 5, 30)}`

const OVERLAY_ON: Record<string, unknown> = {
  'recruit.volunteer.interviewRequired': 'yes',
  'recruit.volunteer.interviewMethod': 'online',
  'recruit.volunteer.interviewAnchorIso': '2026-12-06T15:00:00.000Z',
  'recruit.volunteer.interviewRangeSeal': {
    start: '2026-12-06T15:00:00.000Z',
    end: '2026-12-20T14:59:59.999Z',
  },
  'recruit.volunteer.interview.timeUnit': '30',
  'recruit.volunteer.interview.interviewTimeRange': [
    '2026-12-07T01:00:00.000Z',
    '2026-12-07T03:00:00.000Z',
  ],
  'recruit.volunteer.interview.interviewTime': '2026-12-07T01:00:00.000Z',
  'recruit.volunteer.interview.exceptionDate': '2026-12-06T15:00:00.000Z',
  'recruit.volunteer.interview.selectedSlotKeys': [SLOT_A, SLOT_B],
  'recruit.volunteer.interview.appliedUnavailableDates': ['2026-12-10'],
  'recruit.volunteer.interview.exclusionState': {
    excludeNone: false,
    excludeSaturday: true,
    excludeSunday: true,
    excludeHoliday: true,
  },
  'recruit.volunteer.interview.exception.1765000000000.exceptionDate': '2026-12-08T15:00:00.000Z',
  'recruit.volunteer.interview.exception.1765000000000.selectedSlotKeys': [EX_SLOT],
  'recruit.volunteer.interview.exception.1765000000000.timeUnit': '30',
  'recruit.volunteer.interview.exception.1765000000000.interviewTime': '2026-12-09T05:00:00.000Z',
  'recruit.volunteer.interview.exception.1765000000000.interviewTimeRange': [
    '2026-12-09T05:00:00.000Z',
    '2026-12-09T06:00:00.000Z',
  ],
  // 접두사 없는 legacy(BE overlay fallback 이 읽는 키)
  'recruit.volunteer.selectedSlotKeys': [SLOT_A],
  'recruit.volunteer.appliedUnavailableDates': ['2026-12-11'],
  'generalRegistration.basicInfo.educationVenueDetail': '본관',
}

const OVERLAY_OFF: Record<string, unknown> = {
  'recruit.volunteer.interviewRequired': 'no',
  'generalRegistration.basicInfo.educationVenueDetail': '본관',
}

const VOLUNTEER_KEY =
  /^recruit\.volunteer\.(interview|selectedSlotKeys|timeUnit|interviewTimeRange|appliedUnavailableDates|specificUnavailableDates|exclusionState)/

function baseProgram(overlay: Record<string, unknown>, overrides: Partial<Program> = {}): Program {
  return {
    id: '990000',
    title: '[BOT-TEST-VOL] parity7',
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
    generalProgramAudience: 'organization',
    generalParticipantTypes: ['school_institution', 'volunteer'],
    generalCommonInfo: {
      sponsorManagerLine: 'A',
      volunteerRecruitmentInfo: {
        volunteerInterviewEnabled: true,
        interviewMethod: 'online',
        interviewStartDate: '2026-12-06T15:00:00.000Z',
        interviewEndDate: '2026-12-20T14:59:59.999Z',
      },
    },
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

function individual(overlay: Record<string, unknown>, on: boolean): Program {
  return baseProgram(overlay, {
    category: 'individual',
    backendProgramType: 'GENERAL_INDIVIDUAL',
    generalProgramAudience: 'individual',
    generalParticipantTypes: ['individual', 'volunteer'],
    generalVolunteerInterviewEnabled: on,
  })
}

function parsed(json: string | null | undefined): Record<string, unknown> {
  return json ? (JSON.parse(json) as Record<string, unknown>) : {}
}

function projection(body: { recruitments?: unknown; serviceDetailJson?: string | null }) {
  const detail = parsed(body.serviceDetailJson)
  const common = (detail.generalCommonInfo ?? {}) as Record<string, unknown>
  const overlay = ((detail.registration as { overlay?: Record<string, unknown> } | undefined)
    ?.overlay ?? {}) as Record<string, unknown>
  const rows = Array.isArray(body.recruitments) ? body.recruitments : []
  return {
    volunteerRows: rows.filter(
      (row: { recruitmentType?: string }) => row.recruitmentType === 'VOLUNTEER'
    ),
    hasScheduleInfo: Object.prototype.hasOwnProperty.call(common, 'volunteerInterviewScheduleInfo'),
    scheduleInfo: common.volunteerInterviewScheduleInfo,
    rootVolunteerInterviewEnabled: detail.generalVolunteerInterviewEnabled,
    nestedVolunteerInterviewEnabled: (
      common.volunteerRecruitmentInfo as Record<string, unknown> | undefined
    )?.volunteerInterviewEnabled,
    overlayVolunteerInterviewKeys: Object.keys(overlay)
      .filter(key => VOLUNTEER_KEY.test(key))
      .sort(),
  }
}

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

/** BE 표시 복사본 — specific 이 비어 있지 않으면 specific 만(RecruitmentInterviewConfigSupport L214-221) */
const SERVER_SCHEDULE_186382 = {
  periodStartDate: '2026-12-07',
  periodEndDate: '2026-12-20',
  availableTimeSlots: '10:00 ~ 10:30, 10:30 ~ 11:00',
  specificUnavailableDateIsos: ['2026-12-15'],
  recurringUnavailable: '토요일, 일요일, 공휴일',
  exceptions: [{ exceptionDateIso: '2026-12-08', availableTimeSlots: '10:00 ~ 10:30' }],
}

/** 생성 시 보낸 overlay(오래된 12/10 만) — typed 가 덮는다 */
const STALE_OVERLAY: Record<string, unknown> = {
  'recruit.volunteer.interviewRequired': 'yes',
  'recruit.volunteer.interview.timeUnit': '30',
  'recruit.volunteer.interview.interviewTimeRange': [
    '2026-12-07T01:00:00.000Z',
    '2026-12-07T03:00:00.000Z',
  ],
  'recruit.volunteer.interview.selectedSlotKeys': [SLOT_A, SLOT_B],
  'recruit.volunteer.interview.appliedUnavailableDates': ['2026-12-10'],
  'recruit.volunteer.interview.exclusionState': {
    excludeNone: false,
    excludeSaturday: true,
    excludeSunday: true,
    excludeHoliday: true,
  },
}

function dto(args: {
  overlay: Record<string, unknown>
  schedule: Record<string, unknown> | undefined
  interviewConfig: unknown
  interviewEnabled?: boolean
}): ProgramResponse {
  const generalCommonInfo: Record<string, unknown> = {
    volunteerRecruitmentInfo: {
      volunteerInterviewEnabled: args.interviewEnabled ?? true,
      interviewStartDate: '2026-12-06T15:00:00.000Z',
      interviewEndDate: '2026-12-20T14:59:59.999Z',
    },
  }
  if (args.schedule !== undefined) generalCommonInfo.volunteerInterviewScheduleInfo = args.schedule
  return {
    id: 990000,
    programType: 'GENERAL_ORGANIZATION',
    title: '[BOT-TEST-VOL] parity7',
    startDate: '2026-12-01',
    endDate: '2027-02-28',
    serviceDetailJson: JSON.stringify({
      schemaVersion: 1,
      generalParticipantTypes: ['school_institution', 'volunteer'],
      generalVolunteerInterviewEnabled: args.interviewEnabled ?? true,
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
        interviewStartAt: null,
        interviewEndAt: null,
        interviewConfig: args.interviewConfig,
      },
    ],
  } as unknown as ProgramResponse
}

function fetched186382(): Program {
  return mapAdminProgramDetailToProgram(
    dto({ overlay: STALE_OVERLAY, schedule: SERVER_SCHEDULE_186382, interviewConfig: TYPED_186382 })
  )
}

function assignProjection(program: Program) {
  const schedule = parseGeneralInterviewScheduleFromProgram(program, new Set())
  const day = (iso: string) => !schedule.disabledDate(dayjs(iso))
  return {
    '2026-12-09': day('2026-12-09'),
    '2026-12-10': day('2026-12-10'),
    '2026-12-11': day('2026-12-11'),
    '2026-12-15': day('2026-12-15'),
  }
}

describe('면접 payload parity (part7) — 생성 본문', () => {
  it('일반 기관 + 봉사 면접 ON', () => {
    const program = baseProgram(OVERLAY_ON, { generalVolunteerInterviewEnabled: true })
    expect(projection(mapGeneralProgramToCreateRequest(program))).toMatchSnapshot()
  })
  it('일반 기관 + 봉사 면접 ON — 위저드가 만든 nested 일정 표시 객체 포함', () => {
    const program = baseProgram(OVERLAY_ON, {
      generalVolunteerInterviewEnabled: true,
      generalCommonInfo: {
        volunteerRecruitmentInfo: {
          volunteerInterviewEnabled: true,
          interviewMethod: 'online',
          interviewStartDate: '2026-12-06T15:00:00.000Z',
          interviewEndDate: '2026-12-20T14:59:59.999Z',
        },
        volunteerInterviewScheduleInfo: {
          recurringUnavailable: '토요일, 일요일, 공휴일',
          specificUnavailableDates: '2026.12.10(목)',
          specificUnavailableDateIsos: ['2026-12-10'],
          availableTimeSlots: '10:00 ~ 10:30, 10:30 ~ 11:00',
        },
      },
    })
    expect(projection(mapGeneralProgramToCreateRequest(program))).toMatchSnapshot()
  })
  it('일반 기관 + 봉사 면접 OFF', () => {
    const program = baseProgram(OVERLAY_OFF, {
      generalVolunteerInterviewEnabled: false,
      generalCommonInfo: { volunteerRecruitmentInfo: { volunteerInterviewEnabled: false } },
    })
    expect(projection(mapGeneralProgramToCreateRequest(program))).toMatchSnapshot()
  })
  it('일반 개인 + 봉사 면접 ON', () => {
    expect(
      projection(mapGeneralProgramToCreateRequest(individual(OVERLAY_ON, true)))
    ).toMatchSnapshot()
  })
})

describe('면접 payload parity (part7) — 프로그램 PATCH', () => {
  it('공통정보형 PATCH(제목·공통정보·overlay)', () => {
    const existing = fetched186382()
    const merged = { ...existing, registrationOverlay: { ...OVERLAY_ON } }
    const patch: Partial<Program> = {
      title: '[BOT-TEST-VOL] parity7 수정',
      generalCommonInfo: { ...existing.generalCommonInfo, venueDetail: 'B동' },
      registrationOverlay: merged.registrationOverlay,
    }
    expect(projection(mapGeneralProgramToUpdateRequest(merged, patch, existing))).toMatchSnapshot()
  })
  it('모집형 PATCH(봉사 모집 창·면접 여부·nested·overlay)', () => {
    const existing = fetched186382()
    const patch: Partial<Program> = {
      volunteerApplicationStartDate: '2026-11-30T15:00:00.000Z',
      volunteerApplicationEndDate: '2026-12-15T14:59:59.999Z',
      generalVolunteerInterviewEnabled: true,
      generalCommonInfo: {
        ...existing.generalCommonInfo,
        volunteerInterviewScheduleInfo: {
          specificUnavailableDateIsos: ['2026-12-10'],
          specificUnavailableDates: '2026.12.10(목)',
          availableTimeSlots: '10:00 ~ 10:30, 10:30 ~ 11:00',
        },
      },
      registrationOverlay: { ...OVERLAY_ON },
    }
    expect(
      projection(mapGeneralProgramToUpdateRequest({ ...existing, ...patch }, patch, existing))
    ).toMatchSnapshot()
  })
  it('모집 행 저장 뒤 nested 스냅샷 PATCH', () => {
    const existing = fetched186382()
    const program: Program = {
      ...existing,
      generalCommonInfo: {
        ...existing.generalCommonInfo,
        volunteerInterviewScheduleInfo: {
          specificUnavailableDateIsos: ['2026-12-10'],
          availableTimeSlots: '10:00 ~ 10:30',
        },
      },
    }
    expect(
      projection({
        serviceDetailJson: buildGeneralRecruitmentNestedSnapshotServiceDetailJson(program),
      })
    ).toMatchSnapshot()
  })
})

describe('면접 payload parity (part7) — 모집 행 PATCH', () => {
  it('overlay 면접 여부 no, patch 에 generalVolunteerInterviewEnabled 없음', () => {
    const existing = fetched186382()
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: existing,
      draft: existing,
      patch: {
        registrationOverlay: { ...OVERLAY_ON, 'recruit.volunteer.interviewRequired': 'no' },
      },
      audience: 'volunteer',
    })
    expect({
      interviewEnabled: body?.interviewEnabled,
      interviewStartAt: body?.interviewStartAt,
      interviewEndAt: body?.interviewEndAt,
      interviewConfig: body?.interviewConfig,
    }).toMatchSnapshot()
  })
})

describe('면접 payload parity (part7) — CMS 면접 일정 화면(186382 모양)', () => {
  it('상세 표시', () => {
    expect(
      resolveGeneralProgramVolunteerInterviewScheduleDisplay(fetched186382())
    ).toMatchSnapshot()
  })
  it('수정 seed', () => {
    expect(
      resolveGeneralProgramVolunteerInterviewScheduleEditSeed(fetched186382())
    ).toMatchSnapshot()
  })
  it('면접 배정 캘린더 날짜 선택 가능 여부', () => {
    expect(assignProjection(fetched186382())).toMatchSnapshot()
  })
  it('읽기 overlay 면접 키(typed 반영 후)', () => {
    const overlay = fetched186382().registrationOverlay as Record<string, unknown>
    expect(
      Object.fromEntries(Object.entries(overlay).filter(([key]) => VOLUNTEER_KEY.test(key)))
    ).toMatchSnapshot()
  })
  it('typed null 구 프로그램 — 표시', () => {
    const program = mapAdminProgramDetailToProgram(
      dto({ overlay: STALE_OVERLAY, schedule: SERVER_SCHEDULE_186382, interviewConfig: null })
    )
    expect(resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)).toMatchSnapshot()
  })
})
