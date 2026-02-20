/**
 * 대시보드 위젯 순서 상태 (DnD 정렬용)
 * 역할별 orderedIds 저장, localStorage 복원
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '@/types/user'
import type { DashboardWidgetConfig } from '@/shared/config/dashboard-config'

/**
 * 내장 드래그 핸들(WidgetTitleWithHandle)이 **없는** 위젯 목록.
 * 기본값이 true(내장 핸들 있음)이므로, 핸들이 없는 위젯만 여기에 등록하면 됩니다.
 * → 새 위젯 추가 시 별도 등록 없이 자동으로 내장 핸들로 인식됩니다.
 */
export const WIDGET_IDS_WITHOUT_BUILT_IN_HANDLE: readonly string[] = [] as const

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
  /** 위젯 고정 높이(px). undefined이면 기본값 338px 사용 */
  height?: number
}

/**
 * 정렬 단위별 메타 (colSpan, hasBuiltInHandle, height). 렌더 시 사용.
 */
export function buildDisplayItemsMeta(widgets: DashboardWidgetConfig[]): DisplayItemMeta[] {
  const noHandleSet = new Set(WIDGET_IDS_WITHOUT_BUILT_IN_HANDLE)
  return widgets.map(w => ({
    id: w.type,
    colSpan: w.colSpan ?? 24,
    hasBuiltInHandle: !noHandleSet.has(w.type),
    height: w.height,
  }))
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(b)
  return a.every(id => set.has(id))
}

export interface DashboardWidgetOrderState {
  orderByRole: Record<string, string[]>
  /** 역할별 위젯별 너비: 12(50%) | 24(100%) */
  widthByRole: Record<string, Record<string, 12 | 24>>
  setOrderedIds: (role: string, ids: string[]) => void
  getOrderedIds: (role: UserRole | null, defaultIds: string[]) => string[]
  setWidgetWidth: (role: string, widgetId: string, colSpan: 12 | 24) => void
}

export const useDashboardWidgetOrderStore = create<DashboardWidgetOrderState>()(
  persist(
    (set, get) => ({
      orderByRole: {},
      widthByRole: {},

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

      setWidgetWidth(role: string, widgetId: string, colSpan: 12 | 24) {
        set(state => ({
          widthByRole: {
            ...state.widthByRole,
            [role]: { ...(state.widthByRole[role] ?? {}), [widgetId]: colSpan },
          },
        }))
      },
    }),
    { name: STORAGE_KEY }
  )
)
