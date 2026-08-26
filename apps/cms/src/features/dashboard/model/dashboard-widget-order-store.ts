/**
 * 대시보드 위젯 순서 상태 (DnD 정렬용)
 * 역할별 orderedIds 저장, localStorage 복원
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '@/types/user'
import type { DashboardWidgetConfig, DashboardWidgetSlotHeightPx } from '@/shared/config/dashboard-config'

/**
 * 내장 드래그 핸들(WidgetTitleWithHandle)이 **없는** 위젯 목록.
 * 기본값이 true(내장 핸들 있음)이므로, 핸들이 없는 위젯만 여기에 등록하면 됩니다.
 * → 새 위젯 추가 시 별도 등록 없이 자동으로 내장 핸들로 인식됩니다.
 */
export const WIDGET_IDS_WITHOUT_BUILT_IN_HANDLE: readonly string[] = [] as const

const STORAGE_KEY = 'dashboard-widget-order'
const PERSIST_VERSION = 6

/** 백엔드에서 홈 위젯/API가 제거된 id (FE `log-alerts-widget`, BE `log-alert-widget`) */
const REMOVED_DASHBOARD_WIDGET_IDS = new Set(['log-alerts-widget', 'log-alert-widget'])

const HIDDEN_ADMIN_SCHEDULE_WIDGET_IDS = [
  'program-schedule-economy-widget',
  'program-schedule-company-school-widget',
  'program-schedule-ujat-widget',
  'program-schedule-gemini-widget',
] as const

function stripHiddenAdminScheduleWidgets(ids: string[]): string[] {
  const hidden = new Set<string>(HIDDEN_ADMIN_SCHEDULE_WIDGET_IDS)
  return ids.filter(id => !hidden.has(id))
}

export function stripRemovedDashboardWidgetIds(ids: string[]): string[] {
  return ids.filter(id => !REMOVED_DASHBOARD_WIDGET_IDS.has(id))
}

export function stripRemovedDashboardWidgetWidths(
  widths: Record<string, 12 | 24> | undefined
): Record<string, 12 | 24> | undefined {
  if (!widths) return widths
  const next = { ...widths }
  for (const id of REMOVED_DASHBOARD_WIDGET_IDS) {
    delete next[id]
  }
  return next
}

function renameWidgetId(ids: string[], from: string, to: string): string[] {
  return ids.map(id => (id === from ? to : id))
}

function migrateWidgetIdKey(
  widths: Record<string, 12 | 24> | undefined,
  from: string,
  to: string
): Record<string, 12 | 24> | undefined {
  if (!widths || widths[from] === undefined) return widths
  const { [from]: val, ...rest } = widths
  return { ...rest, [to]: val }
}

interface PersistedLayoutState {
  orderByRole: Record<string, string[]>
  widthByRole: Record<string, Record<string, 12 | 24>>
}

function migrateLayoutState(persisted: unknown, version: number): PersistedLayoutState {
  if (
    persisted != null &&
    typeof persisted === 'object' &&
    'orderByRole' in persisted &&
    'widthByRole' in persisted
  ) {
    const p = persisted as PersistedLayoutState
    if (
      typeof p.orderByRole === 'object' &&
      p.orderByRole !== null &&
      typeof p.widthByRole === 'object' &&
      p.widthByRole !== null
    ) {
      let { orderByRole, widthByRole } = p

      if (version < 2) {
        const adminOrder = orderByRole['ADMIN']
        if (adminOrder) {
          const idx = adminOrder.indexOf('program-schedule-widget')
          if (idx !== -1) {
            const next = [...adminOrder]
            next.splice(
              idx,
              1,
              'program-schedule-general-widget',
              'program-schedule-economy-widget',
              'program-schedule-gemini-widget'
            )
            orderByRole = { ...orderByRole, ADMIN: next }
          }
        }
        const adminWidths = widthByRole['ADMIN']
        if (adminWidths && adminWidths['program-schedule-widget'] !== undefined) {
          const val = adminWidths['program-schedule-widget']
          const { 'program-schedule-widget': _removed, ...rest } = adminWidths
          widthByRole = {
            ...widthByRole,
            ADMIN: {
              ...rest,
              'program-schedule-general-widget': val,
              'program-schedule-economy-widget': val,
              'program-schedule-gemini-widget': val,
            },
          }
        }
      }

      if (version < 3) {
        const adminOrder = orderByRole['ADMIN']
        if (adminOrder && !adminOrder.includes('program-schedule-ujat-widget')) {
          const next = [...adminOrder]
          const ecoIdx = next.indexOf('program-schedule-economy-widget')
          const gemIdx = next.indexOf('program-schedule-gemini-widget')
          if (ecoIdx !== -1) {
            next.splice(ecoIdx + 1, 0, 'program-schedule-ujat-widget')
          } else if (gemIdx !== -1) {
            next.splice(gemIdx, 0, 'program-schedule-ujat-widget')
          } else {
            next.push('program-schedule-ujat-widget')
          }
          orderByRole = { ...orderByRole, ADMIN: next }
        }
        const adminWidths = widthByRole['ADMIN']
        if (
          adminWidths &&
          adminWidths['program-schedule-ujat-widget'] === undefined &&
          adminWidths['program-schedule-economy-widget'] !== undefined
        ) {
          widthByRole = {
            ...widthByRole,
            ADMIN: {
              ...adminWidths,
              'program-schedule-ujat-widget': adminWidths['program-schedule-economy-widget'],
            },
          }
        }
      }

      if (version < 4) {
        const adminOrder = orderByRole['ADMIN']
        if (adminOrder?.includes('program-schedule-economy-widget')) {
          orderByRole = {
            ...orderByRole,
            ADMIN: renameWidgetId(
              adminOrder,
              'program-schedule-economy-widget',
              'program-schedule-company-school-widget'
            ),
          }
        }
        const adminWidths = widthByRole['ADMIN']
        const migratedWidths = migrateWidgetIdKey(
          adminWidths,
          'program-schedule-economy-widget',
          'program-schedule-company-school-widget'
        )
        if (migratedWidths && migratedWidths !== adminWidths) {
          widthByRole = { ...widthByRole, ADMIN: migratedWidths }
        }
      }

      if (version < 5) {
        const adminOrder = orderByRole['ADMIN']
        if (adminOrder) {
          orderByRole = {
            ...orderByRole,
            ADMIN: stripHiddenAdminScheduleWidgets(adminOrder),
          }
        }
        const adminWidths = widthByRole['ADMIN']
        if (adminWidths) {
          const next = { ...adminWidths }
          for (const id of HIDDEN_ADMIN_SCHEDULE_WIDGET_IDS) {
            delete next[id]
          }
          widthByRole = { ...widthByRole, ADMIN: next }
        }
      }

      if (version < 6) {
        const nextOrder: Record<string, string[]> = {}
        for (const [role, ids] of Object.entries(orderByRole)) {
          nextOrder[role] = stripRemovedDashboardWidgetIds(ids)
        }
        orderByRole = nextOrder

        const nextWidths: Record<string, Record<string, 12 | 24>> = {}
        for (const [role, widths] of Object.entries(widthByRole)) {
          nextWidths[role] = stripRemovedDashboardWidgetWidths(widths) ?? {}
        }
        widthByRole = nextWidths
      }

      return { orderByRole, widthByRole }
    }
  }
  return { orderByRole: {}, widthByRole: {} }
}

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
  /** 슬롯 인라인 높이(colSpan별). getSlotHeight 우선 */
  slotHeightPx?: DashboardWidgetSlotHeightPx
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
    slotHeightPx: w.slotHeightPx,
  }))
}

/**
 * localStorage에 남은 순서와 현재 권한·ACL 기준 `defaultIds`를 합침.
 * - 제거된 위젯 id는 무시
 * - 새로 생긴 위젯은 `defaultIds` 순서대로 뒤에 붙음
 * - 사용자가 맞춰 둔 상대 순서는 유지
 */
export function mergeOrderedIdsWithDefaults(saved: string[] | undefined, defaultIds: string[]): string[] {
  if (defaultIds.length === 0) return []
  if (!saved?.length) return defaultIds
  const valid = new Set(defaultIds)
  const kept: string[] = []
  const seen = new Set<string>()
  for (const id of saved) {
    if (valid.has(id) && !seen.has(id)) {
      seen.add(id)
      kept.push(id)
    }
  }
  for (const id of defaultIds) {
    if (!seen.has(id)) kept.push(id)
  }
  return kept
}

/**
 * 상단 빈 영역 방지: 첫 번째가 50%(12), 두 번째가 100%(24)이면 서로 바꾼다.
 * Row에서 50% 다음에 100%가 오면 100%가 다음 줄로 내려가 첫 줄 오른쪽이 비므로, 100%를 앞으로 보낸다.
 */
export function reorderToAvoidTopGap(
  ids: string[],
  getColSpan: (id: string) => 12 | 24
): string[] {
  if (ids.length < 2) return ids
  const a = getColSpan(ids[0])
  const b = getColSpan(ids[1])
  if (a === 12 && b === 24) return [ids[1], ids[0], ...ids.slice(2)]
  return ids
}

export interface DashboardWidgetOrderState {
  orderByRole: Record<string, string[]>
  /** 역할별 위젯별 너비: 12(50%) | 24(100%) */
  widthByRole: Record<string, Record<string, 12 | 24>>
  setOrderedIds: (role: string, ids: string[]) => void
  getOrderedIds: (role: UserRole | null, defaultIds: string[]) => string[]
  setWidgetWidth: (role: string, widgetId: string, colSpan: 12 | 24) => void
  /** 해당 역할의 위젯 순서·너비를 기본값으로 초기화 */
  resetLayoutForRole: (role: string, defaultIds: string[]) => void
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
        return mergeOrderedIdsWithDefaults(saved, defaultIds)
      },

      setWidgetWidth(role: string, widgetId: string, colSpan: 12 | 24) {
        set(state => ({
          widthByRole: {
            ...state.widthByRole,
            [role]: { ...(state.widthByRole[role] ?? {}), [widgetId]: colSpan },
          },
        }))
      },

      resetLayoutForRole(role: string, defaultIds: string[]) {
        set(state => ({
          orderByRole: { ...state.orderByRole, [role]: defaultIds },
          widthByRole: { ...state.widthByRole, [role]: {} },
        }))
      },
    }),
    {
      name: STORAGE_KEY,
      version: PERSIST_VERSION,
      migrate: migrateLayoutState,
    }
  )
)
