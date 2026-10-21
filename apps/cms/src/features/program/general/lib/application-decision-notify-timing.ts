import type { Dayjs } from 'dayjs'
import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'

export type FlatDecisionNotifyTiming = {
  timing: 'SCHEDULED'
  scheduledAt: string
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
 * 기관 승인·반려 / 강사 일괄 — 즉시·발표일은 생략(즉시 발송).
 * 직접설정만 SCHEDULED + scheduledAt. IMMEDIATE에 scheduledAt을 붙이면 400.
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

/** 기관 신청 승인은 BE 계약상 timing을 항상 명시한다. */
export function toOrganizationApproveNotifyTiming(
  notifyTiming?: PermissionModalNotifyTiming | string | null,
  manualNotifyAt?: Dayjs | null
): { timing: 'IMMEDIATE' | 'SCHEDULED'; scheduledAt?: string } {
  const scheduled = toFlatDecisionNotifyTiming(notifyTiming, manualNotifyAt)
  return scheduled ?? { timing: 'IMMEDIATE' }
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
