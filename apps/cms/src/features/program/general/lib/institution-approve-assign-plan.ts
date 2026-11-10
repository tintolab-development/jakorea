/**
 * 일반 기관형 참여 기관 상세 — 배정 대기 「승인 및 배정」(시안 09-2·11-2·11-3) 실행 계획.
 *
 * 선택한 배정 대기 행(강사 × 희망 일정)을 강사 단위로 묶고, 행마다 배정할 program schedule을 미리 확정한다.
 * API 호출 전에 모든 행을 검사해, 일부만 보내고 멈추는 경우를 줄인다.
 * - 승인 전 강사: `POST /instructor-applications/{id}/approve` 한 번에 assignments·feePolicy·notification
 * - 이미 승인된 강사: 행마다 `POST /programs/{programId}/instructor-assignments`
 */

import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import type { AdminProgramScheduleResponse } from '@/features/program/shared/api/admin-program-schedule-response'
import { resolveInstructorAssignmentScheduleId } from './resolve-instructor-assignment-schedule-id'
import {
  ORGANIZATION_INSTRUCTOR_ASSIGNMENT_SCHEDULE_UNCONFIRMED_MESSAGE,
  resolveOrganizationInstructorAssignmentScheduleTarget,
} from './organization-instructor-assignable-schedule'

export type InstitutionApproveAssignRowInput = {
  instructorId: string
  instructorName: string
  instructorMemberId?: string
  instructorApplicationId?: string
  programApprovalPending?: boolean
  instructorFeeGradeLabel?: string
  hopeDate?: string
  hopeScheduleLine?: string
  requestedScheduleId?: number
  resolvedScheduleId?: number | null
  scheduleUnresolved?: boolean
}

export type InstitutionApproveAssignTarget = {
  scheduleId: number
  requestedScheduleId?: number
}

export type InstitutionApproveAssignInstructorPlan = {
  instructorMemberId: number
  instructorName: string
  instructorApplicationId?: number
  /** 승인 전 강사 — approve API로 승인과 배정을 함께 보낸다 */
  unapproved: boolean
  instructorFeeGradeLabel?: string
  targets: InstitutionApproveAssignTarget[]
}

export type InstitutionApproveAssignPlanResult =
  | { ok: true; instructors: InstitutionApproveAssignInstructorPlan[] }
  | { ok: false; message: string }

function positiveInt(raw: string | number | null | undefined): number | null {
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null
}

export function buildInstitutionApproveAssignPlan(input: {
  rows: readonly InstitutionApproveAssignRowInput[]
  schedules: ReadonlyArray<AdminProgramScheduleResponse | ProgramScheduleResponse>
}): InstitutionApproveAssignPlanResult {
  const byMember = new Map<number, InstitutionApproveAssignInstructorPlan>()

  for (const row of input.rows) {
    const memberId = positiveInt(row.instructorMemberId ?? row.instructorId)
    if (memberId == null) {
      return {
        ok: false,
        message: `강사 memberId가 없어 배정할 수 없습니다. (${row.instructorName})`,
      }
    }
    if (row.scheduleUnresolved) {
      return { ok: false, message: ORGANIZATION_INSTRUCTOR_ASSIGNMENT_SCHEDULE_UNCONFIRMED_MESSAGE }
    }
    const target = resolveOrganizationInstructorAssignmentScheduleTarget({
      allowRequestedScheduleOnly: false,
      boardScheduleId: resolveInstructorAssignmentScheduleId({
        schedules: input.schedules,
        resolvedScheduleId: row.resolvedScheduleId,
        hopeDateOrLine: row.hopeDate ?? row.hopeScheduleLine,
        timeRangeLabel: row.hopeScheduleLine,
      }),
      resolvedScheduleId: row.resolvedScheduleId,
      requestedScheduleId: row.requestedScheduleId,
    })
    if (target?.scheduleId == null) {
      return { ok: false, message: ORGANIZATION_INSTRUCTOR_ASSIGNMENT_SCHEDULE_UNCONFIRMED_MESSAGE }
    }

    const unapproved = row.programApprovalPending === true
    const applicationId = positiveInt(row.instructorApplicationId)
    if (unapproved && applicationId == null) {
      return {
        ok: false,
        message: `강사 신청 ID가 없어 승인할 수 없습니다. (${row.instructorName})`,
      }
    }

    const existing = byMember.get(memberId)
    const nextTarget: InstitutionApproveAssignTarget = {
      scheduleId: target.scheduleId,
      ...(target.requestedScheduleId != null
        ? { requestedScheduleId: target.requestedScheduleId }
        : {}),
    }
    if (existing) {
      if (!existing.targets.some(t => t.scheduleId === nextTarget.scheduleId)) {
        existing.targets.push(nextTarget)
      }
      continue
    }
    byMember.set(memberId, {
      instructorMemberId: memberId,
      instructorName: row.instructorName,
      ...(applicationId != null ? { instructorApplicationId: applicationId } : {}),
      unapproved,
      ...(row.instructorFeeGradeLabel ? { instructorFeeGradeLabel: row.instructorFeeGradeLabel } : {}),
      targets: [nextTarget],
    })
  }

  return { ok: true, instructors: Array.from(byMember.values()) }
}

/** 강사 단위 선택 요약 — 시안 11-2 「선택한 N명 중 M명」 */
export function summarizeInstitutionApproveAssignSelection(
  rows: readonly Pick<InstitutionApproveAssignRowInput, 'instructorId' | 'instructorName' | 'programApprovalPending'>[]
): {
  selectedInstructorCount: number
  unapprovedInstructorCount: number
  firstUnapprovedInstructorName: string
} {
  const selected = new Set<string>()
  const unapproved = new Map<string, string>()
  for (const row of rows) {
    selected.add(row.instructorId)
    if (row.programApprovalPending) unapproved.set(row.instructorId, row.instructorName)
  }
  return {
    selectedInstructorCount: selected.size,
    unapprovedInstructorCount: unapproved.size,
    firstUnapprovedInstructorName: unapproved.values().next().value ?? '',
  }
}

/** 시안 11-3 강사비 책정 본문 대상 — 「[X] 님」 / 「[X] 님 외 N명」 */
export function formatInstitutionApproveAssignFeeSubject(names: readonly string[]): string {
  const first = names[0]?.trim() || '강사'
  return names.length > 1 ? `**[${first}]** 님 외 ${names.length - 1}명` : `**[${first}]** 님`
}
