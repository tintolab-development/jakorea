/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  mapGeneralProgramToCreateRequest,
  mapGeneralProgramToUpdateRequest,
} from '@/features/program/general/api/adapters/general-program-adapters'
import { buildGeneralRecruitmentNestedSnapshotServiceDetailJson } from '@/features/program/general/lib/persist-recruitment-nested-snapshot'
import {
  isVolunteerInterviewOverlayKeyOmittedOnSave,
  omitVolunteerInterviewSaveKeysFromServiceDetailJson,
  volunteerInterviewRequiredFromOverlay,
} from '@/features/program/shared/lib/volunteer-interview-config'
import { buildProgramRecruitmentRowSaveRequest } from '@/features/program/shared/lib/persist-recruitment-row-save'
import { mapUjatProgramRecruitmentsToRequest } from '@/features/program/ujat/api/adapters'

/**
 * Part7(keonhee 2026-10-25 21:09) — 저장 본문 면접 필드.
 * scheduleInfo·typed/행 필드가 덮는 overlay 면접 키는 보내지 않고, 봉사 행 interviewEnabled·interviewConfig 를 보낸다.
 */

const SLOT = `${Date.UTC(2026, 11, 7, 1, 0)}-${Date.UTC(2026, 11, 7, 1, 30)}`

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
  'recruit.volunteer.interview.selectedSlotKeys': [SLOT],
  'recruit.volunteer.interview.appliedUnavailableDates': ['2026-12-10'],
  'generalRegistration.basicInfo.educationVenueDetail': '본관',
}

const VOLUNTEER_INTERVIEW_KEY =
  /^recruit\.volunteer\.(interview|selectedSlotKeys|timeUnit|interviewTimeRange|appliedUnavailableDates|specificUnavailableDates|exclusionState)/

function program(overrides: Partial<Program> = {}, overlay = OVERLAY_ON): Program {
  return {
    id: '990000',
    title: '[BOT-TEST-VOL] p7 unit',
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
      volunteerRecruitmentInfo: { volunteerInterviewEnabled: true },
      volunteerInterviewScheduleInfo: { specificUnavailableDateIsos: ['2026-12-10'] },
    },
    registrationOverlay: overlay,
    programRecruitments: [
      { id: 2, recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION' },
      {
        id: 1,
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

function detail(json: string | null | undefined) {
  const parsed = json
    ? (JSON.parse(json) as {
        generalCommonInfo?: Record<string, unknown>
        registration?: { overlay?: Record<string, unknown> }
      })
    : {}
  return {
    common: parsed.generalCommonInfo ?? {},
    overlay: parsed.registration?.overlay ?? {},
  }
}

function volunteerRow(rows: unknown) {
  return ((rows as Array<Record<string, unknown>> | undefined) ?? []).find(
    row => row.recruitmentType === 'VOLUNTEER'
  )
}

describe('저장에서 빼는 overlay 봉사 면접 키', () => {
  it.each([
    'recruit.volunteer.interviewRequired',
    'recruit.volunteer.interview.interviewTime',
    'recruit.volunteer.interview.exceptionDate',
    'recruit.volunteer.interview.selectedSlotKeys',
    'recruit.volunteer.interview.timeUnit',
    'recruit.volunteer.interview.interviewTimeRange',
    'recruit.volunteer.interview.appliedUnavailableDates',
    'recruit.volunteer.interview.specificUnavailableDates',
    'recruit.volunteer.interview.exclusionState',
    'recruit.volunteer.interview.exception.1.exceptionDate',
    'recruit.volunteer.interview.exception.1.selectedSlotKeys',
    'recruit.volunteer.selectedSlotKeys',
    'recruit.volunteer.timeUnit',
    'recruit.volunteer.interviewTimeRange',
    'recruit.volunteer.appliedUnavailableDates',
    'recruit.volunteer.specificUnavailableDates',
    'recruit.volunteer.exclusionState',
  ])('%s → 뺀다', key => {
    expect(isVolunteerInterviewOverlayKeyOmittedOnSave(key)).toBe(true)
  })

  it.each([
    'recruit.volunteer.interviewMethod',
    'recruit.volunteer.interviewRangeSeal',
    'recruit.volunteer.interviewAnchorIso',
    'recruit.volunteer.interview.exception.1.timeUnit',
    'recruit.volunteer.interview.exception.1.interviewTimeRange',
    'recruit.volunteer.interview.exception.1.interviewTime',
    'ujat.recruit.volunteer.h1.interview.selectedSlotKeys',
    'recruit.volunteer.h1.interviewRequired',
    'generalRegistration.basicInfo.educationVenueDetail',
  ])('%s → 남긴다(typed·행에 없음 또는 범위 밖)', key => {
    expect(isVolunteerInterviewOverlayKeyOmittedOnSave(key)).toBe(false)
  })

  it('serviceDetailJson — scheduleInfo·덮는 키만 빼고 나머지는 그대로', () => {
    const json = JSON.stringify({
      generalCommonInfo: {
        sponsorManagerLine: 'A',
        volunteerRecruitmentInfo: { volunteerInterviewEnabled: true },
        volunteerInterviewScheduleInfo: { availableTimeSlots: '10:00 ~ 10:30' },
      },
      registration: { overlay: OVERLAY_ON },
    })
    const out = detail(omitVolunteerInterviewSaveKeysFromServiceDetailJson(json))
    expect(out.common).toEqual({
      sponsorManagerLine: 'A',
      volunteerRecruitmentInfo: { volunteerInterviewEnabled: true },
    })
    expect(Object.keys(out.overlay).sort()).toEqual([
      'generalRegistration.basicInfo.educationVenueDetail',
      'recruit.volunteer.interviewAnchorIso',
      'recruit.volunteer.interviewMethod',
      'recruit.volunteer.interviewRangeSeal',
    ])
  })

  it('뺄 것이 없거나 JSON 이 아니면 입력 그대로', () => {
    const json = JSON.stringify({
      generalCommonInfo: { a: 1 },
      registration: { overlay: { x: 1 } },
    })
    expect(omitVolunteerInterviewSaveKeysFromServiceDetailJson(json)).toBe(json)
    expect(omitVolunteerInterviewSaveKeysFromServiceDetailJson('not-json')).toBe('not-json')
    expect(omitVolunteerInterviewSaveKeysFromServiceDetailJson(undefined)).toBeUndefined()
  })

  it('overlay 면접 여부 yes/no → boolean', () => {
    expect(
      volunteerInterviewRequiredFromOverlay({ 'recruit.volunteer.interviewRequired': 'yes' })
    ).toBe(true)
    expect(
      volunteerInterviewRequiredFromOverlay({ 'recruit.volunteer.interviewRequired': 'no' })
    ).toBe(false)
    expect(volunteerInterviewRequiredFromOverlay({})).toBeUndefined()
    expect(volunteerInterviewRequiredFromOverlay(undefined)).toBeUndefined()
  })
})

describe('생성 본문', () => {
  it('면접 ON — 봉사 행 interviewEnabled true·면접 기간·typed, scheduleInfo·덮는 키 없음', () => {
    const body = mapGeneralProgramToCreateRequest(
      program({
        generalVolunteerInterviewEnabled: true,
        generalCommonInfo: {
          volunteerRecruitmentInfo: {
            volunteerInterviewEnabled: true,
            interviewStartDate: '2026-12-06T15:00:00.000Z',
            interviewEndDate: '2026-12-20T14:59:59.999Z',
          },
          volunteerInterviewScheduleInfo: { availableTimeSlots: '10:00 ~ 10:30' },
        },
      })
    )
    const row = volunteerRow(body.recruitments)
    expect(row).toMatchObject({
      interviewEnabled: true,
      interviewStartAt: '2026-12-06T15:00:00.000Z',
      interviewEndAt: '2026-12-20T14:59:59.999Z',
      interviewConfig: expect.objectContaining({
        schemaVersion: 1,
        selectedSlotKeys: [SLOT],
        appliedUnavailableDates: ['2026-12-10'],
      }),
    })
    const out = detail(body.serviceDetailJson)
    expect(out.common).not.toHaveProperty('volunteerInterviewScheduleInfo')
    expect(out.overlay).not.toHaveProperty('recruit.volunteer.interviewRequired')
    expect(out.overlay).not.toHaveProperty('recruit.volunteer.interview.interviewTime')
    expect(out.overlay).toHaveProperty('recruit.volunteer.interviewMethod', 'online')
    expect(out.overlay).toHaveProperty('recruit.volunteer.interviewRangeSeal')
  })

  it('면접 기간이 nested 에 없으면 overlay interviewRangeSeal', () => {
    const body = mapGeneralProgramToCreateRequest(
      program({
        generalVolunteerInterviewEnabled: true,
        generalCommonInfo: { volunteerRecruitmentInfo: { volunteerInterviewEnabled: true } },
      })
    )
    expect(volunteerRow(body.recruitments)).toMatchObject({
      interviewStartAt: '2026-12-06T15:00:00.000Z',
      interviewEndAt: '2026-12-20T14:59:59.999Z',
    })
  })

  it('폼 값이 없으면 overlay 면접 여부로 interviewEnabled', () => {
    const body = mapGeneralProgramToCreateRequest(
      program({}, { ...OVERLAY_ON, 'recruit.volunteer.interviewRequired': 'no' })
    )
    const row = volunteerRow(body.recruitments)
    expect(row?.interviewEnabled).toBe(false)
    expect(row).not.toHaveProperty('interviewStartAt')
  })

  it('면접 OFF — interviewEnabled false, typed 는 schemaVersion 만', () => {
    const body = mapGeneralProgramToCreateRequest(
      program(
        { generalVolunteerInterviewEnabled: false },
        { 'recruit.volunteer.interviewRequired': 'no' }
      )
    )
    const row = volunteerRow(body.recruitments)
    expect(row?.interviewEnabled).toBe(false)
    expect(row?.interviewConfig).toEqual({ schemaVersion: 1 })
    expect(
      Object.keys(detail(body.serviceDetailJson).overlay).filter(k =>
        VOLUNTEER_INTERVIEW_KEY.test(k)
      )
    ).toEqual([])
  })
})

describe('프로그램 PATCH', () => {
  it('공통정보형 PATCH — scheduleInfo·덮는 overlay 키 없음, 남기는 키 유지', () => {
    const existing = program()
    const patch: Partial<Program> = {
      title: '수정',
      generalCommonInfo: existing.generalCommonInfo,
      registrationOverlay: OVERLAY_ON,
    }
    const body = mapGeneralProgramToUpdateRequest({ ...existing, ...patch }, patch, existing)
    const out = detail(body.serviceDetailJson)
    expect(out.common).not.toHaveProperty('volunteerInterviewScheduleInfo')
    expect(
      Object.keys(out.overlay)
        .filter(k => k.startsWith('recruit.volunteer.'))
        .sort()
    ).toEqual([
      'recruit.volunteer.interviewAnchorIso',
      'recruit.volunteer.interviewMethod',
      'recruit.volunteer.interviewRangeSeal',
    ])
  })

  it('봉사 행이 2개 이상이면 기존처럼 그대로 보낸다', () => {
    const existing = program({
      programRecruitments: [
        { id: 1, recruitmentType: 'VOLUNTEER', recruitTerm: null },
        { id: 3, recruitmentType: 'VOLUNTEER', recruitTerm: null },
      ],
    } as Partial<Program>)
    const patch: Partial<Program> = {
      volunteerApplicationStartDate: '2026-11-30T15:00:00.000Z',
      generalVolunteerInterviewEnabled: true,
      generalCommonInfo: existing.generalCommonInfo,
      registrationOverlay: OVERLAY_ON,
    }
    const body = mapGeneralProgramToUpdateRequest({ ...existing, ...patch }, patch, existing)
    expect(detail(body.serviceDetailJson).common).toHaveProperty('volunteerInterviewScheduleInfo')
    expect(detail(body.serviceDetailJson).overlay).toHaveProperty(
      'recruit.volunteer.interviewRequired'
    )
  })

  it('nested 스냅샷 PATCH — scheduleInfo 없음, nested 모집 정보는 유지', () => {
    const out = detail(buildGeneralRecruitmentNestedSnapshotServiceDetailJson(program()))
    expect(out.common).not.toHaveProperty('volunteerInterviewScheduleInfo')
    expect(out.common).toHaveProperty('volunteerRecruitmentInfo')
  })
})

describe('모집 행 PATCH interviewEnabled', () => {
  const base = program()
  it('폼 값이 우선', () => {
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: base,
      draft: base,
      patch: {
        generalVolunteerInterviewEnabled: true,
        registrationOverlay: { 'recruit.volunteer.interviewRequired': 'no' },
      },
      audience: 'volunteer',
    })
    expect(body?.interviewEnabled).toBe(true)
  })
  it('폼 값 없으면 이번 저장 overlay 면접 여부(OFF)', () => {
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: base,
      draft: base,
      patch: { registrationOverlay: { 'recruit.volunteer.interviewRequired': 'no' } },
      audience: 'volunteer',
    })
    expect(body?.interviewEnabled).toBe(false)
  })
  it('둘 다 없으면 행 값 유지', () => {
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: base,
      draft: base,
      patch: { generalVolunteers: 3 },
      audience: 'volunteer',
    })
    expect(body?.interviewEnabled).toBe(true)
  })
})

describe('UJAT — 운영 봉사 행에 interviewEnabled false 를 보내지 않는다', () => {
  const ujat = program({
    backendProgramType: 'UJAT',
    generalVolunteerInterviewEnabled: false,
    programRecruitments: [
      {
        id: 11,
        recruitmentType: 'VOLUNTEER',
        recruitTerm: 'FIRST_HALF',
        interviewEnabled: true,
        startAt: '2026-03-01T00:00:00Z',
      },
      {
        id: 12,
        recruitmentType: 'VOLUNTEER',
        recruitTerm: 'SECOND_HALF',
        interviewEnabled: true,
        startAt: '2026-09-01T00:00:00Z',
      },
    ],
  } as Partial<Program>)

  it('UJAT 프로그램 저장 행 — 봉사 행은 true', () => {
    const rows = mapUjatProgramRecruitmentsToRequest(ujat)
    const volunteers = rows.filter(row => row.recruitmentType === 'VOLUNTEER')
    expect(volunteers.length).toBeGreaterThan(0)
    for (const row of volunteers) expect(row.interviewEnabled).toBe(true)
  })

  it('UJAT 반기 행 PATCH — overlay 면접 여부 no 를 따르지 않는다', () => {
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: ujat,
      draft: ujat,
      patch: { registrationOverlay: { 'recruit.volunteer.interviewRequired': 'no' } },
      audience: 'volunteer',
      volunteerHalf: 'h1',
    })
    expect(body?.interviewEnabled).not.toBe(false)
  })

  it('일반 adapter 를 거쳐도 UJAT 봉사 행에 false 를 싣지 않는다', () => {
    const body = mapGeneralProgramToCreateRequest(ujat)
    for (const row of (body.recruitments ?? []).filter(r => r.recruitmentType === 'VOLUNTEER'))
      expect(row.interviewEnabled).not.toBe(false)
  })
})
