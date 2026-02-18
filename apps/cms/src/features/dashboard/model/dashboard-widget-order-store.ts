/**
 * 대시보드 위젯 순서 상태 (DnD 정렬용)
 * 역할별 orderedIds 저장, localStorage 복원
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '@/types/user'
import type { DashboardWidgetConfig } from '@/shared/config/dashboard-config'

export const WIDGET_IDS_WITH_BUILT_IN_HANDLE = [
  'notification-widget',
  'customer-inquiry-status-widget',
  'program-schedule-widget',
  'program-progress-tabs-table',
] as const

const STORAGE_KEY = 'dashboard-widget-order'

/**
 * config 위젯 배열에서 정렬 단위 id 목록 생성
 * - 각 위젯 → type 그대로 id로 사용 (개별 DnD)
 */
export function buildDefaultDisplayItemIds(widgets: DashboardWidgetConfig[]): string[] {
  return widgets.map(w => w.type)
}

export interface DisplayItemMeta {
  id: string
  colSpan: number
  hasBuiltInHandle: boolean
}

/**
 * 정렬 단위별 메타 (colSpan, hasBuiltInHandle). 렌더 시 사용.
 */
export function buildDisplayItemsMeta(widgets: DashboardWidgetConfig[]): DisplayItemMeta[] {
  const handleSet = new Set(WIDGET_IDS_WITH_BUILT_IN_HANDLE)
  return widgets.map(w => ({
    id: w.type,
    colSpan: w.colSpan ?? 6,
    hasBuiltInHandle: handleSet.has(w.type as (typeof WIDGET_IDS_WITH_BUILT_IN_HANDLE)[number]),
  }))
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(b)
  return a.every(id => set.has(id))
}

export interface DashboardWidgetOrderState {
  orderByRole: Record<string, string[]>
  setOrderedIds: (role: string, ids: string[]) => void
  getOrderedIds: (role: UserRole | null, defaultIds: string[]) => string[]
}

export const useDashboardWidgetOrderStore = create<DashboardWidgetOrderState>()(
  persist(
    (set, get) => ({
      orderByRole: {},

      setOrderedIds(role: string, ids: string[]) {
        set(state => ({
          orderByRole: { ...state.orderByRole, [role]: ids },
        }))
      },

      getOrderedIds(role: UserRole | null, defaultIds: string[]): string[] {
        if (!role || defaultIds.length === 0) return defaultIds
        const saved = get().orderByRole[role]
        if (!saved || !sameSet(saved, defaultIds)) return defaultIds
        return saved
      },
    }),
    { name: STORAGE_KEY }
  )
)
