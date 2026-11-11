import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import type { ProgramEducationSlotResponse } from '@/shared/api/generated/dashboard/schemas/programEducationSlotResponse'
import {
  VOLUNTEER_EDUCATION_ASSIGN_REASON,
  buildVolunteerApprovalWithScopeRequest,
  buildVolunteerEducationAssignPlan,
  toggleVolunteerEducationAssignSelection,
} from './volunteer-education-assign'

function slot(scheduleId: number, sessionNo: number, role = 'EDUCATION'): ProgramEducationSlotResponse {
  return {
    scheduleId,
    sessionNo,
    startAt: '2026-04-20T00:30:00Z',
    endAt: '2026-04-20T03:20:00Z',
    scheduleRole: role,
    scheduleStatus: 'ACTIVE',
    scheduleOrigin: 'PROGRAM_DEFINED',
  }
}

function program(structure: string, round: string) {
  return {
    generalProgramEducationStructure: structure,
    generalProgramSessionRound: round,
    generalCommonInfo: { educationScheduleMode: 'FIXED_DATE' },
  }
}

const slots = [slot(11, 1), slot(12, 2), slot(13, 3, 'PRE_EDUCATION')]

describe('buildVolunteerEducationAssignPlan', () => {
  it('커리큘럼·복수 회차는 다중 선택, 희망 일정이 있으면 그 일정만', () => {
    const plan = buildVolunteerEducationAssignPlan({
      program: program('CURRICULUM', 'MULTI'),
      slots,
      preferred: [{ scheduleId: 12, scheduleIds: [12] }],
    })
    expect(plan.mode).toBe('multiple')
    expect(plan.options.map(o => o.scheduleId)).toEqual([12])
    expect(plan.blockedReason).toBeNull()
  })

  it('희망 일정이 없으면 본교육 일정 전체(사전교육 제외)', () => {
    const plan = buildVolunteerEducationAssignPlan({ program: program('CURRICULUM', 'SINGLE'), slots })
    expect(plan.mode).toBe('single')
    expect(plan.options.map(o => o.scheduleId)).toEqual([11, 12])
  })

  it('일정형·복수 회차는 전체 선택/해제만', () => {
    const plan = buildVolunteerEducationAssignPlan({ program: program('SCHEDULE', 'MULTI'), slots })
    expect(plan.mode).toBe('all')
    expect(toggleVolunteerEducationAssignSelection(plan, [], 11)).toEqual([11, 12])
    expect(toggleVolunteerEducationAssignSelection(plan, [11, 12], 12)).toEqual([])
  })

  it('단일 회차는 1개만, 다중은 누적', () => {
    const single = buildVolunteerEducationAssignPlan({ program: program('CURRICULUM', 'SINGLE'), slots })
    expect(toggleVolunteerEducationAssignSelection(single, [11], 12)).toEqual([12])
    const multi = buildVolunteerEducationAssignPlan({ program: program('CURRICULUM', 'MULTI'), slots })
    expect(toggleVolunteerEducationAssignSelection(multi, [11], 12)).toEqual([11, 12])
  })

  it('기간형 등 구성 불가면 승인만 가능(blockedReason)', () => {
    const plan = buildVolunteerEducationAssignPlan({
      program: { ...program('CURRICULUM', 'MULTI'), generalCommonInfo: { educationScheduleMode: 'PERIOD' } },
      slots,
    })
    expect(plan.options).toEqual([])
    expect(plan.blockedReason).toBeTruthy()
  })
})

describe('buildVolunteerApprovalWithScopeRequest', () => {
  it('일정 없이 배정하면 빈 배열(승인만), 즉시 알림', () => {
    expect(
      buildVolunteerApprovalWithScopeRequest({ confirmedScheduleIds: [], notifyTiming: 'immediate' })
    ).toEqual({
      confirmedScheduleIds: [],
      expectedScopeRevision: 0,
      reason: VOLUNTEER_EDUCATION_ASSIGN_REASON,
      timing: 'IMMEDIATE',
    })
  })

  it('발표일·직접 설정 알림 시점을 그대로 보낸다', () => {
    expect(
      buildVolunteerApprovalWithScopeRequest({
        confirmedScheduleIds: [11, 11, 12],
        notifyTiming: 'on_announcement',
      })
    ).toMatchObject({ confirmedScheduleIds: [11, 12], timing: 'ON_ANNOUNCEMENT' })
    const manual = buildVolunteerApprovalWithScopeRequest({
      confirmedScheduleIds: [11],
      notifyTiming: 'manual',
      manualNotifyAt: dayjs().add(1, 'day'),
    })
    expect(manual.timing).toBe('SCHEDULED')
    expect(manual.scheduledAt).toBeTruthy()
  })
})
