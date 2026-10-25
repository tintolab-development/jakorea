/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program, ProgramRecruitmentWindow } from '@/types/domain'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'
import { buildProgramRecruitmentRowSaveRequest } from '@/features/program/shared/lib/persist-recruitment-row-save'
import { mapAdminProgramDetailToProgram } from '@/features/program/general/api/adapters/general-program-adapters'

/**
 * Part4 6단계(봉사 면접 typed) parity — 4e1ec52e9에서 만든 스냅샷.
 * 모집 행 PATCH 본문은 `interviewConfig` 한 키만 늘어나고, 나머지는 그대로여야 한다.
 * 조회는 typed 값이 없거나(null) overlay와 같은 값이면 overlay가 그대로여야 한다.
 */

const SLOT_A = `${Date.UTC(2026, 11, 7, 1, 0)}-${Date.UTC(2026, 11, 7, 1, 30)}`
const SLOT_B = `${Date.UTC(2026, 11, 7, 1, 30)}-${Date.UTC(2026, 11, 7, 2, 0)}`
const EX_SLOT = `${Date.UTC(2026, 11, 9, 5, 0)}-${Date.UTC(2026, 11, 9, 5, 30)}`

export const INTERVIEW_OVERLAY: Record<string, unknown> = {
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
  'recruit.volunteer.interview.exclusionState': {
    excludeNone: false,
    excludeSaturday: true,
    excludeSunday: true,
    excludeHoliday: true,
  },
  'recruit.volunteer.interview.exceptionDate': null,
  'recruit.volunteer.interview.exception.1765000000000.exceptionDate': '2026-12-08T15:00:00.000Z',
  'recruit.volunteer.interview.exception.1765000000000.selectedSlotKeys': [EX_SLOT],
  'recruit.volunteer.interview.exception.1765000000000.timeUnit': '30',
  'recruit.volunteer.interview.exception.1765000000000.interviewTimeRange': [
    '2026-12-09T05:00:00.000Z',
    '2026-12-09T06:00:00.000Z',
  ],
  'generalRegistration.basicInfo.educationVenueDetail': '본관',
}

function volunteerRow(overrides: Partial<ProgramRecruitmentWindow> = {}): ProgramRecruitmentWindow {
  return {
    id: 990001,
    recruitmentType: 'VOLUNTEER',
    applicationType: 'VOLUNTEER',
    targetType: 'COLLEGE_STUDENT',
    startAt: '2026-11-30T15:00:00.000Z',
    endAt: '2026-12-15T14:59:59.999Z',
    operationStartDate: '2026-12-01',
    operationEndDate: '2027-02-28',
    interviewEnabled: true,
    interviewStartAt: '2026-12-06T15:00:00.000Z',
    interviewEndAt: '2026-12-20T14:59:59.999Z',
    recruitTerm: null,
    ...overrides,
  }
}

function orgProgram(overlay: Record<string, unknown> = INTERVIEW_OVERLAY): Program {
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
    registrationOverlay: overlay,
    programRecruitments: [
      { id: 990002, recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION' },
      volunteerRow(),
    ],
  } as Program
}

const EDITED_OVERLAY: Record<string, unknown> = {
  ...INTERVIEW_OVERLAY,
  'recruit.volunteer.interview.selectedSlotKeys': [SLOT_B],
  'recruit.volunteer.interview.appliedUnavailableDates': ['2026-12-10', '2026-12-11'],
}

function withoutInterviewConfig(body: unknown): unknown {
  if (body == null || typeof body !== 'object') return body
  const { interviewConfig: _ignored, ...rest } = body as Record<string, unknown>
  return rest
}

function detailDto(interviewConfig: unknown, overlay: Record<string, unknown> = INTERVIEW_OVERLAY) {
  return {
    id: 990000,
    programType: 'GENERAL_ORGANIZATION',
    title: '[BOT-TEST-VOL] parity',
    startDate: '2026-12-01',
    endDate: '2027-02-28',
    serviceDetailJson: JSON.stringify({ schemaVersion: 1, registration: { overlay } }),
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
        interviewEnabled: true,
        interviewConfig,
      },
    ],
  } as unknown as ProgramResponse
}

describe('봉사 면접 parity (part4 step6)', () => {
  it('봉사 모집 행 PATCH 본문 — interviewConfig 외 키는 그대로', () => {
    const program = orgProgram()
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: program,
      draft: { ...program, registrationOverlay: EDITED_OVERLAY },
      patch: {
        volunteerApplicationStartDate: '2026-11-30T15:00:00.000Z',
        volunteerApplicationEndDate: '2026-12-15T14:59:59.999Z',
        generalVolunteerInterviewEnabled: true,
        registrationOverlay: EDITED_OVERLAY,
      },
      audience: 'volunteer',
    })
    expect(withoutInterviewConfig(body)).toMatchSnapshot('volunteer-row-body')
  })

  it('봉사 모집 행 PATCH 본문 — overlay patch 없는 저장', () => {
    const program = orgProgram()
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: program,
      draft: program,
      patch: { volunteerApplicationEndDate: '2026-12-16T14:59:59.999Z' },
      audience: 'volunteer',
    })
    expect(withoutInterviewConfig(body)).toMatchSnapshot('volunteer-row-body-no-overlay')
  })

  it('UJAT 반기 봉사 행 본문은 그대로', () => {
    const program = {
      ...orgProgram(),
      backendProgramType: 'UJAT',
      programRecruitments: [volunteerRow({ id: 990011, recruitTerm: 'FIRST_HALF' })],
    } as Program
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: program,
      draft: program,
      patch: { registrationOverlay: EDITED_OVERLAY },
      audience: 'volunteer',
      volunteerHalf: 'h1',
    })
    expect(body).toMatchSnapshot('ujat-h1-row-body')
  })

  it('참여 행 본문은 그대로', () => {
    const program = orgProgram()
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: program,
      draft: program,
      patch: {
        registrationOverlay: EDITED_OVERLAY,
        applicationEndDate: '2026-12-16T14:59:59.999Z',
      },
      audience: 'participant',
    })
    expect(body).toMatchSnapshot('participant-row-body')
  })

  it('조회 — typed null 이면 overlay 그대로', () => {
    const program = mapAdminProgramDetailToProgram(detailDto(null))
    expect(program.registrationOverlay).toMatchSnapshot('overlay-typed-null')
  })

  it('조회 — interviewConfig 키가 없는 응답(구 서버)도 overlay 그대로', () => {
    const program = mapAdminProgramDetailToProgram(detailDto(undefined))
    expect(program.registrationOverlay).toMatchSnapshot('overlay-typed-absent')
  })
})

describe('봉사 면접 typed (part4 step6 신규 동작)', () => {
  it('봉사 행 PATCH 에 overlay 와 같은 의미의 interviewConfig 를 함께 보낸다(이중 쓰기)', () => {
    const program = orgProgram()
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: program,
      draft: { ...program, registrationOverlay: EDITED_OVERLAY },
      patch: { registrationOverlay: EDITED_OVERLAY },
      audience: 'volunteer',
    }) as unknown as Record<string, unknown>
    expect(body.interviewConfig).toEqual({
      schemaVersion: 1,
      selectedSlotKeys: [SLOT_B],
      timeUnit: 30,
      interviewTimeRange: ['2026-12-07T01:00:00.000Z', '2026-12-07T03:00:00.000Z'],
      specificUnavailableDates: [],
      appliedUnavailableDates: ['2026-12-10', '2026-12-11'],
      exclusionState: { excludeSaturday: true, excludeSunday: true, excludeHoliday: true },
      exceptions: [
        { id: '1765000000000', exceptionDate: '2026-12-09', selectedSlotKeys: [EX_SLOT] },
      ],
    })
  })

  it('overlay 없는 저장·UJAT 반기·참여 행에는 interviewConfig 를 넣지 않는다', () => {
    const program = orgProgram()
    const noOverlay = buildProgramRecruitmentRowSaveRequest({
      baseline: program,
      draft: program,
      patch: { volunteerApplicationEndDate: '2026-12-16T14:59:59.999Z' },
      audience: 'volunteer',
    }) as unknown as Record<string, unknown>
    expect(noOverlay).not.toHaveProperty('interviewConfig')
    const participant = buildProgramRecruitmentRowSaveRequest({
      baseline: program,
      draft: program,
      patch: { registrationOverlay: EDITED_OVERLAY },
      audience: 'participant',
    }) as unknown as Record<string, unknown>
    expect(participant).not.toHaveProperty('interviewConfig')
  })

  // part8: interviewConfig 는 BE 에서 통째 교체 — 면접 설정 키가 없으면 보내지 않아 저장값 유지
  it('면접 설정 키가 없는 overlay 저장은 interviewConfig 를 생략한다', () => {
    const program = orgProgram({})
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: program,
      draft: program,
      patch: { registrationOverlay: { 'recruit.volunteer.interviewRequired': 'no' } },
      audience: 'volunteer',
    }) as unknown as Record<string, unknown>
    expect(body).not.toHaveProperty('interviewConfig')
  })

  it('조회 — 서버 fallback(typed null 행 응답)과 같은 값이면 overlay 그대로', () => {
    const serverFallback = {
      schemaVersion: 1,
      selectedSlotKeys: [SLOT_A, SLOT_B],
      timeUnit: 30,
      interviewTimeRange: ['2026-12-07T01:00:00Z', '2026-12-07T03:00:00Z'],
      specificUnavailableDates: [],
      appliedUnavailableDates: ['2026-12-10'],
      exclusionState: { excludeSaturday: true, excludeSunday: true, excludeHoliday: true },
      exceptions: [
        { id: '1765000000000', exceptionDate: '2026-12-09', selectedSlotKeys: [EX_SLOT] },
      ],
    }
    const program = mapAdminProgramDetailToProgram(detailDto(serverFallback))
    expect(program.registrationOverlay).toEqual(INTERVIEW_OVERLAY)
  })

  it('조회 — 제외 없음(excludeNone)+공휴일 기본값 fallback 도 overlay 그대로', () => {
    const overlay = {
      ...INTERVIEW_OVERLAY,
      'recruit.volunteer.interview.exclusionState': {
        excludeNone: true,
        excludeSaturday: false,
        excludeSunday: false,
        excludeHoliday: true,
      },
    }
    const fallback = {
      schemaVersion: 1,
      selectedSlotKeys: [SLOT_A, SLOT_B],
      timeUnit: 30,
      interviewTimeRange: ['2026-12-07T01:00:00Z', '2026-12-07T03:00:00Z'],
      appliedUnavailableDates: ['2026-12-10'],
      exclusionState: { excludeSaturday: false, excludeSunday: false, excludeHoliday: true },
      exceptions: [
        { id: '1765000000000', exceptionDate: '2026-12-09', selectedSlotKeys: [EX_SLOT] },
      ],
    }
    expect(
      mapAdminProgramDetailToProgram(detailDto(fallback, overlay)).registrationOverlay
    ).toEqual(overlay)
  })

  it('조회 — typed 가 overlay 와 다르면 typed 값을 우선한다(UI 전용 키는 유지)', () => {
    const typed = {
      schemaVersion: 1,
      selectedSlotKeys: [SLOT_B],
      timeUnit: 60,
      interviewTimeRange: ['2026-12-07T01:00:00Z', '2026-12-07T05:00:00Z'],
      specificUnavailableDates: [],
      appliedUnavailableDates: ['2026-12-11'],
      exclusionState: { excludeSaturday: false, excludeSunday: false, excludeHoliday: false },
      exceptions: [],
    }
    const overlay = mapAdminProgramDetailToProgram(detailDto(typed)).registrationOverlay ?? {}
    expect(overlay['recruit.volunteer.interview.selectedSlotKeys']).toEqual([SLOT_B])
    expect(overlay['recruit.volunteer.interview.timeUnit']).toBe('60')
    expect(overlay['recruit.volunteer.interview.interviewTimeRange']).toEqual([
      '2026-12-07T01:00:00.000Z',
      '2026-12-07T05:00:00.000Z',
    ])
    expect(overlay['recruit.volunteer.interview.appliedUnavailableDates']).toEqual(['2026-12-11'])
    expect(overlay['recruit.volunteer.interview.exclusionState']).toEqual({
      excludeNone: false,
      excludeSaturday: false,
      excludeSunday: false,
      excludeHoliday: false,
    })
    expect(Object.keys(overlay).some(k => k.includes('.interview.exception.'))).toBe(false)
    expect(overlay['recruit.volunteer.interview.interviewTime']).toBe('2026-12-07T01:00:00.000Z')
    expect(overlay['recruit.volunteer.interviewRequired']).toBe('yes')
    expect(overlay['generalRegistration.basicInfo.educationVenueDetail']).toBe('본관')
  })

  it('조회 — 저장한 typed 를 다시 읽으면 저장 전 overlay 와 같은 면접 값', () => {
    const saved = buildProgramRecruitmentRowSaveRequest({
      baseline: orgProgram(),
      draft: orgProgram(),
      patch: { registrationOverlay: EDITED_OVERLAY },
      audience: 'volunteer',
    }) as unknown as Record<string, unknown>
    const overlay =
      mapAdminProgramDetailToProgram(detailDto(saved.interviewConfig)).registrationOverlay ?? {}
    for (const suffix of [
      'selectedSlotKeys',
      'appliedUnavailableDates',
      'timeUnit',
      'interviewTimeRange',
    ]) {
      expect(overlay[`recruit.volunteer.interview.${suffix}`]).toEqual(
        EDITED_OVERLAY[`recruit.volunteer.interview.${suffix}`]
      )
    }
    expect(overlay['recruit.volunteer.interview.exception.1765000000000.exceptionDate']).toBe(
      '2026-12-08T15:00:00.000Z'
    )
  })

  it('조회 — UJAT 프로그램은 typed 를 적용하지 않는다', () => {
    const dto = {
      ...(detailDto({ schemaVersion: 1, selectedSlotKeys: [SLOT_B] }) as unknown as Record<
        string,
        unknown
      >),
      programType: 'UJAT',
    } as unknown as ProgramResponse
    const overlay = mapAdminProgramDetailToProgram(dto).registrationOverlay ?? {}
    expect(overlay['recruit.volunteer.interview.selectedSlotKeys']).toEqual([SLOT_A, SLOT_B])
  })
})
