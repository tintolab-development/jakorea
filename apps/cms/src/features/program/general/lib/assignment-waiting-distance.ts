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

type ApplicationOrganizationDistanceSource = {
  organizationId?: number | null
  organizationApplicationId?: number | null
  distanceKm?: number | null
  longDistance?: boolean | null
}

function toWaitingOrganizationDistance(
  item: ApplicationOrganizationDistanceSource | null | undefined
): WaitingOrganizationDistance | null {
  const appId = item?.organizationApplicationId
  if (typeof appId !== 'number' || !Number.isFinite(appId)) return null
  const km = item?.distanceKm
  return {
    organizationId: item?.organizationId ?? null,
    organizationApplicationId: appId,
    distanceKm: typeof km === 'number' && Number.isFinite(km) ? km : null,
    longDistance: item?.longDistance ?? null,
  }
}

/**
 * 강사 신청(목록·상세) 응답의 기관별 거리.
 * `organizationDistances`(배정 대기 대상 기관 전체)를 먼저 쓰고, 거리가 없는 기관만
 * `preferredOrganizations`(희망 기관) 값으로 채운다. 신청 단위 `distanceKm`는 쓰지 않는다
 * (배정할 때마다 마지막 배정 기관 거리로 바뀌어 기관별 값이 아니다).
 */
export function collectInstructorApplicationOrganizationDistances(application: {
  organizationDistances?: readonly ApplicationOrganizationDistanceSource[] | null
  preferredOrganizations?: readonly ApplicationOrganizationDistanceSource[] | null
} | null | undefined): WaitingOrganizationDistance[] {
  const byAppId = new Map<number, WaitingOrganizationDistance>()
  const sources = [application?.organizationDistances, application?.preferredOrganizations]
  for (const source of sources) {
    for (const item of source ?? []) {
      const next = toWaitingOrganizationDistance(item)
      if (!next) continue
      const prev = byAppId.get(next.organizationApplicationId)
      if (prev?.distanceKm != null) continue
      if (prev && next.distanceKm == null) continue
      byAppId.set(next.organizationApplicationId, next)
    }
  }
  return [...byAppId.values()]
}

/** 앞 목록에 거리가 없는 기관만 뒤 목록으로 채운다 */
export function mergeWaitingOrganizationDistances(
  primary: readonly WaitingOrganizationDistance[] | null | undefined,
  fallback: readonly WaitingOrganizationDistance[] | null | undefined
): WaitingOrganizationDistance[] {
  const byAppId = new Map<number, WaitingOrganizationDistance>()
  for (const item of [...(primary ?? []), ...(fallback ?? [])]) {
    if (item?.organizationApplicationId == null) continue
    const prev = byAppId.get(item.organizationApplicationId)
    if (prev?.distanceKm != null) continue
    if (prev && item.distanceKm == null) continue
    byAppId.set(item.organizationApplicationId, item)
  }
  return [...byAppId.values()]
}

export function formatWaitingOrganizationDistance(
  distances: readonly WaitingOrganizationDistance[] | null | undefined,
  row: { organizationApplicationId?: string | number | null; organizationId?: number | null }
): string {
  const hit = findWaitingOrganizationDistance(distances, row)
  return formatApiDistanceKmDisplay(hit?.distanceKm, { longDistance: hit?.longDistance })
}
