/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  mapGeneralProgramToCreateRequest,
  mapGeneralProgramToUpdateRequest,
} from '@/features/program/general/api/adapters/general-program-adapters'

/**
 * Part5 봉사 면접 overlay 키 전송 중단 전 parity — 13750a7c9에서 만든 스냅샷.
 * 생성 본문은 그대로, 생성 외 프로그램 PATCH 본문은 typed `interviewConfig` 가 덮는 면접 키만 빠져야 한다.
 */

const SLOT_A = `${Date.UTC(2026, 11, 7, 1, 0)}-${Date.UTC(2026, 11, 7, 1, 30)}`
const SLOT_B = `${Date.UTC(2026, 11, 7, 1, 30)}-${Date.UTC(2026, 11, 7, 2, 0)}`
const EX_SLOT = `${Date.UTC(2026, 11, 9, 5, 0)}-${Date.UTC(2026, 11, 9, 5, 30)}`

export const STRIP_PARITY_OVERLAY: Record<string, unknown> = {
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

export function stripParityProgram(
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

export function overlayOf(serviceDetailJson: string | null | undefined): Record<string, unknown> {
  if (!serviceDetailJson) return {}
  const parsed = JSON.parse(serviceDetailJson) as { registration?: { overlay?: unknown } }
  return (parsed.registration?.overlay as Record<string, unknown>) ?? {}
}

describe('봉사 면접 overlay 키 전송 parity (part5)', () => {
  it('생성 본문 serviceDetailJson', () => {
    expect(
      mapGeneralProgramToCreateRequest(stripParityProgram()).serviceDetailJson
    ).toMatchSnapshot('create-service-detail')
  })

  it('공통정보 PATCH(nested-ssot) 본문', () => {
    const baseline = stripParityProgram()
    const patch: Partial<Program> = { generalCommonInfo: { sponsorManagerLine: 'B' } }
    const body = mapGeneralProgramToUpdateRequest({ ...baseline, ...patch }, patch, baseline, {
      overlayMerge: 'nested-ssot',
    })
    expect(body).toMatchSnapshot('patch-common-info-nested-ssot')
  })

  it('overlay PATCH(legacy-merge) 본문', () => {
    const baseline = stripParityProgram()
    const overlay = {
      ...STRIP_PARITY_OVERLAY,
      'generalRegistration.basicInfo.educationVenueDetail': '별관',
    }
    const patch: Partial<Program> = { registrationOverlay: overlay }
    const body = mapGeneralProgramToUpdateRequest({ ...baseline, ...patch }, patch, baseline)
    expect(body.serviceDetailJson).toMatchSnapshot('patch-overlay-legacy-merge')
  })

  it('patch 없는 전체 PATCH 본문 serviceDetailJson', () => {
    expect(
      mapGeneralProgramToUpdateRequest(stripParityProgram()).serviceDetailJson
    ).toMatchSnapshot('update-full-service-detail')
  })

  it('봉사 행 없는 프로그램 PATCH 본문 serviceDetailJson', () => {
    const baseline = stripParityProgram(STRIP_PARITY_OVERLAY, {
      programRecruitments: [
        { id: 990002, recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION' },
      ] as Program['programRecruitments'],
    })
    const patch: Partial<Program> = { generalCommonInfo: { sponsorManagerLine: 'B' } }
    const body = mapGeneralProgramToUpdateRequest({ ...baseline, ...patch }, patch, baseline)
    expect(body.serviceDetailJson).toMatchSnapshot('patch-no-volunteer-row')
  })
})
