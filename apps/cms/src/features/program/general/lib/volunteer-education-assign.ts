/**
 * 일반 개인 프로그램 봉사자 — 승인(면접 없음)·2차 면접 합격 시 「교육 배정 안내」.
 * 저장 API: POST /api/admin/volunteer-applications/{id}/approve-with-education-scope
 * - confirmedScheduleIds=[] 이면 신청만 승인(교육 범위 미변경). 배정은 선택 사항이다.
 * - 일정이 있으면 본교육(EDUCATION·SESSION) id만 보낸다. 사전교육은 서버가 자동 포함한다.
 * - BE 규칙(GeneralIndividualApprovalEducationScopePolicy.resolveVolunteer):
 *   일정형·복수 회차 = 전 일정 또는 없음 / 단일 회차 = 1개 또는 없음 / 그 외 = 여러 개.
 */

import type { Dayjs } from 'dayjs'
import type { ProgramEducationSlotResponse } from '@/shared/api/generated/dashboard/schemas/programEducationSlotResponse'
import type { IndividualApprovalWithScopeRequest } from '@/shared/api/generated/dashboard/schemas/individualApprovalWithScopeRequest'
import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'
import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'
import { formatOrganizationScheduleRangeLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { formatEducationRoundSessionLabel } from '@/shared/lib/education-schedule-name'
import { toOrganizationApproveNotifyTiming } from '@/features/program/general/lib/application-decision-notify-timing'
import {
  individualApprovalProgramShapeFromProgram,
  listSelectableProgramDefinedEducationSlots,
} from '@/features/program/general/lib/individual-approval-education-scope'

/** 승인 사유(BE 필수 1~500자) — 화면 입력이 없어 고정 문구를 보낸다 */
export const VOLUNTEER_EDUCATION_ASSIGN_REASON = '봉사자 승인 및 교육 배정'

export type VolunteerEducationAssignMode = 'single' | 'multiple' | 'all'

export type VolunteerEducationAssignOption = {
  scheduleId: number
  /** 예: 2026.04.20(월) 09:30 ~ 12:20 */
  scheduleLabel: string
  /** 예: 2회차. 없으면 빈 문자열 */
  sessionRoundLabel: string
}

export type VolunteerEducationAssignPlan = {
  mode: VolunteerEducationAssignMode
  options: VolunteerEducationAssignOption[]
  /** 일정 배정을 할 수 없는 사유(승인만 가능). 없으면 null */
  blockedReason: string | null
}

type AssignProgram = Parameters<typeof individualApprovalProgramShapeFromProgram>[0]

function toOption(slot: ProgramEducationSlotResponse): VolunteerEducationAssignOption {
  return {
    scheduleId: slot.scheduleId as number,
    scheduleLabel:
      formatOrganizationScheduleRangeLabel(slot.startAt, slot.endAt) || '교육 일정',
    sessionRoundLabel: formatEducationRoundSessionLabel({ roundNumber: slot.sessionNo }),
  }
}

/**
 * 선택지 — 신청자가 고른 봉사 진행 가능 일정(activityScheduleSlots) 중 배정 가능한 본교육 일정을 우선한다.
 * 희망 일정이 없거나 하나도 맞지 않으면 프로그램 본교육 일정 전체(BE는 희망 일정 밖도 허용).
 * 일정형·복수 회차는 BE가 전 일정만 허용하므로 항상 전체.
 */
export function buildVolunteerEducationAssignPlan(input: {
  program: AssignProgram
  slots: ReadonlyArray<ProgramEducationSlotResponse> | null | undefined
  preferred?: ReadonlyArray<PreferredEducationSchedule> | null
}): VolunteerEducationAssignPlan {
  const shape = individualApprovalProgramShapeFromProgram(input.program)
  if (shape == null || 'blockedReason' in shape) {
    return {
      mode: 'multiple',
      options: [],
      blockedReason: shape?.blockedReason ?? '프로그램 교육 일정 구성을 확인할 수 없습니다.',
    }
  }
  const slots = listSelectableProgramDefinedEducationSlots(input.slots)
  if (slots.length === 0) {
    return { mode: 'multiple', options: [], blockedReason: '배정 가능한 교육 일정이 없습니다.' }
  }
  const mode: VolunteerEducationAssignMode =
    shape.educationStructure === 'SCHEDULE' && shape.sessionRound === 'MULTI'
      ? 'all'
      : shape.sessionRound === 'SINGLE'
        ? 'single'
        : 'multiple'
  if (mode === 'all') {
    return { mode, options: slots.map(toOption), blockedReason: null }
  }
  const preferredIds = new Set(
    (input.preferred ?? [])
      .flatMap(item => [item.scheduleId, ...(item.scheduleIds ?? [])])
      .filter((id): id is number => typeof id === 'number' && id > 0)
  )
  const preferredSlots = slots.filter(slot => preferredIds.has(slot.scheduleId as number))
  return {
    mode,
    options: (preferredSlots.length > 0 ? preferredSlots : slots).map(toOption),
    blockedReason: null,
  }
}

/** 카드·칩 토글 — 단일 회차 1개, 일정형 복수 회차는 전체 선택/해제, 그 외 다중 */
export function toggleVolunteerEducationAssignSelection(
  plan: VolunteerEducationAssignPlan,
  prev: ReadonlyArray<number>,
  scheduleId: number
): number[] {
  const selected = prev.includes(scheduleId)
  if (plan.mode === 'all') {
    return selected ? [] : plan.options.map(option => option.scheduleId)
  }
  if (plan.mode === 'single') return selected ? [] : [scheduleId]
  return selected ? prev.filter(id => id !== scheduleId) : [...prev, scheduleId]
}

export function buildVolunteerApprovalWithScopeRequest(input: {
  confirmedScheduleIds: ReadonlyArray<number>
  notifyTiming: PermissionModalNotifyTiming
  manualNotifyAt?: Dayjs | null
}): IndividualApprovalWithScopeRequest {
  const notify = toOrganizationApproveNotifyTiming(input.notifyTiming, input.manualNotifyAt)
  return {
    confirmedScheduleIds: Array.from(new Set(input.confirmedScheduleIds)).filter(id => id > 0),
    // 승인 직전 신규 참여자 — 교육 범위 revision 0. 일정 없는 승인은 revision을 검사하지 않는다.
    expectedScopeRevision: 0,
    reason: VOLUNTEER_EDUCATION_ASSIGN_REASON,
    timing: notify.timing,
    ...(notify.scheduledAt ? { scheduledAt: notify.scheduledAt } : {}),
  }
}
