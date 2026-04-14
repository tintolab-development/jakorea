/**
 * 대시보드 레이아웃 로직 훅 (SOC)
 * 위젯 목록·순서·colSpan·슬롯 rect 계산을 페이지에서 분리
 */

import { useMemo, useCallback, useRef } from 'react'
import type { User, UserRole } from '@/types/user'
import { getDashboardWidgetsByRole, getDashboardWidgetsForUser } from '@/shared/config/dashboard-config'
import type { DashboardWidgetConfig } from '@/shared/config/dashboard-config'
import {
  useDashboardWidgetOrderStore,
  buildDefaultDisplayItemIds,
  buildDisplayItemsMeta,
  reorderToAvoidTopGap,
  type DisplayItemMeta,
  type DashboardWidgetOrderState,
} from '@/features/dashboard/model/dashboard-widget-order-store'

export interface UseDashboardLayoutParams {
  userRole: UserRole | null
  /** 관리자 대시보드 ACL 반영 시 전달 */
  user?: Omit<User, 'password'> | null
}

export interface UseDashboardLayoutResult {
  widgets: DashboardWidgetConfig[]
  defaultIds: string[]
  displayItemsMeta: DisplayItemMeta[]
  orderedIds: string[]
  setOrderedIds: (role: string, ids: string[]) => void
  getColSpanForId: (id: string) => 12 | 24
  displayOrder: string[]
  roleWidths: Record<string, 12 | 24>
  setWidgetWidth: (role: string, widgetId: string, colSpan: 12 | 24) => void
  getSlotRects: () => { id: string; rect: DOMRect }[]
  rowRef: React.RefObject<HTMLDivElement | null>
}

export function useDashboardLayout({
  userRole,
  user,
}: UseDashboardLayoutParams): UseDashboardLayoutResult {
  const rowRef = useRef<HTMLDivElement | null>(null)

  const widgets = useMemo(() => {
    if (userRole === 'ADMIN') {
      if (user) return getDashboardWidgetsForUser(user)
      return getDashboardWidgetsByRole('ADMIN')
    }
    return getDashboardWidgetsByRole(userRole)
  }, [userRole, user])
  const defaultIds = useMemo(() => buildDefaultDisplayItemIds(widgets), [widgets])
  const displayItemsMeta = useMemo(() => buildDisplayItemsMeta(widgets), [widgets])

  const orderedIds = useDashboardWidgetOrderStore((s: DashboardWidgetOrderState) =>
    s.getOrderedIds(userRole, defaultIds)
  )
  const setOrderedIdsRaw = useDashboardWidgetOrderStore(
    (s: DashboardWidgetOrderState) => s.setOrderedIds
  )
  const widthByRole = useDashboardWidgetOrderStore((s: DashboardWidgetOrderState) => s.widthByRole)
  const setWidgetWidth = useDashboardWidgetOrderStore(
    (s: DashboardWidgetOrderState) => s.setWidgetWidth
  )
  const roleWidths = (widthByRole[userRole ?? ''] ?? {}) as Record<string, 12 | 24>

  const getColSpanForId = useCallback(
    (id: string): 12 | 24 => {
      const w = roleWidths[id]
      if (w !== undefined) return w
      const meta = displayItemsMeta.find((m: DisplayItemMeta) => m.id === id)
      return (meta?.colSpan as 12 | 24) ?? 24
    },
    [roleWidths, displayItemsMeta]
  )

  const displayOrder = useMemo(
    () => reorderToAvoidTopGap(orderedIds, getColSpanForId),
    [orderedIds, getColSpanForId]
  )

  const setOrderedIds = useCallback(
    (role: string, next: string[]) => {
      setOrderedIdsRaw(role, reorderToAvoidTopGap(next, getColSpanForId))
    },
    [setOrderedIdsRaw, getColSpanForId]
  )

  const getSlotRects = useCallback(() => {
    const rowEl = rowRef.current
    if (!rowEl) return []
    return displayOrder
      .map(id => {
        const slot = rowEl.querySelector(`[data-dashboard-slot-id="${id}"]`)
        return slot ? { id, rect: slot.getBoundingClientRect() } : null
      })
      .filter((x): x is { id: string; rect: DOMRect } => x != null)
  }, [displayOrder])

  return {
    widgets,
    defaultIds,
    displayItemsMeta,
    orderedIds,
    setOrderedIds,
    getColSpanForId,
    displayOrder,
    roleWidths,
    setWidgetWidth,
    getSlotRects,
    rowRef,
  }
}
