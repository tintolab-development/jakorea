/**
 * 배정 대기 「자택과의 거리」 — 서버 distanceKm / longDistance만 행에 매칭해 표시한다.
 * FE는 거리 계산·임계값 비교·0 대체를 하지 않는다. 매칭 실패·null → '-'.
 */

import { formatApiDistanceKmDisplay } from '@/shared/lib/format-api-distance-km'

export type WaitingScheduleDistance = {
  scheduleId: number
  distanceKm?: number | null
  longDistance?: boolean | null
}

export type WaitingOrganizationDistance = {
  organizationId?: number | null
  organizationApplicationId: number
  distanceKm?: number | null
  longDistance?: boolean | null
}

/** 개인형 — scheduleId 기준 */
export function formatWaitingScheduleDistance(
  distances: readonly WaitingScheduleDistance[] | null | undefined,
  scheduleId: string | number | null | undefined
): string {
  if (scheduleId == null || scheduleId === '') return '-'
  const key = String(scheduleId)
  const hit = (distances ?? []).find(d => d?.scheduleId != null && String(d.scheduleId) === key)
  return formatApiDistanceKmDisplay(hit?.distanceKm, { longDistance: hit?.longDistance })
}

/**
 * 기관형 — organizationApplicationId 우선. 행에 신청 id가 없을 때만 organizationId로 매칭한다.
 * organizationId가 null인 항목끼리는 매칭하지 않는다.
 */
export function findWaitingOrganizationDistance(
  distances: readonly WaitingOrganizationDistance[] | null | undefined,
  row: { organizationApplicationId?: string | number | null; organizationId?: number | null }
): WaitingOrganizationDistance | undefined {
  const list = distances ?? []
  const appId = row.organizationApplicationId
  if (appId != null && String(appId).trim() !== '') {
    const key = String(appId).trim()
    return list.find(
      d => d?.organizationApplicationId != null && String(d.organizationApplicationId) === key
    )
  }
  if (row.organizationId == null) return undefined
  return list.find(d => d?.organizationId != null && d.organizationId === row.organizationId)
}

export function formatWaitingOrganizationDistance(
  distances: readonly WaitingOrganizationDistance[] | null | undefined,
  row: { organizationApplicationId?: string | number | null; organizationId?: number | null }
): string {
  const hit = findWaitingOrganizationDistance(distances, row)
  return formatApiDistanceKmDisplay(hit?.distanceKm, { longDistance: hit?.longDistance })
}
