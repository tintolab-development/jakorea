/**
 * Part8(keonhee 2026-10-25) — 구 GENERAL 봉사 행 면접 기간 null 보존 + interviewConfig 전체 객체 저장.
 * - 행 interviewStartAt/EndAt 이 null 이면 nested 기간을 '' 로 바꾸지 않고, 저장 본문에 ''·null 기간을 보내지 않는다.
 * - 행 PATCH interviewConfig 는 BE 에서 객체 단위 교체 — 저장 typed + 폼 변경을 합친 전체 객체만 보낸다.
 */
import { describe, expect, it, vi } from 'vitest'
import type { Program, ProgramRecruitmentWindow } from '@/types/domain'
import { hydrateRecruitmentWindowsOntoProgram } from './hydrate-recruitment-windows'
import { buildProgramRecruitmentRowSaveRequest } from './persist-recruitment-row-save'
import {
  buildVolunteerInterviewConfigForRowSave,
  completeVolunteerInterviewConfig,
  type RecruitmentInterviewConfig,
} from './volunteer-interview-config'
import { omitEmptyVolunteerInterviewPeriod } from '@/features/program/general/lib/general-program-service-detail-json'
import { buildGeneralRecruitmentNestedSnapshotServiceDetailJson } from '@/features/program/general/lib/persist-recruitment-nested-snapshot'
import { resolveGeneralProgramVolunteerRecruitmentDisplay } from '@/features/program/general/lib/volunteer-recruitment-display'

vi.mock('@/features/program/shared/api/program-recruitment-rows', () => ({
  patchProgramRecruitment: vi.fn(async () => ({ id: 186808 })),
}))

const NESTED_START = '2026-12-06T15:00:00.000Z'
const NESTED_END = '2026-12-20T14:59:59.999Z'
const P = 'recruit.volunteer.interview'
const SLOT_A = '1796605200000-1796607000000'
const SLOT_B = '1796607000000-1796608800000'

const STORED: RecruitmentInterviewConfig = {
  schemaVersion: 1,
  selectedSlotKeys: [SLOT_A, SLOT_B],
  timeUnit: 30,
  interviewTimeRange: ['2026-12-07T01:00:00Z', '2026-12-07T03:00:00Z'],
  specificUnavailableDates: ['2026-12-15'],
  appliedUnavailableDates: ['2026-12-10', '2026-12-15'],
  exclusionState: { excludeSaturday: true, excludeSunday: true, excludeHoliday: true },
  exceptions: [{ id: '1793000000000', exceptionDate: '2026-12-08', selectedSlotKeys: [SLOT_A] }],
}

function volunteerRow(overrides: Partial<ProgramRecruitmentWindow> = {}): ProgramRecruitmentWindow {
  return {
    id: 186808,
    recruitmentType: 'VOLUNTEER',
    applicationType: 'VOLUNTEER',
    targetType: 'COLLEGE_STUDENT',
    startAt: '2026-11-30T15:00:00.000Z',
    endAt: '2026-12-05T14:59:59.999Z',
    operationStartDate: '2026-12-01',
    operationEndDate: '2027-02-28',
    recruitTerm: null,
    interviewEnabled: true,
    interviewStartAt: null,
    interviewEndAt: null,
    ...overrides,
  } as ProgramRecruitmentWindow
}

function program(
  row: ProgramRecruitmentWindow = volunteerRow(),
  extra: Partial<Program> = {}
): Program {
  return {
    id: '186384',
    title: '[BOT-TEST-VOL] null row',
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
    generalCommonInfo: {
      volunteerRecruitmentInfo: {
        volunteerInterviewEnabled: true,
        interviewStartDate: NESTED_START,
        interviewEndDate: NESTED_END,
      },
    },
    programRecruitments: [row],
    volunteerInterviewConfigFromServer: STORED,
    ...extra,
  } as Program
}

describe('hydrate — 행 면접 기간 null 은 nested 를 지우지 않는다', () => {
  it('행 null → nested 기간 유지(빈 문자열로 바꾸지 않음)', () => {
    const out = hydrateRecruitmentWindowsOntoProgram(program())
    const info = out.generalCommonInfo?.volunteerRecruitmentInfo
    expect(info?.interviewStartDate).toBe(NESTED_START)
    expect(info?.interviewEndDate).toBe(NESTED_END)
    expect(info?.volunteerInterviewEnabled).toBe(true)
  })

  it("행 '' 도 nested 유지", () => {
    const out = hydrateRecruitmentWindowsOntoProgram(
      program(volunteerRow({ interviewStartAt: '', interviewEndAt: '  ' }))
    )
    expect(out.generalCommonInfo?.volunteerRecruitmentInfo?.interviewStartDate).toBe(NESTED_START)
    expect(out.generalCommonInfo?.volunteerRecruitmentInfo?.interviewEndDate).toBe(NESTED_END)
  })

  it('행 값이 있으면 행 값이 nested 를 덮는다(대조 186386)', () => {
    const out = hydrateRecruitmentWindowsOntoProgram(
      program(
        volunteerRow({
          interviewStartAt: '2026-12-09T15:00:00.000Z',
          interviewEndAt: '2026-12-18T14:59:59.999Z',
        })
      )
    )
    expect(out.generalCommonInfo?.volunteerRecruitmentInfo?.interviewStartDate).toBe(
      '2026-12-09T15:00:00.000Z'
    )
    expect(out.generalCommonInfo?.volunteerRecruitmentInfo?.interviewEndDate).toBe(
      '2026-12-18T14:59:59.999Z'
    )
  })
})

describe('omitEmptyVolunteerInterviewPeriod', () => {
  it("''·null nested·일정 기간은 키째 뺀다(생략 = BE deep merge 유지)", () => {
    const out = omitEmptyVolunteerInterviewPeriod({
      volunteerRecruitmentInfo: {
        volunteerInterviewEnabled: true,
        interviewStartDate: '',
        interviewEndDate: null as unknown as string,
      },
      volunteerInterviewScheduleInfo: {
        availableTimeSlots: '10:00 ~ 10:30',
        periodStartDate: ' ',
        periodEndDate: '2026-12-20',
      },
    } as Program['generalCommonInfo'])
    expect(out?.volunteerRecruitmentInfo).toEqual({ volunteerInterviewEnabled: true })
    expect(out?.volunteerInterviewScheduleInfo).toEqual({
      availableTimeSlots: '10:00 ~ 10:30',
      periodEndDate: '2026-12-20',
    })
    expect(JSON.stringify(out)).not.toContain('null')
  })

  it('값이 있으면 같은 객체를 그대로 돌려준다', () => {
    const common = {
      volunteerRecruitmentInfo: { interviewStartDate: NESTED_START, interviewEndDate: NESTED_END },
    } as Program['generalCommonInfo']
    expect(omitEmptyVolunteerInterviewPeriod(common)).toBe(common)
    expect(omitEmptyVolunteerInterviewPeriod(undefined)).toBeUndefined()
  })
})

describe('행 PATCH 면접 기간', () => {
  it("일반 봉사 null 행 + 폼 '' 기간 → 보내지 않는다", () => {
    const p = program()
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: p,
      draft: p,
      patch: { interviewStartDate: '', interviewEndDate: '' },
      audience: 'volunteer',
    }) as unknown as Record<string, unknown>
    expect(body.interviewStartAt).toBeUndefined()
    expect(body.interviewEndAt).toBeUndefined()
  })

  it('행에 기간이 있을 때 폼에서 비우면 비움 요청을 보낸다(기존 동작 유지)', () => {
    const p = program(
      volunteerRow({
        interviewStartAt: '2026-12-09T15:00:00.000Z',
        interviewEndAt: '2026-12-18T14:59:59.999Z',
      })
    )
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: p,
      draft: p,
      patch: { interviewStartDate: '', interviewEndDate: '' },
      audience: 'volunteer',
    }) as unknown as Record<string, unknown>
    expect(body.interviewStartAt === '' || body.interviewStartAt === null).toBe(true)
    expect(body.interviewEndAt === '' || body.interviewEndAt === null).toBe(true)
  })

  it('폼이 nested 기간을 보내면 그대로 행에 쓴다(행 backfill)', () => {
    const p = program()
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: p,
      draft: p,
      patch: { interviewStartDate: NESTED_START, interviewEndDate: NESTED_END },
      audience: 'volunteer',
    }) as unknown as Record<string, unknown>
    expect(body.interviewStartAt).toBe(NESTED_START)
    expect(body.interviewEndAt).toBe(NESTED_END)
  })
})

describe('buildVolunteerInterviewConfigForRowSave — 전체 객체', () => {
  it('typed 가 덮는 키가 없으면 undefined(보내지 않음)', () => {
    expect(buildVolunteerInterviewConfigForRowSave({}, STORED)).toBeUndefined()
    expect(
      buildVolunteerInterviewConfigForRowSave(
        {
          'recruit.volunteer.interviewMethod': 'online',
          [`${P}.exception.1793000000000.timeUnit`]: '30',
          [`${P}.exception.1793000000000.interviewTimeRange`]: ['a', 'b'],
        },
        STORED
      )
    ).toBeUndefined()
  })

  it('부분 overlay → 저장 typed 와 합친다(예외·슬롯 유지)', () => {
    const out = buildVolunteerInterviewConfigForRowSave(
      { [`${P}.appliedUnavailableDates`]: ['2026-12-11'] },
      STORED
    )
    expect(out).toEqual(
      completeVolunteerInterviewConfig({ ...STORED, appliedUnavailableDates: ['2026-12-11'] })
    )
  })

  it('폼이 빈 배열을 보내면 비운다', () => {
    const out = buildVolunteerInterviewConfigForRowSave(
      { [`${P}.specificUnavailableDates`]: [] },
      STORED
    )
    expect(out?.specificUnavailableDates).toEqual([])
    expect(out?.selectedSlotKeys).toEqual([SLOT_A, SLOT_B])
  })

  it('selectedSlotKeys 가 있으면 예외는 폼 상태(예외 삭제 반영)', () => {
    const out = buildVolunteerInterviewConfigForRowSave(
      { [`${P}.selectedSlotKeys`]: [SLOT_B] },
      STORED
    )
    expect(out?.selectedSlotKeys).toEqual([SLOT_B])
    expect(out?.exceptions).toEqual([])
    expect(out?.timeUnit).toBe(30)
  })

  it('typed 없는 구 프로그램 → overlay(legacy 포함) fallback 과 합친다', () => {
    const out = buildVolunteerInterviewConfigForRowSave(
      {
        'recruit.volunteer.selectedSlotKeys': [SLOT_A],
        'recruit.volunteer.timeUnit': '30',
        [`${P}.appliedUnavailableDates`]: ['2026-12-11'],
      },
      null
    )
    expect(out).toMatchObject({
      schemaVersion: 1,
      selectedSlotKeys: [SLOT_A],
      timeUnit: 30,
      appliedUnavailableDates: ['2026-12-11'],
    })
  })

  it('항상 모든 필드가 있는 전체 객체', () => {
    const out = buildVolunteerInterviewConfigForRowSave({ [`${P}.timeUnit`]: '60' }, null)
    expect(Object.keys(out ?? {}).sort()).toEqual(
      [
        'appliedUnavailableDates',
        'exceptions',
        'exclusionState',
        'interviewTimeRange',
        'schemaVersion',
        'selectedSlotKeys',
        'specificUnavailableDates',
        'timeUnit',
      ].sort()
    )
    expect(out?.timeUnit).toBe(60)
  })
})

describe('completeVolunteerInterviewConfig', () => {
  it('빈 입력 → 빈 배열·null 을 명시한 객체', () => {
    expect(completeVolunteerInterviewConfig(undefined)).toEqual({
      schemaVersion: 1,
      selectedSlotKeys: [],
      timeUnit: null,
      interviewTimeRange: [],
      specificUnavailableDates: [],
      appliedUnavailableDates: [],
      exclusionState: null,
      exceptions: [],
    })
  })

  it('값은 그대로 복사(원본 배열 공유 안 함)', () => {
    const out = completeVolunteerInterviewConfig(STORED)
    expect(out).toEqual(STORED)
    expect(out.selectedSlotKeys).not.toBe(STORED.selectedSlotKeys)
  })
})

describe('UJAT 은 영향 없음', () => {
  it('UJAT 봉사 행 PATCH 에는 interviewConfig 를 넣지 않는다', () => {
    const p = program(volunteerRow(), { backendProgramType: 'UJAT' })
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: p,
      draft: p,
      patch: { registrationOverlay: { [`${P}.timeUnit`]: '30' } },
      audience: 'volunteer',
    }) as unknown as Record<string, unknown>
    expect(body).not.toHaveProperty('interviewConfig')
  })
})

describe('part9 — 행 면접 기간 backfill 출처(keonhee 2026-10-25 23:1x)', () => {
  const withSchedule = (period?: [string, string], info?: { start?: string; end?: string }) =>
    program(volunteerRow(), {
      volunteerInterviewScheduleInfoFromServer: period
        ? { periodStartDate: period[0], periodEndDate: period[1] }
        : null,
      generalCommonInfo: {
        volunteerRecruitmentInfo: {
          volunteerInterviewEnabled: true,
          ...(info?.start ? { interviewStartDate: info.start } : {}),
          ...(info?.end ? { interviewEndDate: info.end } : {}),
        },
      },
    } as Partial<Program>)
  const save = (p: Program, start: string, end: string) =>
    buildProgramRecruitmentRowSaveRequest({
      baseline: p,
      draft: p,
      patch: { interviewStartDate: start, interviewEndDate: end },
      audience: 'volunteer',
    }) as unknown as Record<string, unknown>

  it('폼이 nested 그대로면 scheduleInfo period 를 행 형식(KST 00:00 / 23:59:59.999)으로', () => {
    const body = save(
      withSchedule(['2026-12-09', '2026-12-18'], { start: NESTED_START, end: NESTED_END }),
      NESTED_START,
      NESTED_END
    )
    expect(body.interviewStartAt).toBe('2026-12-08T15:00:00.000Z')
    expect(body.interviewEndAt).toBe('2026-12-18T14:59:59.999Z')
  })

  it('scheduleInfo period 가 없으면 volunteerRecruitmentInfo 기간', () => {
    const body = save(
      withSchedule(undefined, { start: NESTED_START, end: NESTED_END }),
      NESTED_START,
      NESTED_END
    )
    expect(body.interviewStartAt).toBe(NESTED_START)
    expect(body.interviewEndAt).toBe(NESTED_END)
  })

  it('폼에서 날짜를 바꾸면 그 값(사용자 입력)', () => {
    const body = save(
      withSchedule(['2026-12-07', '2026-12-20'], { start: NESTED_START, end: NESTED_END }),
      '2026-12-10T15:00:00.000Z',
      '2026-12-15T14:59:59.999Z'
    )
    expect(body.interviewStartAt).toBe('2026-12-10T15:00:00.000Z')
    expect(body.interviewEndAt).toBe('2026-12-15T14:59:59.999Z')
  })

  it('nested 가 비어 있고 폼도 비면 날짜를 만들지 않는다', () => {
    const body = save(withSchedule(undefined, {}), '', '')
    expect(body).not.toHaveProperty('interviewStartAt')
    expect(body).not.toHaveProperty('interviewEndAt')
  })
})

describe('part9 — UJAT 봉사 운영 행은 면접을 끌 수 없다', () => {
  it('UJAT 은 interviewEnabled false 요청이어도 행 값(true) 유지', () => {
    const p = program(volunteerRow({ interviewEnabled: true }), { backendProgramType: 'UJAT' })
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: p,
      draft: p,
      patch: { generalVolunteerInterviewEnabled: false },
      audience: 'volunteer',
    }) as unknown as Record<string, unknown>
    expect(body.interviewEnabled).toBe(true)
  })

  it('일반 봉사 행은 false 를 그대로 보낸다', () => {
    const p = program()
    const body = buildProgramRecruitmentRowSaveRequest({
      baseline: p,
      draft: p,
      patch: { generalVolunteerInterviewEnabled: false },
      audience: 'volunteer',
    }) as unknown as Record<string, unknown>
    expect(body.interviewEnabled).toBe(false)
  })
})

describe('part9 — nested 스냅샷 PATCH 프로그램 JSON 면접 스위치', () => {
  const root = (json: string | undefined) =>
    (json ? JSON.parse(json) : undefined) as Record<string, unknown> | undefined

  it('봉사자 탭 면접 끄기 → 루트 generalVolunteerInterviewEnabled false', () => {
    const p = program(volunteerRow({ interviewEnabled: false }), {
      generalVolunteerInterviewEnabled: false,
    })
    const out = root(
      buildGeneralRecruitmentNestedSnapshotServiceDetailJson(p, { audience: 'volunteer' })
    )
    expect(out?.generalVolunteerInterviewEnabled).toBe(false)
  })

  it('다른 탭·UJAT·값 없음은 넣지 않는다', () => {
    const off = program(volunteerRow(), { generalVolunteerInterviewEnabled: false })
    expect(
      root(buildGeneralRecruitmentNestedSnapshotServiceDetailJson(off, { audience: 'participant' }))
    ).not.toHaveProperty('generalVolunteerInterviewEnabled')
    expect(root(buildGeneralRecruitmentNestedSnapshotServiceDetailJson(off))).not.toHaveProperty(
      'generalVolunteerInterviewEnabled'
    )
    const ujat = program(volunteerRow(), {
      backendProgramType: 'UJAT',
      generalVolunteerInterviewEnabled: false,
    })
    expect(
      root(buildGeneralRecruitmentNestedSnapshotServiceDetailJson(ujat, { audience: 'volunteer' }))
    ).not.toHaveProperty('generalVolunteerInterviewEnabled')
    const unknown = program(volunteerRow(), { generalVolunteerInterviewEnabled: undefined })
    expect(
      root(
        buildGeneralRecruitmentNestedSnapshotServiceDetailJson(unknown, { audience: 'volunteer' })
      )
    ).not.toHaveProperty('generalVolunteerInterviewEnabled')
  })
})

describe('part9 — 면접 여부 표시 라벨', () => {
  it('행 interviewEnabled 값이 저장 nested 라벨보다 우선', () => {
    const p = program(volunteerRow({ interviewEnabled: false }), {
      generalCommonInfo: {
        volunteerRecruitmentInfo: {
          volunteerInterviewEnabled: false,
          volunteerInterviewEnabledLabel: '면접 있음',
        },
      },
    } as Partial<Program>)
    expect(resolveGeneralProgramVolunteerRecruitmentDisplay(p).interviewEnabledLabel).toBe(
      '면접 없음'
    )
  })

  it('값을 모르면 저장 라벨', () => {
    const p = program(volunteerRow({ interviewEnabled: undefined }), {
      generalVolunteerInterviewEnabled: undefined,
      generalCommonInfo: {
        volunteerRecruitmentInfo: { volunteerInterviewEnabledLabel: '면접 있음' },
      },
    } as Partial<Program>)
    expect(resolveGeneralProgramVolunteerRecruitmentDisplay(p).interviewEnabledLabel).toBe(
      '면접 있음'
    )
  })
})
