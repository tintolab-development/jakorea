import type { Dayjs } from 'dayjs'
import type {
  VolunteerAssignmentNotificationStatus,
  VolunteerAssignmentNotificationTiming,
  VolunteerAssignmentRemoteRow,
} from '@/features/program/general/api/program-progress-api-client'
import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'

/**
 * 기관형 봉사자 기관 배정 알림 상태 — 「봉사자 + 기관」 단위 1건(같은 기관의 회차 행이 공유).
 * BE 필드: assignmentNotificationStatus / SentAt / ScheduledAt. 구버전 응답에는 없다(→ 판단 불가).
 */
export type VolunteerOrganizationNotificationState = {
  status: VolunteerAssignmentNotificationStatus
  sentAt: string | null
  scheduledAt: string | null
}

const STATUS_PRIORITY: Record<VolunteerAssignmentNotificationStatus, number> = {
  SENT: 3,
  SCHEDULED: 2,
  CANCELLED: 1,
  NONE: 0,
}

export function normalizeVolunteerAssignmentNotificationStatus(
  raw: string | null | undefined
): VolunteerAssignmentNotificationStatus | null {
  const value = raw?.trim().toUpperCase()
  if (value === 'NONE' || value === 'SCHEDULED' || value === 'SENT' || value === 'CANCELLED') {
    return value
  }
  return null
}

function isCancelledAssignmentRow(row: VolunteerAssignmentRemoteRow): boolean {
  const status = row.assignmentStatus?.trim().toUpperCase() ?? ''
  return status === 'CANCELLED' || status === 'CANCELED'
}

/**
 * 기관 신청 id → 배정 알림 상태. 같은 기관은 상태를 공유하지만, 행마다 다르게 오면 발송(SENT) 쪽을 따른다.
 * 취소되지 않은 회차 행을 우선하고, 상태 필드가 없는 행(구버전)은 건너뛴다.
 */
export function buildVolunteerAssignmentNotificationByOrganization(
  rows: readonly VolunteerAssignmentRemoteRow[]
): Map<string, VolunteerOrganizationNotificationState> {
  const active = rows.filter(row => !isCancelledAssignmentRow(row))
  const source = active.length > 0 ? active : rows
  const byOrganization = new Map<string, VolunteerOrganizationNotificationState>()
  for (const row of source) {
    const organizationApplicationId = row.organizationApplicationId
    if (organizationApplicationId == null || !Number.isFinite(organizationApplicationId)) continue
    const status = normalizeVolunteerAssignmentNotificationStatus(row.assignmentNotificationStatus)
    if (status == null) continue
    const key = String(Math.trunc(organizationApplicationId))
    const previous = byOrganization.get(key)
    if (previous && STATUS_PRIORITY[previous.status] >= STATUS_PRIORITY[status]) continue
    byOrganization.set(key, {
      status,
      sentAt: row.assignmentNotificationSentAt?.trim() || null,
      scheduledAt: row.assignmentNotificationScheduledAt?.trim() || null,
    })
  }
  return byOrganization
}

/**
 * 배정 취소 팝업 분기 — 빠지는 기관 중 하나라도 SENT면 `true`(발송 후),
 * 모두 상태를 알고 SENT가 없으면 `false`(발송 전), 상태를 모르는 기관이 있으면 `undefined`(기존 발송 후 시안).
 */
export function resolveVolunteerUnassignNotificationSent(
  organizationApplicationIds: readonly (string | null | undefined)[],
  byOrganization: ReadonlyMap<string, VolunteerOrganizationNotificationState> | null | undefined
): boolean | undefined {
  if (!byOrganization || organizationApplicationIds.length === 0) return undefined
  let allKnown = true
  for (const id of organizationApplicationIds) {
    const state = id ? byOrganization.get(id) : undefined
    if (state?.status === 'SENT') return true
    if (state == null) allKnown = false
  }
  return allKnown ? false : undefined
}

/** 팝업 알림 시점 → PUT assigned-organizations `notification` */
export function toVolunteerAssignmentNotificationTiming(
  notifyTiming: PermissionModalNotifyTiming | null | undefined,
  manualNotifyAt?: Dayjs | null
): VolunteerAssignmentNotificationTiming {
  if (notifyTiming === 'manual' && manualNotifyAt?.isValid()) {
    return { timing: 'SCHEDULED', scheduledAt: manualNotifyAt.toISOString() }
  }
  return { timing: 'IMMEDIATE' }
}
