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
  buildProgramRecruitmentRowSaveRequest,
  type ProgramRecruitmentRowSaveRequest,
} from '@/features/program/shared/lib/persist-recruitment-row-save'

/**
 * Part8(keonhee 2026-10-25 22:2x, bbcaa52b9 코드 확인) 전 parity — ff30a9743 에서 만든 스냅샷.
 * - 구 GENERAL 모양: 봉사 행 interviewStartAt/EndAt null, nested volunteerRecruitmentInfo 에 면접 기간
 *   → 조회 Program 의 nested 기간, 모집 탭 행 PATCH·nested 스냅샷 PATCH·공통 PATCH·전체 PATCH 의 면접 기간
 * - interviewConfig 를 싣는 경로(생성·모집 행 PATCH)의 객체 모양 — overlay 가 일부 키만 가진 경우 포함
 */

const SLOT_A = `${Date.UTC(2026, 11, 7, 1, 0)}-${Date.UTC(2026, 11, 7, 1, 30)}`
const SLOT_B = `${Date.UTC(2026, 11, 7, 1, 30)}-${Date.UTC(2026, 11, 7, 2, 0)}`
const EX_SLOT = `${Date.UTC(2026, 11, 8, 1, 0)}-${Date.UTC(2026, 11, 8, 1, 30)}`
const START = '2026-12-06T15:00:00.000Z'
const END = '2026-12-20T14:59:59.999Z'

const STORED_TYPED = {
  schemaVersion: 1,
  selectedSlotKeys: [SLOT_A, SLOT_B],
  timeUnit: 30,
  interviewTimeRange: ['2026-12-07T01:00:00Z', '2026-12-07T03:00:00Z'],
  specificUnavailableDates: ['2026-12-15'],
  appliedUnavailableDates: ['2026-12-10', '2026-12-15'],
  exclusionState: { excludeSaturday: true, excludeSunday: true, excludeHoliday: true },
  exceptions: [{ id: '1793000000000', exceptionDate: '2026-12-08', selectedSlotKeys: [EX_SLOT] }],
}

const OVERLAY: Record<string, unknown> = {
  'recruit.volunteer.interviewRequired': 'yes',
  'recruit.volunteer.interviewMethod': 'online',
  'recruit.volunteer.interviewRangeSeal': { start: START, end: END },
  'recruit.volunteer.interviewAnchorIso': START,
  'recruit.volunteer.interview.exception.1793000000000.timeUnit': '30',
  'recruit.volunteer.interview.exception.1793000000000.interviewTimeRange': [
    '2026-12-08T01:00:00.000Z',
    '2026-12-08T02:00:00.000Z',
  ],
}

function dto(args: {
  overlay?: Record<string, unknown>
  interviewConfig?: unknown
  rowStart?: string | null
  rowEnd?: string | null
}): ProgramResponse {
  return {
    id: 990000,
    programType: 'GENERAL_ORGANIZATION',
    title: '[BOT-TEST-VOL] parity8',
    startDate: '2026-12-01',
    endDate: '2027-02-28',
    serviceDetailJson: JSON.stringify({
      schemaVersion: 1,
      generalParticipantTypes: ['school_institution', 'volunteer'],
      generalVolunteerInterviewEnabled: true,
      generalCommonInfo: {
        sponsorManagerLine: 'A',
        volunteerRecruitmentInfo: {
          volunteerInterviewEnabled: true,
          interviewMethod: 'online',
          interviewStartDate: START,
          interviewEndDate: END,
        },
        volunteerInterviewScheduleInfo: {
          periodStartDate: '2026-12-07',
          periodEndDate: '2026-12-20',
          specificUnavailableDateIsos: ['2026-12-15'],
        },
      },
      registration: { overlay: args.overlay ?? OVERLAY },
    }),
    recruitments: [
      { id: 2, recruitmentType: 'PARTICIPANT', targetType: 'ORGANIZATION', interviewConfig: null },
      {
        id: 1,
        recruitmentType: 'VOLUNTEER',
        targetType: 'COLLEGE_STUDENT',
        applicationType: 'VOLUNTEER',
        startAt: '2026-10-31T15:00:00Z',
        endAt: '2026-11-20T14:59:59.999Z',
        interviewEnabled: true,
        interviewStartAt: args.rowStart === undefined ? null : args.rowStart,
        interviewEndAt: args.rowEnd === undefined ? null : args.rowEnd,
        interviewConfig: args.interviewConfig === undefined ? STORED_TYPED : args.interviewConfig,
      },
    ],
  } as unknown as ProgramResponse
}

function nestedPeriod(json: string | null | undefined) {
  const s = (json ? JSON.parse(json) : {}) as {
    generalCommonInfo?: {
      volunteerRecruitmentInfo?: Record<string, unknown>
      volunteerInterviewScheduleInfo?: Record<string, unknown>
    }
    registration?: { overlay?: Record<string, unknown> }
  }
  const info = s.generalCommonInfo?.volunteerRecruitmentInfo ?? {}
  const schedule = s.generalCommonInfo?.volunteerInterviewScheduleInfo
  return {
    hasStart: Object.prototype.hasOwnProperty.call(info, 'interviewStartDate'),
    interviewStartDate: info.interviewStartDate,
    hasEnd: Object.prototype.hasOwnProperty.call(info, 'interviewEndDate'),
    interviewEndDate: info.interviewEndDate,
    schedulePeriod: schedule ? [schedule.periodStartDate, schedule.periodEndDate] : undefined,
    seal: s.registration?.overlay?.['recruit.volunteer.interviewRangeSeal'],
  }
}

function rowFields(body: ProgramRecruitmentRowSaveRequest | null) {
  return {
    has: {
      interviewStartAt: body != null && 'interviewStartAt' in body,
      interviewEndAt: body != null && 'interviewEndAt' in body,
      interviewConfig: body != null && 'interviewConfig' in body,
    },
    interviewStartAt: body?.interviewStartAt,
    interviewEndAt: body?.interviewEndAt,
    clearFields: body?.clearFields,
    interviewConfig: body?.interviewConfig,
  }
}

const oldGeneral = () => mapAdminProgramDetailToProgram(dto({}))

describe('면접 기간 null 보존 parity (part8) — 구 GENERAL 모양(행 null, nested 기간 있음)', () => {
  it('조회 Program — nested 기간·Program 면접 기간', () => {
    const p = oldGeneral()
    expect({
      nested: [
        p.generalCommonInfo?.volunteerRecruitmentInfo?.interviewStartDate,
        p.generalCommonInfo?.volunteerRecruitmentInfo?.interviewEndDate,
      ],
      program: [p.interviewStartDate, p.interviewEndDate],
    }).toMatchSnapshot()
  })
  it('모집 탭 행 PATCH — patch 에 면접 기간 없음', () => {
    const p = oldGeneral()
    expect(
      rowFields(
        buildProgramRecruitmentRowSaveRequest({
          baseline: p,
          draft: p,
          patch: { generalVolunteers: 3 },
          audience: 'volunteer',
        })
      )
    ).toMatchSnapshot()
  })
  it("모집 탭 행 PATCH — 폼이 '' 기간을 보냄", () => {
    const p = oldGeneral()
    expect(
      rowFields(
        buildProgramRecruitmentRowSaveRequest({
          baseline: p,
          draft: p,
          patch: { interviewStartDate: '', interviewEndDate: '' },
          audience: 'volunteer',
        })
      )
    ).toMatchSnapshot()
  })
  it('모집 탭 뒤 nested 스냅샷 PATCH', () => {
    expect(
      nestedPeriod(buildGeneralRecruitmentNestedSnapshotServiceDetailJson(oldGeneral()))
    ).toMatchSnapshot()
  })
  it('공통정보형 PATCH', () => {
    const existing = oldGeneral()
    const patch: Partial<Program> = {
      generalCommonInfo: existing.generalCommonInfo,
      registrationOverlay: existing.registrationOverlay,
    }
    expect(
      nestedPeriod(
        mapGeneralProgramToUpdateRequest({ ...existing, ...patch }, patch, existing)
          .serviceDetailJson
      )
    ).toMatchSnapshot()
  })
  it('전체 PATCH(patch 없음)', () => {
    expect(
      nestedPeriod(mapGeneralProgramToUpdateRequest(oldGeneral()).serviceDetailJson)
    ).toMatchSnapshot()
  })
})

describe('interviewConfig 객체 parity (part8)', () => {
  it('모집 행 PATCH — overlay 에 면접 설정 키 없음(저장 typed 있음)', () => {
    const p = oldGeneral()
    expect(
      rowFields(
        buildProgramRecruitmentRowSaveRequest({
          baseline: p,
          draft: p,
          patch: { registrationOverlay: { 'recruit.volunteer.interviewMethod': 'offline' } },
          audience: 'volunteer',
        })
      ).interviewConfig
    ).toMatchSnapshot()
  })
  it('모집 행 PATCH — overlay 에 불가일 키만 있음', () => {
    const p = oldGeneral()
    expect(
      rowFields(
        buildProgramRecruitmentRowSaveRequest({
          baseline: p,
          draft: p,
          patch: {
            registrationOverlay: {
              'recruit.volunteer.interview.appliedUnavailableDates': ['2026-12-11'],
            },
          },
          audience: 'volunteer',
        })
      ).interviewConfig
    ).toMatchSnapshot()
  })
  it('모집 행 PATCH — 조회 overlay 전체(typed 반영) + 불가일 변경', () => {
    const p = oldGeneral()
    expect(
      rowFields(
        buildProgramRecruitmentRowSaveRequest({
          baseline: p,
          draft: p,
          patch: {
            registrationOverlay: {
              ...p.registrationOverlay,
              'recruit.volunteer.interview.appliedUnavailableDates': ['2026-12-10', '2026-12-11'],
            },
          },
          audience: 'volunteer',
        })
      ).interviewConfig
    ).toMatchSnapshot()
  })
  it('모집 행 PATCH — typed 없는 구 프로그램(legacy 접두사 없는 overlay) + 불가일만 변경', () => {
    const p = mapAdminProgramDetailToProgram(
      dto({
        interviewConfig: null,
        overlay: {
          ...OVERLAY,
          'recruit.volunteer.selectedSlotKeys': [SLOT_A],
          'recruit.volunteer.timeUnit': '30',
        },
      })
    )
    expect(
      rowFields(
        buildProgramRecruitmentRowSaveRequest({
          baseline: p,
          draft: p,
          patch: {
            registrationOverlay: {
              ...p.registrationOverlay,
              'recruit.volunteer.interview.appliedUnavailableDates': ['2026-12-11'],
            },
          },
          audience: 'volunteer',
        })
      ).interviewConfig
    ).toMatchSnapshot()
  })
  it('생성 — 면접 ON/OFF 봉사 행 interviewConfig', () => {
    const base = oldGeneral()
    const program = (overlay: Record<string, unknown>, on: boolean): Program => ({
      ...base,
      id: 'local-p8',
      programRecruitments: [],
      generalVolunteerInterviewEnabled: on,
      registrationOverlay: overlay,
    })
    const vol = (body: { recruitments?: unknown }) =>
      ((body.recruitments ?? []) as Array<Record<string, unknown>>).find(
        r => r.recruitmentType === 'VOLUNTEER'
      )?.interviewConfig
    expect({
      on: vol(
        mapGeneralProgramToCreateRequest(
          program(
            {
              ...OVERLAY,
              'recruit.volunteer.interview.selectedSlotKeys': [SLOT_A],
              'recruit.volunteer.interview.timeUnit': '30',
            },
            true
          )
        )
      ),
      off: vol(
        mapGeneralProgramToCreateRequest(
          program({ 'recruit.volunteer.interviewRequired': 'no' }, false)
        )
      ),
    }).toMatchSnapshot()
  })
})
