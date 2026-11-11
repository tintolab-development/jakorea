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
  buildVolunteerInterviewConfigForSave,
  completeVolunteerInterviewConfig,
  isTypedCoveredVolunteerInterviewOverlayKey,
} from '@/features/program/shared/lib/volunteer-interview-config'
import { buildGeneralProgramCreateFromWizardRhf } from './build-registration-create-from-rhf'
import { createDefaultRegistrationWizardUiValues } from './registration-wizard-ui-values'

/**
 * Part6 FE 수용 기준 — "프로그램 생성 시 VOLUNTEER interviewConfig 만으로 일정이 채워지고,
 * overlay 면접 키 없이도 생성 가능하다" / "프로그램 PATCH 에 overlay 면접 키를 다시 넣지 않는다".
 * 회귀 — GENERAL_ORGANIZATION / GENERAL_INDIVIDUAL 봉사 면접 ON/OFF.
 */

const SLOT = (d: number, h: number, m: number) =>
  `${Date.UTC(2026, 11, d, h, m)}-${Date.UTC(2026, 11, d, h, m + 30)}`

const ON_OVERLAY: Record<string, unknown> = {
  'recruit.volunteer.interviewRequired': 'yes',
  'recruit.volunteer.interviewMethod': 'online',
  'recruit.volunteer.interview.timeUnit': '30',
  'recruit.volunteer.interview.interviewTimeRange': [
    '2026-12-11T01:00:00.000Z',
    '2026-12-11T06:00:00.000Z',
  ],
  'recruit.volunteer.interview.selectedSlotKeys': [SLOT(11, 1, 0), SLOT(11, 1, 30)],
  'recruit.volunteer.interview.appliedUnavailableDates': ['2026-12-15'],
  'recruit.volunteer.interview.exclusionState': {
    excludeNone: false,
    excludeSaturday: true,
    excludeSunday: true,
    excludeHoliday: false,
  },
  'recruit.volunteer.interview.exception.1765000000000.exceptionDate': '2026-12-13T15:00:00.000Z',
  'recruit.volunteer.interview.exception.1765000000000.selectedSlotKeys': [SLOT(14, 5, 0)],
  'recruit.volunteer.interview.exception.1765000000000.timeUnit': '30',
  'recruit.volunteer.interview.exception.1765000000000.interviewTimeRange': [
    '2026-12-14T05:00:00.000Z',
    '2026-12-14T06:00:00.000Z',
  ],
}
const OFF_OVERLAY: Record<string, unknown> = { 'recruit.volunteer.interviewRequired': 'no' }

type Kind = 'GENERAL_ORGANIZATION' | 'GENERAL_INDIVIDUAL'

function program(kind: Kind, overlay: Record<string, unknown>, interviewOn: boolean): Program {
  const individual = kind === 'GENERAL_INDIVIDUAL'
  return {
    id: 'local-create',
    title: '[BOT-TEST-VOL] create',
    type: 'offline',
    format: 'workshop',
    category: individual ? 'individual' : 'school',
    sponsorId: 's1',
    status: 'pending',
    lifecycleStatus: 'recruiting_volunteers',
    rounds: [],
    startDate: '2026-12-01',
    endDate: '2027-02-28',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    generalProgramAudience: individual ? 'individual' : 'organization',
    generalParticipantTypes: [individual ? 'individual' : 'school_institution', 'volunteer'],
    generalVolunteerInterviewEnabled: interviewOn,
    registrationOverlay: overlay,
    programRecruitments: [
      {
        recruitmentType: 'PARTICIPANT',
        applicationType: individual ? 'INDIVIDUAL' : 'ORGANIZATION',
      },
      { recruitmentType: 'VOLUNTEER', applicationType: 'VOLUNTEER', targetType: 'COLLEGE_STUDENT' },
    ],
  } as Program
}

function overlayOf(serviceDetailJson: string | undefined): Record<string, unknown> {
  return (
    (
      JSON.parse(serviceDetailJson ?? '{}') as {
        registration?: { overlay?: Record<string, unknown> }
      }
    ).registration?.overlay ?? {}
  )
}

type Row = { recruitmentType?: string; interviewConfig?: unknown; interviewEnabled?: boolean }

describe.each<Kind>(['GENERAL_ORGANIZATION', 'GENERAL_INDIVIDUAL'])('%s 생성 본문', kind => {
  it('면접 ON — 봉사 행 interviewConfig(전체 객체), typed 가 덮는 overlay 면접 키 없음', () => {
    const body = mapGeneralProgramToCreateRequest(program(kind, ON_OVERLAY, true))
    expect(body.programType).toBe(kind)
    const rows = (body.recruitments ?? []) as Row[]
    const volunteer = rows.find(r => r.recruitmentType === 'VOLUNTEER')
    // part8: 생성도 전체 객체(빈 배열·null 명시) — BE interviewConfig 는 통째 교체
    expect(volunteer?.interviewConfig).toEqual(
      completeVolunteerInterviewConfig(buildVolunteerInterviewConfigForSave(ON_OVERLAY))
    )
    expect(volunteer?.interviewConfig).toMatchObject({
      schemaVersion: 1,
      appliedUnavailableDates: ['2026-12-15'],
      timeUnit: 30,
      exceptions: [
        { id: '1765000000000', exceptionDate: '2026-12-14', selectedSlotKeys: [SLOT(14, 5, 0)] },
      ],
    })
    expect(
      rows.filter(r => r.recruitmentType !== 'VOLUNTEER').every(r => !('interviewConfig' in r))
    ).toBe(true)
    const overlay = overlayOf(body.serviceDetailJson)
    expect(Object.keys(overlay).filter(isTypedCoveredVolunteerInterviewOverlayKey)).toEqual([])
    // typed 가 덮지 않는 키는 그대로
    expect(overlay['recruit.volunteer.interviewMethod']).toBe('online')
    expect(overlay['recruit.volunteer.interview.exception.1765000000000.timeUnit']).toBe('30')
  })

  it('면접 OFF — 명시적 빈 typed 전체 객체(빈 배열·null)', () => {
    const body = mapGeneralProgramToCreateRequest(program(kind, OFF_OVERLAY, false))
    const volunteer = ((body.recruitments ?? []) as Row[]).find(
      r => r.recruitmentType === 'VOLUNTEER'
    )
    expect(volunteer?.interviewConfig).toEqual({
      schemaVersion: 1,
      selectedSlotKeys: [],
      timeUnit: null,
      interviewTimeRange: [],
      specificUnavailableDates: [],
      appliedUnavailableDates: [],
      exclusionState: null,
      exceptions: [],
    })
    expect(
      Object.keys(overlayOf(body.serviceDetailJson)).filter(k =>
        k.startsWith('recruit.volunteer.interview.')
      )
    ).toEqual([])
  })

  it('생성 후 GET(typed 저장·overlay 면접 키 없음) → 편집 overlay 는 typed 값, 일정 표시는 서버 객체', () => {
    const body = mapGeneralProgramToCreateRequest(program(kind, ON_OVERLAY, true))
    const sent = ((body.recruitments ?? []) as Row[]).find(r => r.recruitmentType === 'VOLUNTEER')!
      .interviewConfig as Record<string, unknown>
    const savedOverlay = overlayOf(body.serviceDetailJson)
    const dto = {
      id: 990000,
      programType: kind,
      title: '[BOT-TEST-VOL] create',
      startDate: '2026-12-01',
      endDate: '2027-02-28',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        generalCommonInfo: {
          volunteerInterviewScheduleInfo: {
            availableTimeSlots: '10:00 ~ 10:30, 10:30 ~ 11:00',
            specificUnavailableDateIsos: ['2026-12-15'],
            recurringUnavailable: '토요일, 일요일',
          },
        },
        registration: { overlay: savedOverlay },
      }),
      recruitments: [
        { id: 2, recruitmentType: 'PARTICIPANT', interviewConfig: null },
        {
          id: 1,
          recruitmentType: 'VOLUNTEER',
          applicationType: 'VOLUNTEER',
          interviewEnabled: true,
          interviewConfig: {
            ...sent,
            interviewTimeRange: ['2026-12-11T01:00:00Z', '2026-12-11T06:00:00Z'],
          },
        },
      ],
    } as unknown as ProgramResponse
    const mapped = mapAdminProgramDetailToProgram(dto)
    const overlay = mapped.registrationOverlay ?? {}
    expect(overlay['recruit.volunteer.interview.appliedUnavailableDates']).toEqual(['2026-12-15'])
    expect(overlay['recruit.volunteer.interview.selectedSlotKeys']).toEqual([
      SLOT(11, 1, 0),
      SLOT(11, 1, 30),
    ])
    expect(mapped.volunteerInterviewScheduleInfoFromServer?.specificUnavailableDateIsos).toEqual([
      '2026-12-15',
    ])
    // 이어지는 프로그램 PATCH 도 overlay 면접 키를 다시 넣지 않는다
    const patch: Partial<Program> = { registrationOverlay: overlay }
    const update = mapGeneralProgramToUpdateRequest({ ...mapped, ...patch }, patch, mapped)
    expect(
      Object.keys(overlayOf(update.serviceDetailJson)).filter(
        isTypedCoveredVolunteerInterviewOverlayKey
      )
    ).toEqual([])
  })

  it('봉사 행에 발표·면접 유형·봉사 대상 상세를 싣는다 — BE 알림 #{면접 유형}이 행 값을 읽는다', () => {
    const overlay = {
      ...ON_OVERLAY,
      'recruit.volunteer.interviewMethod': '오프라인',
      'recruit.volunteer.docDeadlineIso': '2026-12-05T01:00:00.000Z',
      'recruit.volunteer.docAnnounceMethod': '홈페이지 공지',
      'recruit.volunteer.finalAnnounceIso': '2026-12-20T01:00:00.000Z',
      'recruit.volunteer.finalAnnounceMethod': '개별 연락',
    }
    const body = mapGeneralProgramToCreateRequest({
      ...program(kind, overlay, true),
      volunteerTargetDetail: '대학(원)생',
    })
    const volunteer = (body.recruitments ?? []).find(r => r.recruitmentType === 'VOLUNTEER')
    expect(volunteer).toMatchObject({
      interviewMethod: '오프라인',
      documentPassAnnouncementAt: '2026-12-05T01:00:00.000Z',
      documentPassAnnouncementMethod: '홈페이지 공지',
      finalPassAnnouncementAt: '2026-12-20T01:00:00.000Z',
      finalPassAnnouncementMethod: '개별 연락',
      volunteerTargetDetail: '대학(원)생',
    })
  })

  it('면접 OFF — 면접 유형·서류 발표는 싣지 않고 최종 발표·봉사 대상 상세만 싣는다', () => {
    const overlay = {
      ...OFF_OVERLAY,
      'recruit.volunteer.interviewMethod': '오프라인',
      'recruit.volunteer.docAnnounceMethod': '홈페이지 공지',
      'recruit.volunteer.finalAnnounceMethod': '개별 연락',
    }
    const body = mapGeneralProgramToCreateRequest({
      ...program(kind, overlay, false),
      volunteerTargetDetail: '대학(원)생',
    })
    const volunteer = (body.recruitments ?? []).find(r => r.recruitmentType === 'VOLUNTEER')
    expect(volunteer).toMatchObject({
      finalPassAnnouncementMethod: '개별 연락',
      volunteerTargetDetail: '대학(원)생',
    })
    expect(volunteer).not.toHaveProperty('interviewMethod')
    expect(volunteer).not.toHaveProperty('documentPassAnnouncementMethod')
  })

  it('overlay 에 없으면 모집 탭 nested 값을 쓴다', () => {
    const base = program(kind, ON_OVERLAY, true)
    const body = mapGeneralProgramToCreateRequest({
      ...base,
      registrationOverlay: { ...ON_OVERLAY, 'recruit.volunteer.interviewMethod': undefined },
      generalCommonInfo: {
        ...base.generalCommonInfo,
        volunteerRecruitmentInfo: { interviewMethod: '온라인', finalPassAnnouncementMethod: '문자' },
      },
    } as Program)
    const volunteer = (body.recruitments ?? []).find(r => r.recruitmentType === 'VOLUNTEER')
    expect(volunteer).toMatchObject({ interviewMethod: '온라인', finalPassAnnouncementMethod: '문자' })
  })
})

describe('생성 — interviewConfig 를 넣지 않는 경우', () => {
  it('봉사 행이 없으면 interviewConfig 없음, overlay 면접 키도 그대로(봉사 typed 대상 아님)', () => {
    const base = program('GENERAL_ORGANIZATION', ON_OVERLAY, true)
    const body = mapGeneralProgramToCreateRequest({
      ...base,
      generalParticipantTypes: ['school_institution'],
      programRecruitments: [{ recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION' }],
    } as Program)
    const rows = (body.recruitments ?? []) as Row[]
    expect(rows.some(r => r.recruitmentType === 'VOLUNTEER')).toBe(false)
    expect(rows.every(r => !('interviewConfig' in r))).toBe(true)
    expect(
      overlayOf(body.serviceDetailJson)['recruit.volunteer.interview.appliedUnavailableDates']
    ).toEqual(['2026-12-15'])
  })

  it('typed null 구 프로그램 조회 — overlay 그대로(읽기 fallback 유지)', () => {
    const mapped = mapAdminProgramDetailToProgram({
      id: 990001,
      programType: 'GENERAL_ORGANIZATION',
      title: 'old',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        registration: { overlay: ON_OVERLAY },
      }),
      recruitments: [{ id: 1, recruitmentType: 'VOLUNTEER', interviewConfig: null }],
    } as unknown as ProgramResponse)
    expect(mapped.registrationOverlay).toEqual(expect.objectContaining(ON_OVERLAY))
  })
})

describe('위저드 RHF 생성 경로(buildGeneralProgramCreateFromWizardRhf)', () => {
  it('봉사 면접 ON — create body 봉사 행 interviewConfig, overlay 면접 키 9종 없음', () => {
    const values = createDefaultRegistrationWizardUiValues({
      programType: 'curriculum',
      sessionRoundType: 'single',
      curriculumChartSessionCount: 1,
      participant: {
        individual: false,
        organization: true,
        teacherInstructor: false,
        volunteer: true,
      },
    })
    const RANGE = { start: '2026-11-30T15:00:00.000Z', end: '2026-12-20T14:59:59.999Z' }
    const ui = {
      ...values,
      programTitleKo: '[BOT-TEST-VOL] wizard',
      recruitmentKv: {
        'recruit.recruitRangeSeal': RANGE,
        'recruit.programRangeSeal': RANGE,
        'recruit.volunteer.recruitRangeSeal': RANGE,
        'recruit.volunteer.programRangeSeal': RANGE,
        'recruit.volunteer.volunteerTargets': ['university'],
        'recruit.volunteer.interviewRequired': 'yes',
        'recruit.volunteer.interviewMethod': 'online',
        'recruit.volunteer.interviewRangeSeal': {
          start: '2026-12-10T15:00:00.000Z',
          end: '2026-12-17T14:59:59.999Z',
        },
        'recruit.volunteer.interview.timeUnit': '30',
        'recruit.volunteer.interview.interviewTimeRange': [
          '2026-12-11T01:00:00.000Z',
          '2026-12-11T06:00:00.000Z',
        ],
        'recruit.volunteer.interview.selectedSlotKeys': [SLOT(11, 1, 0)],
        'recruit.volunteer.interview.appliedUnavailableDates': ['2026-12-15'],
        'recruit.volunteer.interview.exclusionState': {
          excludeNone: false,
          excludeSaturday: true,
          excludeSunday: true,
          excludeHoliday: false,
        },
      },
    } as typeof values
    const built = buildGeneralProgramCreateFromWizardRhf({ id: 'local-wizard', uiValues: ui })
    const body = built.createRequest
    const volunteer = ((body.recruitments ?? []) as Row[]).find(
      r => r.recruitmentType === 'VOLUNTEER'
    )
    expect(volunteer?.interviewConfig).toMatchObject({
      schemaVersion: 1,
      appliedUnavailableDates: ['2026-12-15'],
      selectedSlotKeys: [SLOT(11, 1, 0)],
      timeUnit: 30,
      exclusionState: { excludeSaturday: true, excludeSunday: true, excludeHoliday: false },
    })
    const overlay = overlayOf(body.serviceDetailJson)
    expect(Object.keys(overlay).filter(isTypedCoveredVolunteerInterviewOverlayKey)).toEqual([])
    // part7: 면접 여부는 봉사 행 interviewEnabled 로 보낸다(overlay interviewRequired 없음)
    expect(overlay).not.toHaveProperty('recruit.volunteer.interviewRequired')
    expect(volunteer?.interviewEnabled).toBe(true)
    expect(body.autoApplyDefaultFormBindings).toBe(true)
  })
})
