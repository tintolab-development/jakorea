import type { Dayjs } from 'dayjs'
import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'
import {
  NOTIFY_TIMING_CAPABILITY,
  assertNotifyTimingSupported,
} from '@/shared/lib/notify-timing-capability'

export type FlatDecisionNotifyTiming = {
  timing: 'SCHEDULED' | 'ON_ANNOUNCEMENT'
  scheduledAt?: string
}

export type TrainedTeacherApproveNotifyTiming = {
  timing: 'IMMEDIATE' | 'SCHEDULED' | 'ON_ANNOUNCEMENT'
  scheduledAt?: string
}

export type NestedDecisionNotification = {
  notification: {
    timing: 'IMMEDIATE' | 'SCHEDULED' | 'ON_ANNOUNCEMENT'
    scheduledAt?: string
  }
}

export type ScreeningNotifyFields = {
  notifyTiming: 'IMMEDIATE' | 'ON_ANNOUNCEMENT' | 'MANUAL'
  scheduledAt?: string
}

function toScheduledAtIso(manualNotifyAt?: Dayjs | null): string | undefined {
  return manualNotifyAt?.toISOString()
}

/**
 * 직접설정만 SCHEDULED + scheduledAt. 즉시·발표일은 생략.
 * TimedBulk 발표일은 `toTimedBulkNotifyTiming`이 ON_ANNOUNCEMENT를 붙인다.
 */
export function toFlatDecisionNotifyTiming(
  notifyTiming?: PermissionModalNotifyTiming | string | null,
  manualNotifyAt?: Dayjs | null
): FlatDecisionNotifyTiming | undefined {
  if (notifyTiming !== 'manual') return undefined
  const scheduledAt = toScheduledAtIso(manualNotifyAt)
  if (!scheduledAt) return undefined
  return { timing: 'SCHEDULED', scheduledAt }
}

/**
 * `TimedBulkIdsRequest` / `TimedBulkDecisionRequest` / 기관 단건 반려 / 개인 일정·최종 반려.
 * 즉시=생략, 직접설정=SCHEDULED, 발표일=ON_ANNOUNCEMENT. scheduledAt은 SCHEDULED에만.
 */
export function toTimedBulkNotifyTiming(
  notifyTiming?: PermissionModalNotifyTiming | string | null,
  manualNotifyAt?: Dayjs | null
): FlatDecisionNotifyTiming | undefined {
  assertNotifyTimingSupported(notifyTiming, NOTIFY_TIMING_CAPABILITY.timedBulk)
  if (notifyTiming === 'on_announcement') return { timing: 'ON_ANNOUNCEMENT' }
  return toFlatDecisionNotifyTiming(notifyTiming, manualNotifyAt)
}

/** 권한 재발송·강사 배정 create — IMMEDIATE | SCHEDULED. 발표일 차단. */
export function toScheduledOnlyNotifyTiming(
  notifyTiming?: PermissionModalNotifyTiming | string | null,
  manualNotifyAt?: Dayjs | null
): { timing: 'SCHEDULED'; scheduledAt: string } | undefined {
  assertNotifyTimingSupported(notifyTiming, NOTIFY_TIMING_CAPABILITY.scheduledOnly)
  const scheduled = toFlatDecisionNotifyTiming(notifyTiming, manualNotifyAt)
  if (!scheduled || scheduled.timing !== 'SCHEDULED' || !scheduled.scheduledAt) return undefined
  return { timing: 'SCHEDULED', scheduledAt: scheduled.scheduledAt }
}

/**
 * 기관 단건 승인 `OrganizationApplicationApproveRequest`.
 * IMMEDIATE | SCHEDULED | ON_ANNOUNCEMENT. 발표일을 IMMEDIATE로 바꾸지 않는다.
 * 일괄 승인(`TimedBulkIdsRequest`)도 ON_ANNOUNCEMENT를 지원한다.
 */
export function toOrganizationApproveNotifyTiming(
  notifyTiming?: PermissionModalNotifyTiming | string | null,
  manualNotifyAt?: Dayjs | null
): { timing: 'IMMEDIATE' | 'SCHEDULED' | 'ON_ANNOUNCEMENT'; scheduledAt?: string } {
  const scheduled = toFlatDecisionNotifyTiming(notifyTiming, manualNotifyAt)
  if (scheduled) return scheduled
  if (notifyTiming === 'on_announcement') return { timing: 'ON_ANNOUNCEMENT' }
  return { timing: 'IMMEDIATE' }
}

/** TT 기관 승인 — 발표일 알림을 평탄 approval payload로 그대로 전달한다. */
export function toTrainedTeacherApproveNotifyTiming(
  notifyTiming?: PermissionModalNotifyTiming | string | null,
  manualNotifyAt?: Dayjs | null
): TrainedTeacherApproveNotifyTiming {
  const scheduled = toFlatDecisionNotifyTiming(notifyTiming, manualNotifyAt)
  if (scheduled) return scheduled
  if (notifyTiming === 'on_announcement') return { timing: 'ON_ANNOUNCEMENT' }
  return { timing: 'IMMEDIATE' }
}

/** 기관·봉사자 취소 — 중첩 notification. CUSTOM은 SCHEDULED로 변환한다. */
export function toNestedDecisionNotification(
  notifyTiming?: PermissionModalNotifyTiming | string | null,
  manualNotifyAt?: Dayjs | null
): NestedDecisionNotification | undefined {
  const flat = toFlatDecisionNotifyTiming(notifyTiming, manualNotifyAt)
  if (flat) return { notification: flat }
  if (notifyTiming === 'on_announcement') {
    return { notification: { timing: 'ON_ANNOUNCEMENT' } }
  }
  if (notifyTiming === 'immediate') {
    return { notification: { timing: 'IMMEDIATE' } }
  }
  return undefined
}

/** 서류/최종 — IMMEDIATE | ON_ANNOUNCEMENT | MANUAL. MANUAL일 때만 scheduledAt. */
export function toScreeningNotifyFields(
  notifyTiming?: PermissionModalNotifyTiming | string | null,
  manualNotifyAt?: Dayjs | null
): Partial<ScreeningNotifyFields> {
  if (notifyTiming === 'on_announcement') {
    return { notifyTiming: 'ON_ANNOUNCEMENT' }
  }
  if (notifyTiming === 'manual') {
    const scheduledAt = toScheduledAtIso(manualNotifyAt)
    return {
      notifyTiming: 'MANUAL',
      ...(scheduledAt ? { scheduledAt } : {}),
    }
  }
  if (notifyTiming === 'immediate') {
    return { notifyTiming: 'IMMEDIATE' }
  }
  return {}
}

/** 면접 배정 모달 — immediate | manual. ON_ANNOUNCEMENT는 보내지 않는다. */
export function toInterviewAssignNotifyFields(
  notifyTiming?: 'immediate' | 'manual' | string | null,
  manualNotifyAt?: Dayjs | null
): Partial<Pick<ScreeningNotifyFields, 'notifyTiming' | 'scheduledAt'>> {
  if (notifyTiming === 'manual') {
    const scheduledAt = toScheduledAtIso(manualNotifyAt)
    return {
      notifyTiming: 'MANUAL',
      ...(scheduledAt ? { scheduledAt } : {}),
    }
  }
  if (notifyTiming === 'immediate') {
    return { notifyTiming: 'IMMEDIATE' }
  }
  return {}
}
