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
  isTypedCoveredVolunteerInterviewOverlayKey,
  omitTypedVolunteerInterviewKeysFromServiceDetailJson,
} from '@/features/program/shared/lib/volunteer-interview-config'

/** 픽스처는 parity 스냅샷 파일과 같다(테스트 파일 import 시 스냅샷이 중복 등록되어 복사). */
const SLOT_A = `${Date.UTC(2026, 11, 7, 1, 0)}-${Date.UTC(2026, 11, 7, 1, 30)}`
const SLOT_B = `${Date.UTC(2026, 11, 7, 1, 30)}-${Date.UTC(2026, 11, 7, 2, 0)}`
const EX_SLOT = `${Date.UTC(2026, 11, 9, 5, 0)}-${Date.UTC(2026, 11, 9, 5, 30)}`

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
  overlay: Record<string, unknown> = STRIP_PARITY_OVERLAY,
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

const COVERED = [
  'recruit.volunteer.interview.timeUnit',
  'recruit.volunteer.interview.interviewTimeRange',
  'recruit.volunteer.interview.selectedSlotKeys',
  'recruit.volunteer.interview.appliedUnavailableDates',
  'recruit.volunteer.interview.specificUnavailableDates',
  'recruit.volunteer.interview.exclusionState',
  'recruit.volunteer.interview.exception.1765000000000.exceptionDate',
  'recruit.volunteer.interview.exception.1765000000000.exceptionDateIso',
  'recruit.volunteer.interview.exception.1765000000000.selectedSlotKeys',
]
const NOT_COVERED = [
  'recruit.volunteer.interviewRequired',
  'recruit.volunteer.interviewMethod',
  'recruit.volunteer.interview.interviewTime',
  'recruit.volunteer.interview.exceptionDate',
  'recruit.volunteer.interview.exception.1765000000000.timeUnit',
  'recruit.volunteer.interview.exception.1765000000000.interviewTimeRange',
  'recruit.volunteer.selectedSlotKeys',
  'ujat.recruit.volunteer.interview.selectedSlotKeys',
]

describe('봉사 면접 overlay 키 — 생성 외 PATCH 에서 typed 가 덮는 키만 뺀다 (part5)', () => {
  it('덮는 키 판정', () => {
    for (const key of COVERED) expect(isTypedCoveredVolunteerInterviewOverlayKey(key)).toBe(true)
    for (const key of NOT_COVERED)
      expect(isTypedCoveredVolunteerInterviewOverlayKey(key)).toBe(false)
  })

  it('생성 본문은 면접 키를 그대로 보낸다(서버가 overlay 에서 면접 설정을 읽음)', () => {
    const overlay = overlayOf(
      mapGeneralProgramToCreateRequest(stripParityProgram()).serviceDetailJson
    )
    for (const key of COVERED) expect(overlay).toHaveProperty([key])
  })

  it('공통정보 PATCH·overlay PATCH·전체 PATCH 에는 덮는 키가 하나도 없고 나머지 면접 키는 남는다', () => {
    const baseline = stripParityProgram()
    const patches: Partial<Program>[] = [
      { generalCommonInfo: { sponsorManagerLine: 'B' } },
      { registrationOverlay: { ...STRIP_PARITY_OVERLAY } },
    ]
    const bodies = [
      ...patches.map(patch =>
        mapGeneralProgramToUpdateRequest({ ...baseline, ...patch }, patch, baseline, {
          overlayMerge: 'nested-ssot',
        })
      ),
      ...patches.map(patch =>
        mapGeneralProgramToUpdateRequest({ ...baseline, ...patch }, patch, baseline)
      ),
      mapGeneralProgramToUpdateRequest(baseline),
    ]
    for (const body of bodies) {
      const overlay = overlayOf(body.serviceDetailJson)
      expect(Object.keys(overlay).filter(isTypedCoveredVolunteerInterviewOverlayKey)).toEqual([])
      // part7: interview.interviewTime 은 typed interviewTimeRange[0] 와 같아 저장에서 뺀다. 면접 방식은 typed 에 없어 남긴다.
      expect(overlay).not.toHaveProperty('recruit.volunteer.interview.interviewTime')
      expect(overlay['recruit.volunteer.interviewMethod']).toBe('online')
    }
  })

  it('봉사 행이 없거나 반기 행뿐이면 그대로 보낸다', () => {
    for (const programRecruitments of [
      [{ id: 1, recruitmentType: 'PARTICIPANT' }],
      [{ id: 2, recruitmentType: 'VOLUNTEER', recruitTerm: 'FIRST_HALF' }],
    ] as Program['programRecruitments'][]) {
      const baseline = stripParityProgram(STRIP_PARITY_OVERLAY, { programRecruitments })
      const patch: Partial<Program> = { generalCommonInfo: { sponsorManagerLine: 'B' } }
      const overlay = overlayOf(
        mapGeneralProgramToUpdateRequest({ ...baseline, ...patch }, patch, baseline)
          .serviceDetailJson
      )
      for (const key of COVERED) expect(overlay).toHaveProperty([key])
    }
  })

  it('뺄 키가 없으면 같은 문자열을 돌려준다', () => {
    const json = JSON.stringify({ registration: { overlay: { a: 1 } } })
    expect(omitTypedVolunteerInterviewKeysFromServiceDetailJson(json)).toBe(json)
    expect(omitTypedVolunteerInterviewKeysFromServiceDetailJson('not json')).toBe('not json')
    expect(omitTypedVolunteerInterviewKeysFromServiceDetailJson(undefined)).toBeUndefined()
  })

  it('조회 — typed null(구 프로그램)이면 서버 overlay 면접 키를 그대로 읽는다(fallback 유지)', () => {
    const dto = {
      id: 990000,
      programType: 'GENERAL_ORGANIZATION',
      title: '[BOT-TEST-VOL] parity',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        registration: { overlay: STRIP_PARITY_OVERLAY },
      }),
      recruitments: [
        { id: 990001, recruitmentType: 'VOLUNTEER', interviewEnabled: true, interviewConfig: null },
      ],
    } as unknown as ProgramResponse
    const overlay = mapAdminProgramDetailToProgram(dto).registrationOverlay ?? {}
    for (const key of COVERED) expect(overlay[key]).toEqual(STRIP_PARITY_OVERLAY[key])
  })
})
