/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'
import { mapAdminProgramDetailToProgram } from '@/features/program/general/api/adapters/general-program-adapters'
import { programToRecruitmentTabEditValues } from '@/features/program/general/lib/general-program-recruitment-edit-seed'
import { buildGeneralRecruitmentNestedSnapshotServiceDetailJson } from '@/features/program/general/lib/persist-recruitment-nested-snapshot'
import { useProgramDetailInfoSave } from '@/features/program/general/hooks/use-program-detail-info-save'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { buildProgramRecruitmentRowSaveRequest } from '@/features/program/shared/lib/persist-recruitment-row-save'
import { resolveGeneralProgramVolunteerRecruitmentDisplay } from '@/features/program/general/lib/volunteer-recruitment-display'

vi.mock('@/shared/ui', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  showUpdateCompletedAlert: vi.fn(),
}))

/**
 * Part9(keonhee 2026-10-25 23:1x) 전 parity — 3fdcc5bfa 에서 만든 스냅샷.
 * 모집 탭(봉사) 저장 훅(useProgramDetailInfoSave) → 행 PATCH 본문 + 후속 nested 스냅샷 PATCH 본문.
 * (a) 빈 nested 기간에서 행·nested 날짜를 새로 만들지 않는가 / 출처 순서(scheduleInfo period → volunteerRecruitmentInfo)
 * (b) 면접 끄기 — 프로그램 JSON generalVolunteerInterviewEnabled 를 false 로 보내는가(BE 는 행 플래그와 OR)
 * (c) 운영일 clearFields — GET 이 null 일 때만
 */

const START = '2026-12-06T15:00:00.000Z'
const END = '2026-12-20T14:59:59.999Z'
const SLOT_A = `${Date.UTC(2026, 11, 7, 1, 0)}-${Date.UTC(2026, 11, 7, 1, 30)}`
const TYPED = {
  schemaVersion: 1,
  selectedSlotKeys: [SLOT_A],
  timeUnit: 30,
  interviewTimeRange: ['2026-12-07T01:00:00Z', '2026-12-07T03:00:00Z'],
  specificUnavailableDates: [],
  appliedUnavailableDates: ['2026-12-10'],
  exclusionState: { excludeSaturday: true, excludeSunday: true, excludeHoliday: true },
  exceptions: [],
}

type Shape = {
  vri?: { start?: string; end?: string }
  schedulePeriod?: [string, string]
  seal?: { start: string; end: string }
  rowStart?: string | null
  rowEnd?: string | null
  opStart?: string | null
  opEnd?: string | null
  interviewEnabled?: boolean
  nestedInterviewEnabled?: boolean
  nestedLabel?: string
}

function dto(s: Shape): ProgramResponse {
  return {
    id: 990100,
    programType: 'GENERAL_ORGANIZATION',
    title: '[BOT-TEST-VOL] parity9',
    startDate: '2026-12-01',
    endDate: '2027-02-28',
    serviceDetailJson: JSON.stringify({
      schemaVersion: 1,
      generalParticipantTypes: ['school_institution', 'volunteer'],
      generalVolunteerInterviewEnabled: s.interviewEnabled ?? true,
      generalCommonInfo: {
        volunteerRecruitmentInfo: {
          volunteerInterviewEnabled: s.nestedInterviewEnabled ?? s.interviewEnabled ?? true,
          generalVolunteerInterviewEnabled: s.nestedInterviewEnabled ?? s.interviewEnabled ?? true,
          ...(s.nestedLabel ? { volunteerInterviewEnabledLabel: s.nestedLabel } : {}),
          interviewMethod: 'online',
          ...(s.vri?.start ? { interviewStartDate: s.vri.start } : {}),
          ...(s.vri?.end ? { interviewEndDate: s.vri.end } : {}),
        },
        volunteerInterviewScheduleInfo: {
          availableTimeSlots: '10:00 ~ 10:30',
          ...(s.schedulePeriod
            ? { periodStartDate: s.schedulePeriod[0], periodEndDate: s.schedulePeriod[1] }
            : {}),
        },
      },
      registration: {
        overlay: {
          'recruit.volunteer.interviewMethod': 'online',
          ...(s.seal ? { 'recruit.volunteer.interviewRangeSeal': s.seal } : {}),
        },
      },
    }),
    recruitments: [
      {
        id: 2,
        recruitmentType: 'PARTICIPANT',
        targetType: 'ORGANIZATION',
        applicationType: 'ORGANIZATION',
        operationStartDate: '2026-12-01',
        operationEndDate: '2027-02-28',
        interviewConfig: null,
      },
      {
        id: 1,
        recruitmentType: 'VOLUNTEER',
        targetType: 'COLLEGE_STUDENT',
        applicationType: 'VOLUNTEER',
        startAt: '2026-10-31T15:00:00Z',
        endAt: '2026-11-20T14:59:59.999Z',
        operationStartDate: s.opStart === undefined ? '2026-12-01' : s.opStart,
        operationEndDate: s.opEnd === undefined ? '2027-02-28' : s.opEnd,
        interviewEnabled: s.interviewEnabled ?? true,
        interviewStartAt: s.rowStart ?? null,
        interviewEndAt: s.rowEnd ?? null,
        interviewConfig: TYPED,
      },
    ],
  } as unknown as ProgramResponse
}

async function saveVolunteerTab(
  shape: Shape,
  edit: (values: ProgramDetailEditFormValues) => ProgramDetailEditFormValues = v => v
) {
  const program = mapAdminProgramDetailToProgram(dto(shape))
  const seeded = programToRecruitmentTabEditValues(
    program,
    'volunteer'
  ) as ProgramDetailEditFormValues
  const values = edit(seeded)
  const saved: Array<{ draft: Program; patch: Partial<Program>; baseline: Program }> = []
  const { result } = renderHook(() => {
    const form = useForm<ProgramDetailEditFormValues>({ defaultValues: values })
    return useProgramDetailInfoSave({
      form,
      program,
      mapToValues: () => values,
      onSaveEdit: async (draft: Program, patch: Partial<Program>, baseline: Program) => {
        saved.push({ draft, patch, baseline })
      },
      validateSchema: { safeParse: () => ({ success: true }) } as never,
      recruitmentAudience: 'volunteer',
    } as never)
  })
  let ok = false
  await act(async () => {
    ok = await (result.current as { triggerSave: () => Promise<boolean> }).triggerSave()
  })
  expect(ok).toBe(true)
  const { draft, patch, baseline } = saved[0]
  const row = buildProgramRecruitmentRowSaveRequest({
    baseline,
    draft,
    patch,
    audience: 'volunteer',
  })
  const nestedJson = buildGeneralRecruitmentNestedSnapshotServiceDetailJson(draft, {
    audience: 'volunteer',
  })
  const nested = nestedJson ? (JSON.parse(nestedJson) as Record<string, unknown>) : undefined
  const gci = (nested?.generalCommonInfo ?? {}) as Record<string, Record<string, unknown>>
  const vri = gci.volunteerRecruitmentInfo ?? {}
  return {
    seededForm: {
      interviewStartDate: seeded.interviewStartDate,
      interviewEndDate: seeded.interviewEndDate,
      volunteerRecruitmentInterviewEnabled: seeded.volunteerRecruitmentInterviewEnabled,
    },
    row: {
      interviewEnabled: row?.interviewEnabled,
      interviewStartAt: row && 'interviewStartAt' in row ? row.interviewStartAt : '(omitted)',
      interviewEndAt: row && 'interviewEndAt' in row ? row.interviewEndAt : '(omitted)',
      operationStartDate: row?.operationStartDate,
      operationEndDate: row?.operationEndDate,
      clearFields: row?.clearFields,
      hasInterviewConfig: row != null && 'interviewConfig' in row,
    },
    nested: {
      rootGeneralVolunteerInterviewEnabled:
        nested && 'generalVolunteerInterviewEnabled' in nested
          ? nested.generalVolunteerInterviewEnabled
          : '(omitted)',
      vriVolunteerInterviewEnabled: vri.volunteerInterviewEnabled,
      vriGeneralVolunteerInterviewEnabled: vri.generalVolunteerInterviewEnabled,
      vriVolunteerInterviewEnabledLabel: vri.volunteerInterviewEnabledLabel,
      vriInterviewStartDate: 'interviewStartDate' in vri ? vri.interviewStartDate : '(omitted)',
      vriInterviewEndDate: 'interviewEndDate' in vri ? vri.interviewEndDate : '(omitted)',
      schedule: gci.volunteerInterviewScheduleInfo,
    },
  }
}

describe('모집 탭 봉사 저장 parity (part9 전)', () => {
  it('(a) 행 null · nested 기간 전혀 없음 · seal 없음', async () => {
    expect(await saveVolunteerTab({})).toMatchSnapshot()
  })
  it('(a) 행 null · nested 없음 · overlay interviewRangeSeal 만 있음', async () => {
    expect(await saveVolunteerTab({ seal: { start: START, end: END } })).toMatchSnapshot()
  })
  it('(a) 행 null · volunteerRecruitmentInfo 없음 · scheduleInfo period 만 있음', async () => {
    expect(
      await saveVolunteerTab({ schedulePeriod: ['2026-12-07', '2026-12-20'] })
    ).toMatchSnapshot()
  })
  it('(a) 행 null · scheduleInfo period 와 volunteerRecruitmentInfo 가 다름', async () => {
    expect(
      await saveVolunteerTab({
        vri: { start: START, end: END },
        schedulePeriod: ['2026-12-09', '2026-12-18'],
      })
    ).toMatchSnapshot()
  })
  it('(a) 행 null · 둘 다 같은 기간(186382·186384 모양)', async () => {
    expect(
      await saveVolunteerTab({
        vri: { start: START, end: END },
        schedulePeriod: ['2026-12-07', '2026-12-20'],
      })
    ).toMatchSnapshot()
  })
  it('(b) 면접 끄기 — 행에 기간 있음(186386 모양)', async () => {
    expect(
      await saveVolunteerTab(
        {
          vri: { start: START, end: END },
          schedulePeriod: ['2026-12-07', '2026-12-20'],
          rowStart: START,
          rowEnd: END,
        },
        v => ({ ...v, volunteerRecruitmentInterviewEnabled: 'no' })
      )
    ).toMatchSnapshot()
  })
  it('(b) 면접 켜기 — 꺼진 프로그램', async () => {
    expect(
      await saveVolunteerTab(
        {
          vri: { start: START, end: END },
          rowStart: START,
          rowEnd: END,
          interviewEnabled: false,
        },
        v => ({ ...v, volunteerRecruitmentInterviewEnabled: 'yes' })
      )
    ).toMatchSnapshot()
  })
  it('(c) 운영일 GET null → clearFields, 값 있음 → 그대로', async () => {
    const nullOp = await saveVolunteerTab(
      { vri: { start: START, end: END }, opStart: null, opEnd: null },
      v => ({ ...v, volunteerProgramOperationStartDate: '', volunteerProgramOperationEndDate: '' })
    )
    const withOp = await saveVolunteerTab({ vri: { start: START, end: END } }, v => ({
      ...v,
      volunteerProgramOperationStartDate: '',
      volunteerProgramOperationEndDate: '',
    }))
    expect({ nullOp: nullOp.row, withOp: withOp.row }).toMatchSnapshot()
  })
  it('(b) 표시 라벨 — 행 false(끈 뒤 GET), nested 플래그 false·라벨 「면접 있음」 이 남은 경우', () => {
    const p = mapAdminProgramDetailToProgram(
      dto({
        vri: { start: START, end: END },
        rowStart: START,
        rowEnd: END,
        interviewEnabled: false,
        nestedLabel: '면접 있음',
      })
    )
    expect(
      resolveGeneralProgramVolunteerRecruitmentDisplay(p).interviewEnabledLabel
    ).toMatchSnapshot()
  })
})
