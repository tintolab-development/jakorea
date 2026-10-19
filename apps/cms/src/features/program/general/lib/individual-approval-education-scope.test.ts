import { describe, expect, it } from 'vitest'
import type { ProgramEducationSlotResponse } from '@/shared/api/generated/dashboard/schemas/programEducationSlotResponse'
import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'
import {
  buildIndividualApprovalSchedulePlan,
  buildIndividualApprovalWithScopeRequest,
  buildIndividualBulkApprovalWithScopeRequest,
  defaultIndividualApprovalScheduleIds,
  describeApprovedEducationScope,
  formatIndividualApprovalScopeErrorMessage,
  isEducationScopeRevisionConflict,
  listSelectableProgramDefinedEducationSlots,
  resolveIndividualApprovalProgramShape,
  validateIndividualApprovalScheduleSelection,
} from './individual-approval-education-scope'

function slot(
  scheduleId: number,
  overrides: Partial<ProgramEducationSlotResponse> = {}
): ProgramEducationSlotResponse {
  return {
    scheduleId,
    sessionNo: 1,
    startAt: '2026-11-05T00:00:00Z',
    endAt: '2026-11-05T01:00:00Z',
    allDay: false,
    educationSlotKey: `general-common-line:${scheduleId}`,
    scheduleRole: 'EDUCATION',
    scheduleStatus: 'ACTIVE',
    scheduleOrigin: 'PROGRAM_DEFINED',
    ...overrides,
  }
}

function preferred(
  scheduleId: number | null,
  overrides: Partial<PreferredEducationSchedule> = {}
): PreferredEducationSchedule {
  return {
    scheduleId,
    round: 1,
    startAt: '2026-11-05T00:00:00Z',
    endAt: '2026-11-05T01:00:00Z',
    label: scheduleId == null ? 'line:1' : null,
    ...overrides,
  }
}

function planFor(
  structure: 'CURRICULUM' | 'SCHEDULE',
  round: 'SINGLE' | 'MULTI',
  preferredSchedules: PreferredEducationSchedule[],
  slots: ProgramEducationSlotResponse[]
) {
  return buildIndividualApprovalSchedulePlan({
    program: resolveIndividualApprovalProgramShape({
      educationStructure: structure,
      sessionRound: round,
      educationScheduleMode: 'date',
    }),
    preferred: preferredSchedules,
    slots,
    slotsResolved: true,
  })
}

describe('individual approval education scope', () => {
  it('keeps only active program-defined education or session slots', () => {
    expect(
      listSelectableProgramDefinedEducationSlots([
        slot(11),
        slot(12, { scheduleRole: 'SESSION' }),
        slot(13, { scheduleRole: 'PRE_EDUCATION' }),
        slot(14, { scheduleOrigin: 'APPLICATION_MATERIALIZED' }),
        slot(15, { scheduleStatus: 'CANCELLED' }),
        slot(0),
        { educationSlotKey: 'line:9' },
      ]).map(item => item.scheduleId)
    ).toEqual([11, 12])
  })

  it('approves CURRICULUM / SINGLE with exactly one preferred schedule', () => {
    const plan = planFor('CURRICULUM', 'SINGLE', [preferred(168351)], [slot(168351)])
    expect(defaultIndividualApprovalScheduleIds(plan)).toEqual([168351])
    expect(validateIndividualApprovalScheduleSelection(plan, [168351]).ok).toBe(true)
    const body = buildIndividualApprovalWithScopeRequest({
      confirmedScheduleIds: [168351],
      reason: '교육 일정 확정',
    })
    expect(body).toEqual({
      ok: true,
      body: {
        confirmedScheduleIds: [168351],
        expectedScopeRevision: 0,
        reason: '교육 일정 확정',
      },
    })
  })

  it('blocks CURRICULUM / SINGLE when two schedules are selected', () => {
    const plan = planFor(
      'CURRICULUM',
      'SINGLE',
      [preferred(1), preferred(2, { round: 2 })],
      [slot(1), slot(2, { sessionNo: 2 })]
    )
    const result = validateIndividualApprovalScheduleSelection(plan, [1, 2])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('1개')
  })

  it('approves CURRICULUM / MULTI with more than one preferred schedule', () => {
    const plan = planFor(
      'CURRICULUM',
      'MULTI',
      [preferred(21), preferred(22, { round: 2 })],
      [slot(21), slot(22, { sessionNo: 2 }), slot(23, { sessionNo: 3 })]
    )
    expect(validateIndividualApprovalScheduleSelection(plan, [21, 22])).toEqual({
      ok: true,
      confirmedScheduleIds: [21, 22],
    })
  })

  it('approves SCHEDULE / SINGLE with exactly one preferred schedule', () => {
    const plan = planFor('SCHEDULE', 'SINGLE', [preferred(168371)], [slot(168371)])
    expect(validateIndividualApprovalScheduleSelection(plan, [168371]).ok).toBe(true)
  })

  it('locks SCHEDULE / MULTI to every program-defined slot even without preferences', () => {
    const plan = planFor('SCHEDULE', 'MULTI', [], [slot(31), slot(32, { sessionNo: 2 })])
    expect(plan.blockedReason).toBeNull()
    expect(defaultIndividualApprovalScheduleIds(plan)).toEqual([31, 32])
    expect(validateIndividualApprovalScheduleSelection(plan, [31])).toMatchObject({ ok: false })
    expect(validateIndividualApprovalScheduleSelection(plan, [31, 32])).toEqual({
      ok: true,
      confirmedScheduleIds: [31, 32],
    })
  })

  it('blocks a schedule that is outside the applicant preference', () => {
    const plan = planFor('CURRICULUM', 'MULTI', [preferred(41)], [slot(41), slot(42)])
    const result = validateIndividualApprovalScheduleSelection(plan, [42])
    expect(result.ok).toBe(false)
  })

  it('does not map line labels without scheduleId onto a slot', () => {
    const plan = planFor(
      'CURRICULUM',
      'SINGLE',
      [preferred(null, { label: 'line:1' })],
      [slot(51, { educationSlotKey: 'line:1' })]
    )
    expect(plan.blockedReason).toContain('scheduleId')
    expect(plan.options[0]?.scheduleId).toBeNull()
    expect(plan.options[0]?.selectable).toBe(false)
  })

  it('disables approval when no selectable slot exists', () => {
    const plan = planFor('SCHEDULE', 'MULTI', [], [slot(61, { scheduleStatus: 'CANCELLED' })])
    expect(plan.blockedReason).toContain('교육 일정')
    expect(defaultIndividualApprovalScheduleIds(plan)).toEqual([])
  })

  it('keeps each bulk target schedule list instead of copying one selection', () => {
    const body = buildIndividualBulkApprovalWithScopeRequest({
      reason: '교육 일정 일괄 확정',
      targets: [
        { applicationId: '12345', confirmedScheduleIds: [123] },
        { applicationId: '12346', confirmedScheduleIds: [124, 125] },
      ],
    })
    expect(body).toEqual({
      ok: true,
      reason: '교육 일정 일괄 확정',
      targets: [
        { applicationId: 12345, confirmedScheduleIds: [123], expectedScopeRevision: 0 },
        { applicationId: 12346, confirmedScheduleIds: [124, 125], expectedScopeRevision: 0 },
      ],
    })
  })

  it('shows server-added scope ids separately from the requested selection', () => {
    expect(
      describeApprovedEducationScope({
        requestedScheduleIds: [123],
        responseScheduleIds: [123, 901],
      })
    ).toEqual({ scheduleIds: [123, 901], serverAddedScheduleIds: [901] })
  })

  it('shows the server error code and refetches on revision conflict', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          message: '교육 일정 개정 번호가 일치하지 않습니다.',
          error: {
            code: 'EDUCATION_SCOPE_REVISION_CONFLICT',
            message: '교육 일정 개정 번호가 일치하지 않습니다.',
          },
        },
      },
    }
    expect(isEducationScopeRevisionConflict(error)).toBe(true)
    expect(formatIndividualApprovalScopeErrorMessage(error)).toContain(
      'EDUCATION_SCOPE_REVISION_CONFLICT'
    )
    expect(formatIndividualApprovalScopeErrorMessage(error)).toContain('개정 번호')
  })

  it('does not treat a fixed-date period program as assignable', () => {
    const shape = resolveIndividualApprovalProgramShape({
      educationStructure: 'CURRICULUM',
      sessionRound: 'SINGLE',
      educationScheduleMode: 'period',
    })
    expect(shape).toMatchObject({ blockedReason: expect.stringContaining('FIXED_DATE') })
  })
})
