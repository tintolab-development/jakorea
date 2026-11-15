/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'
import {
  mapAdminProgramDetailToProgram,
  mapGeneralProgramToCreateRequest,
  mapGeneralProgramToUpdateRequest,
} from '@/features/program/general/api/adapters/general-program-adapters'
import {
  applyTypedParticipantInterviewToOverlay,
  buildParticipantInterviewConfigForRowSave,
  buildParticipantInterviewConfigForSave,
  buildVolunteerInterviewConfigForRowSave,
  buildVolunteerInterviewConfigForSave,
  completeVolunteerInterviewConfig,
  isParticipantInterviewOverlayKey,
} from '@/features/program/shared/lib/volunteer-interview-config'
import { buildProgramRecruitmentRowSaveRequest } from '@/features/program/shared/lib/persist-recruitment-row-save'
import {
  resolveGeneralProgramParticipantInterviewScheduleDisplay,
  resolveGeneralProgramParticipantInterviewScheduleEditSeed,
} from '@/features/program/general/lib/volunteer-interview-schedule-display'

/**
 * 일반 개인 참여자 모집 「면접 진행 가능 일정」 — 참여자 행(PARTICIPANT·INDIVIDUAL) typed interviewConfig.
 * 봉사자 `recruit.volunteer.interview.*` 와 같은 접미사를 `recruit.individual.interview.*` 로 쓴다.
 */

const SLOT = (d: number, h: number, m: number) =>
  `${Date.UTC(2026, 11, d, h, m)}-${Date.UTC(2026, 11, d, h, m + 30)}`

function scheduleOverlay(prefix: string): Record<string, unknown> {
  return {
    [`${prefix}.timeUnit`]: '30',
    [`${prefix}.interviewTimeRange`]: ['2026-12-11T01:00:00.000Z', '2026-12-11T06:00:00.000Z'],
    [`${prefix}.selectedSlotKeys`]: [SLOT(11, 1, 0), SLOT(11, 1, 30)],
    [`${prefix}.appliedUnavailableDates`]: ['2026-12-15'],
    [`${prefix}.exclusionState`]: {
      excludeNone: false,
      excludeSaturday: true,
      excludeSunday: true,
      excludeHoliday: false,
    },
    [`${prefix}.exception.1765000000000.exceptionDate`]: '2026-12-13T15:00:00.000Z',
    [`${prefix}.exception.1765000000000.selectedSlotKeys`]: [SLOT(14, 5, 0)],
    [`${prefix}.exception.1765000000000.timeUnit`]: '30',
  }
}

const P = 'recruit.individual.interview'
const V = 'recruit.volunteer.interview'
const PARTICIPANT_OVERLAY = scheduleOverlay(P)
const VOLUNTEER_OVERLAY = scheduleOverlay(V)

const EMPTY_COMPLETE = {
  schemaVersion: 1,
  selectedSlotKeys: [],
  timeUnit: null,
  interviewTimeRange: [],
  specificUnavailableDates: [],
  appliedUnavailableDates: [],
  exclusionState: null,
  exceptions: [],
}

describe('참여자 면접 typed — overlay 접두사', () => {
  it('참여자 접두사 overlay 로 봉사자와 같은 모양의 전체 typed 를 만든다', () => {
    expect(buildParticipantInterviewConfigForSave(PARTICIPANT_OVERLAY)).toEqual(
      completeVolunteerInterviewConfig(buildVolunteerInterviewConfigForSave(VOLUNTEER_OVERLAY))
    )
    expect(buildParticipantInterviewConfigForSave(PARTICIPANT_OVERLAY)).toMatchObject({
      timeUnit: 30,
      appliedUnavailableDates: ['2026-12-15'],
      exclusionState: { excludeSaturday: true, excludeSunday: true, excludeHoliday: false },
      exceptions: [
        { id: '1765000000000', exceptionDate: '2026-12-14', selectedSlotKeys: [SLOT(14, 5, 0)] },
      ],
    })
  })

  it('봉사자 overlay 키는 참여자 typed 에 들어가지 않고, 참여자 키는 봉사자 typed 에 들어가지 않는다', () => {
    expect(buildParticipantInterviewConfigForSave(VOLUNTEER_OVERLAY)).toEqual(EMPTY_COMPLETE)
    expect(buildVolunteerInterviewConfigForSave(PARTICIPANT_OVERLAY)).toEqual({ schemaVersion: 1 })
    expect(buildVolunteerInterviewConfigForRowSave(PARTICIPANT_OVERLAY, null)).toBeUndefined()
  })

  it('행 PATCH 합본 — 폼에 참여자 면접 키가 없으면 보내지 않고(유지), 있으면 저장 typed + 폼 값 전체', () => {
    expect(buildParticipantInterviewConfigForRowSave({ 'recruit.individual.notes': 'x' }, null)).toBe(
      undefined
    )
    const stored = completeVolunteerInterviewConfig({
      schemaVersion: 1,
      timeUnit: 60,
      appliedUnavailableDates: ['2026-12-20'],
    })
    const merged = buildParticipantInterviewConfigForRowSave(
      { [`${P}.timeUnit`]: '30' },
      stored
    )
    expect(merged).toMatchObject({ timeUnit: 30, appliedUnavailableDates: ['2026-12-20'] })
    // 참여자는 구 overlay fallback 이 없다 — 봉사자 키가 있어도 base 로 쓰지 않는다
    expect(
      buildParticipantInterviewConfigForRowSave({ ...VOLUNTEER_OVERLAY, [`${P}.timeUnit`]: '15' }, null)
    ).toEqual({ ...EMPTY_COMPLETE, timeUnit: 15 })
  })

  it('조회 — null 이면 참여자 면접 키를 비우고 봉사자 키는 그대로 둔다', () => {
    const overlay = { ...VOLUNTEER_OVERLAY, ...PARTICIPANT_OVERLAY, 'recruit.individual.notes': 'n' }
    const next = applyTypedParticipantInterviewToOverlay(overlay, null) ?? {}
    expect(Object.keys(next).filter(isParticipantInterviewOverlayKey)).toEqual([])
    expect(next['recruit.individual.notes']).toBe('n')
    expect(next[`${V}.timeUnit`]).toBe('30')
    // undefined(서버 조회 아님)는 그대로
    expect(applyTypedParticipantInterviewToOverlay(overlay, undefined)).toBe(overlay)
  })

  it('조회 — typed 가 있으면 참여자 면접 키를 typed 로 다시 쓴다', () => {
    const typed = buildParticipantInterviewConfigForSave(PARTICIPANT_OVERLAY)
    const next =
      applyTypedParticipantInterviewToOverlay(
        { [`${P}.exception.999.selectedSlotKeys`]: ['stale'] },
        typed
      ) ?? {}
    expect(next[`${P}.selectedSlotKeys`]).toEqual([SLOT(11, 1, 0), SLOT(11, 1, 30)])
    expect(next[`${P}.timeUnit`]).toBe('30')
    expect(next[`${P}.exception.999.selectedSlotKeys`]).toBeUndefined()
    expect(next[`${P}.exception.1765000000000.selectedSlotKeys`]).toEqual([SLOT(14, 5, 0)])
    expect(buildParticipantInterviewConfigForSave(next)).toEqual(typed)
  })
})

function individualProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: '186300',
    title: '개인 프로그램',
    type: 'offline',
    format: 'workshop',
    category: 'individual',
    sponsorId: 's1',
    status: 'pending',
    lifecycleStatus: 'recruiting_volunteers',
    backendProgramType: 'GENERAL_INDIVIDUAL',
    generalProgramAudience: 'individual',
    generalParticipantTypes: ['individual', 'volunteer'],
    rounds: [],
    startDate: '2026-12-01',
    endDate: '2027-02-28',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    programRecruitments: [
      {
        id: 300,
        recruitmentType: 'PARTICIPANT',
        applicationType: 'INDIVIDUAL',
        targetType: 'INDIVIDUAL',
        startAt: '2026-11-01T00:00:00.000Z',
        endAt: '2026-11-20T00:00:00.000Z',
      },
      {
        id: 301,
        recruitmentType: 'VOLUNTEER',
        applicationType: 'VOLUNTEER',
        targetType: 'COLLEGE_STUDENT',
      },
    ],
    ...overrides,
  } as Program
}

describe('참여자 모집 행 PATCH — interviewConfig', () => {
  const patch: Partial<Program> = {
    generalParticipantInterviewEnabled: true,
    registrationOverlay: { ...PARTICIPANT_OVERLAY, 'recruit.individual.interviewRequired': 'yes' },
  }

  it('GENERAL 개인 참여자 행에는 참여자 typed 전체 객체를 싣고 봉사자 전용 필드는 넣지 않는다', () => {
    const baseline = individualProgram({ participantInterviewConfigFromServer: null })
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline,
      draft: baseline,
      patch,
      audience: 'participant',
    }) as Record<string, unknown> | null
    expect(body?.id).toBe(300)
    expect(body?.recruitmentType).toBe('PARTICIPANT')
    expect(body?.applicationType).toBe('INDIVIDUAL')
    expect(body?.interviewConfig).toEqual(buildParticipantInterviewConfigForSave(PARTICIPANT_OVERLAY))
    expect(body).not.toHaveProperty('volunteerTargets')
    expect(body).not.toHaveProperty('noticeExposureTiming')
  })

  it('overlay 에 참여자 면접 키가 없으면 interviewConfig 를 보내지 않는다(유지)', () => {
    const baseline = individualProgram()
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline,
      draft: baseline,
      patch: { registrationOverlay: { 'recruit.individual.interviewRequired': 'yes' } },
      audience: 'participant',
    })
    expect(body).not.toHaveProperty('interviewConfig')
  })

  it('기관 참여자 행·UJAT·1사1교에는 보내지 않는다', () => {
    const org = individualProgram({
      backendProgramType: 'GENERAL_ORGANIZATION',
      programRecruitments: [
        { id: 400, recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION' },
      ],
    })
    const ujat = individualProgram({ backendProgramType: 'UJAT' })
    const companySchool = individualProgram({ backendProgramType: 'COMPANY_SCHOOL' })
    for (const program of [org, ujat, companySchool]) {
      const body = buildProgramRecruitmentRowSaveRequest({
        baseline: program,
        draft: program,
        patch,
        audience: 'participant',
      })
      expect(body).not.toHaveProperty('interviewConfig')
    }
  })

  it('봉사자 행 PATCH 는 참여자 키가 있어도 바뀌지 않는다', () => {
    const baseline = individualProgram({ volunteerInterviewConfigFromServer: null })
    const volunteerPatch: Partial<Program> = { registrationOverlay: { ...VOLUNTEER_OVERLAY } }
    const withParticipantKeys: Partial<Program> = {
      registrationOverlay: { ...VOLUNTEER_OVERLAY, ...PARTICIPANT_OVERLAY },
    }
    const a = buildProgramRecruitmentRowSaveRequest({
      baseline,
      draft: baseline,
      patch: volunteerPatch,
      audience: 'volunteer',
    })
    const b = buildProgramRecruitmentRowSaveRequest({
      baseline,
      draft: baseline,
      patch: withParticipantKeys,
      audience: 'volunteer',
    })
    expect(b).toEqual(a)
  })
})

function overlayOf(serviceDetailJson: string | undefined): Record<string, unknown> {
  return (
    (JSON.parse(serviceDetailJson ?? '{}') as { registration?: { overlay?: Record<string, unknown> } })
      .registration?.overlay ?? {}
  )
}

type Row = {
  recruitmentType?: string
  targetType?: string
  applicationType?: string
  interviewConfig?: unknown
  interviewEnabled?: boolean
}

function createProgram(interview: 'yes' | 'no', kind: 'individual' | 'organization'): Program {
  const individual = kind === 'individual'
  return individualProgram({
    id: 'local-create',
    backendProgramType: undefined,
    category: individual ? 'individual' : 'school',
    generalProgramAudience: individual ? 'individual' : 'organization',
    generalParticipantTypes: [individual ? 'individual' : 'school_institution', 'volunteer'],
    generalParticipantInterviewEnabled: interview === 'yes',
    registrationOverlay: {
      ...PARTICIPANT_OVERLAY,
      ...(individual ? { 'recruit.individual.interviewRequired': interview } : {}),
    },
    programRecruitments: [],
  })
}

describe('생성 본문 — 개인 참여자 행 interviewConfig', () => {
  it('면접 있음 — 개인 참여자 행에 applicationType·recruitmentType·전체 typed, overlay 참여자 키는 뺀다', () => {
    const body = mapGeneralProgramToCreateRequest(createProgram('yes', 'individual'))
    expect(body.programType).toBe('GENERAL_INDIVIDUAL')
    const rows = (body.recruitments ?? []) as Row[]
    const participant = rows.find(r => r.recruitmentType === 'PARTICIPANT')
    expect(participant?.applicationType).toBe('INDIVIDUAL')
    expect(participant?.interviewEnabled).toBe(true)
    expect(participant?.interviewConfig).toEqual(
      buildParticipantInterviewConfigForSave(PARTICIPANT_OVERLAY)
    )
    expect(
      Object.keys(overlayOf(body.serviceDetailJson)).filter(isParticipantInterviewOverlayKey)
    ).toEqual([])
    // 봉사자 행 typed 는 참여자 키로 채워지지 않는다
    const volunteer = rows.find(r => r.recruitmentType === 'VOLUNTEER')
    expect(volunteer?.interviewConfig).toEqual(EMPTY_COMPLETE)
  })

  it('면접 없음 — interviewConfig 를 보내지 않는다(조회 null = 빈 폼)', () => {
    const body = mapGeneralProgramToCreateRequest(createProgram('no', 'individual'))
    const participant = ((body.recruitments ?? []) as Row[]).find(
      r => r.recruitmentType === 'PARTICIPANT'
    )
    expect(participant).toBeDefined()
    expect(participant).not.toHaveProperty('interviewConfig')
    expect(participant?.applicationType).toBe('INDIVIDUAL')
  })

  it('기관 참여자 행에는 싣지 않는다', () => {
    const body = mapGeneralProgramToCreateRequest(createProgram('yes', 'organization'))
    const participant = ((body.recruitments ?? []) as Row[]).find(
      r => r.recruitmentType === 'PARTICIPANT'
    )
    expect(participant).toBeDefined()
    expect(participant).not.toHaveProperty('interviewConfig')
    expect(participant?.applicationType).toBe('ORGANIZATION')
  })
})

function detailDto(participantConfig: unknown): ProgramResponse {
  return {
    id: 186300,
    programType: 'GENERAL_INDIVIDUAL',
    title: '개인 프로그램',
    startDate: '2026-12-01',
    endDate: '2027-02-28',
    serviceDetailJson: JSON.stringify({
      schemaVersion: 1,
      registration: { overlay: { ...VOLUNTEER_OVERLAY, ...PARTICIPANT_OVERLAY } },
    }),
    recruitments: [
      {
        id: 300,
        recruitmentType: 'PARTICIPANT',
        applicationType: 'INDIVIDUAL',
        targetType: 'INDIVIDUAL',
        interviewEnabled: true,
        interviewConfig: participantConfig,
      },
      {
        id: 301,
        recruitmentType: 'VOLUNTEER',
        applicationType: 'VOLUNTEER',
        interviewEnabled: true,
        interviewConfig: completeVolunteerInterviewConfig(
          buildVolunteerInterviewConfigForSave(VOLUNTEER_OVERLAY)
        ),
      },
    ],
  } as unknown as ProgramResponse
}

describe('상세 조회 — 참여자 행 typed', () => {
  it('null 이면 빈 일정(봉사자 일정으로 채우지 않음)', () => {
    const mapped = mapAdminProgramDetailToProgram(detailDto(null))
    expect(mapped.participantInterviewConfigFromServer).toBeNull()
    expect(
      Object.keys(mapped.registrationOverlay ?? {}).filter(isParticipantInterviewOverlayKey)
    ).toEqual([])
    expect(resolveGeneralProgramParticipantInterviewScheduleEditSeed(mapped)).toBeUndefined()
    expect(resolveGeneralProgramParticipantInterviewScheduleDisplay(mapped)).toEqual({
      recurringUnavailable: '-',
      specificUnavailableDates: '-',
      availableTimeSlots: '-',
      exceptions: [],
    })
    // 봉사자 typed·overlay 는 그대로
    expect(mapped.volunteerInterviewConfigFromServer).not.toBeNull()
    expect(mapped.registrationOverlay?.[`${V}.selectedSlotKeys`]).toEqual([
      SLOT(11, 1, 0),
      SLOT(11, 1, 30),
    ])
  })

  it('typed 가 있으면 참여자 면접 키·표시가 typed 값이고, 이어지는 PATCH 본문에 참여자 키를 넣지 않는다', () => {
    const typed = buildParticipantInterviewConfigForSave(PARTICIPANT_OVERLAY)
    const mapped = mapAdminProgramDetailToProgram(detailDto(typed))
    expect(mapped.participantInterviewConfigFromServer).toEqual(typed)
    expect(mapped.registrationOverlay?.[`${P}.selectedSlotKeys`]).toEqual([
      SLOT(11, 1, 0),
      SLOT(11, 1, 30),
    ])
    expect(resolveGeneralProgramParticipantInterviewScheduleDisplay(mapped).specificUnavailableDates).not.toBe(
      '-'
    )
    const patch: Partial<Program> = { registrationOverlay: mapped.registrationOverlay }
    const update = mapGeneralProgramToUpdateRequest({ ...mapped, ...patch }, patch, mapped)
    expect(
      Object.keys(overlayOf(update.serviceDetailJson)).filter(isParticipantInterviewOverlayKey)
    ).toEqual([])
  })

  it('UJAT 등 GENERAL 계열이 아니면 참여자 typed 를 읽지 않는다', () => {
    const dto = { ...detailDto(null), programType: 'UJAT' } as ProgramResponse
    const mapped = mapAdminProgramDetailToProgram(dto)
    expect(mapped.participantInterviewConfigFromServer).toBeUndefined()
  })
})
