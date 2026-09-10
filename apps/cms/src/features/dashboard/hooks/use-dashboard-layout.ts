/**
 * 대시보드 레이아웃 로직 훅 (SOC)
 * 위젯 목록·순서·colSpan·슬롯 rect 계산을 페이지에서 분리
 */

import { useMemo, useCallback, useRef } from 'react'
import type { User, UserRole } from '@/types/user'
import { getDashboardWidgetsByRole, getDashboardWidgetsForUser, assignedProgramTypesForWidgetLayout } from '@/shared/config/dashboard-config'
import type { DashboardWidgetConfig } from '@/shared/config/dashboard-config'
import {
  useDashboardWidgetOrderStore,
  buildDefaultDisplayItemIds,
  buildDisplayItemsMeta,
  mergeOrderedIdsWithDefaults,
  reorderToAvoidTopGap,
  type DisplayItemMeta,
  type DashboardWidgetOrderState,
} from '@/features/dashboard/model/dashboard-widget-order-store'
import {
  SHORTCUT_ITEMS,
  isShortcutItemEnabled,
  useDashboardSettingsStore,
} from '@/features/dashboard/model/dashboard-settings-store'
import { useDashboardQueryScope } from '@/features/dashboard/hooks/use-dashboard-query-scope'

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
  /** DnD·그리드에 실제로 올리는 id 순서(바로가기를 모두 끄면 `menu-shortcut-widget` 제외) */
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

  const queryScope = useDashboardQueryScope()
  const assignedProgramTypes = useDashboardSettingsStore(s => s.assignedProgramTypes)
  const scheduleKinds = assignedProgramTypesForWidgetLayout(
    assignedProgramTypes,
    queryScope === 'remote'
  )

  const widgets = useMemo(() => {
    if (userRole === 'ADMIN') {
      if (user) return getDashboardWidgetsForUser(user, scheduleKinds)
      return getDashboardWidgetsByRole('ADMIN')
    }
    return getDashboardWidgetsByRole(userRole)
  }, [userRole, user, scheduleKinds])
  const defaultIds = useMemo(() => buildDefaultDisplayItemIds(widgets), [widgets])
  const displayItemsMeta = useMemo(() => buildDisplayItemsMeta(widgets), [widgets])

  /** getOrderedIds()는 호출마다 새 배열을 만들어 셀렉터에 쓰면 구독이 매번 “변경”으로 처리되어 무한 렌더가 난다. 역할별 저장 순서만 구독한다. */
  const savedOrderForRole = useDashboardWidgetOrderStore(s =>
    userRole ? s.orderByRole[userRole] : undefined
  )
  const orderedIds = useMemo(() => {
    if (!userRole || defaultIds.length === 0) return defaultIds
    return mergeOrderedIdsWithDefaults(savedOrderForRole, defaultIds)
  }, [userRole, defaultIds, savedOrderForRole])
  const setOrderedIdsRaw = useDashboardWidgetOrderStore(
    (s: DashboardWidgetOrderState) => s.setOrderedIds
  )
  const widthByRole = useDashboardWidgetOrderStore((s: DashboardWidgetOrderState) => s.widthByRole)
  const setWidgetWidth = useDashboardWidgetOrderStore(
    (s: DashboardWidgetOrderState) => s.setWidgetWidth
  )
  const shortcutEnabled = useDashboardSettingsStore(s => s.shortcutEnabled)
  const hasVisibleMenuShortcuts = useMemo(
    () => SHORTCUT_ITEMS.some(item => isShortcutItemEnabled(shortcutEnabled, item.id)),
    [shortcutEnabled]
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

  const fullLayoutOrder = useMemo(
    () => reorderToAvoidTopGap(orderedIds, getColSpanForId),
    [orderedIds, getColSpanForId]
  )

  const displayOrder = useMemo(() => {
    if (hasVisibleMenuShortcuts) return fullLayoutOrder
    return fullLayoutOrder.filter(id => id !== 'menu-shortcut-widget')
  }, [fullLayoutOrder, hasVisibleMenuShortcuts])

  const setOrderedIds = useCallback(
    (role: string, next: string[]) => {
      const full = reorderToAvoidTopGap(orderedIds, getColSpanForId)
      const menuIndex = full.indexOf('menu-shortcut-widget')
      if (menuIndex === -1 || hasVisibleMenuShortcuts) {
        setOrderedIdsRaw(role, reorderToAvoidTopGap(next, getColSpanForId))
        return
      }
      const nextFull = [...next]
      nextFull.splice(menuIndex, 0, 'menu-shortcut-widget')
      setOrderedIdsRaw(role, reorderToAvoidTopGap(nextFull, getColSpanForId))
    },
    [orderedIds, getColSpanForId, hasVisibleMenuShortcuts, setOrderedIdsRaw]
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
