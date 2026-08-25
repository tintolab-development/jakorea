/**
 * 대시보드 DnD(드래그 앤 드롭) 로직 훅
 * 비즈니스 로직: orderedIds 변경 시 setOrderedIds(role, next) 호출 — 동일 유지
 *
 * - 100% 위젯 오른쪽 드롭 시 50% 분할 및 나머지 위젯 재정렬
 * - 빈 공간 드롭: over가 없을 때 포인터 위치로 삽입 인덱스 계산
 *
 * 순수 계산은 lib/dashboard-dnd-helpers.ts
 */

import { useState, useCallback, useRef } from 'react'
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragMoveEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { DisplayItemMeta } from '@/features/dashboard/model/dashboard-widget-order-store'
import { isWidgetResizable } from '@/shared/config/dashboard-config'
import {
  COL_SPAN_FULL,
  areWidgetIdListsEqual,
  computeDragEndResult,
  type SlotRect,
} from '@/features/dashboard/lib/dashboard-dnd-helpers'

export type { SlotRect }

interface OverlayRect {
  width: number
  height: number
}

function swapArrayItems<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return arr
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= arr.length || toIndex >= arr.length) return arr
  const next = [...arr]
  const temp = next[fromIndex]
  next[fromIndex] = next[toIndex]
  next[toIndex] = temp
  return next
}

export interface UseDashboardDndParams {
  orderedIds: string[]
  setOrderedIds: (role: string, ids: string[]) => void
  userRole: string | null
  /** 역할별 위젯별 너비 (12 | 24) */
  roleWidths: Record<string, 12 | 24>
  displayItemsMeta: DisplayItemMeta[]
  setWidgetWidth: (role: string, widgetId: string, colSpan: 12 | 24) => void
  /** 빈 공간 드롭 시 슬롯 rect 목록 (orderedIds 순서). 없으면 빈 공간 드롭 비활성화 */
  getSlotRects?: () => SlotRect[]
  /** 순서/너비 변경 후 저장 피드백용 (토스트 등) — 한 번만 호출 */
  onLayoutSaved?: () => void
}

export function useDashboardDnd({
  orderedIds,
  setOrderedIds,
  userRole,
  roleWidths,
  displayItemsMeta,
  getSlotRects,
  onLayoutSaved,
}: UseDashboardDndParams) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overlayRect, setOverlayRect] = useState<OverlayRect | null>(null)
  const pointerOriginRef = useRef({ x: 0, y: 0 })
  const lastPointerRef = useRef({ x: 0, y: 0 })
  /** 드롭 시 over가 null이어도 직전에 올려둔 위젯으로 1:1 교환하기 위함 (DragOverlay가 포인터를 가릴 수 있음) */
  const lastOverIdRef = useRef<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const getEffectiveColSpan = useCallback(
    (widgetId: string): 12 | 24 => {
      const stored = roleWidths[widgetId]
      if (stored !== undefined) return stored
      const meta = displayItemsMeta.find(m => m.id === widgetId)
      return (meta?.colSpan as 12 | 24) ?? COL_SPAN_FULL
    },
    [roleWidths, displayItemsMeta]
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    const activeRect = event.active.rect.current.initial ?? event.active.rect.current.translated
    if (activeRect && activeRect.width > 0 && activeRect.height > 0) {
      setOverlayRect({ width: activeRect.width, height: activeRect.height })
    } else {
      setOverlayRect(null)
    }
    lastOverIdRef.current = null
    const activator = event.activatorEvent as PointerEvent
    if (activator?.clientX != null) {
      pointerOriginRef.current = { x: activator.clientX, y: activator.clientY }
      lastPointerRef.current = { x: activator.clientX, y: activator.clientY }
    }
  }, [])

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    lastPointerRef.current = {
      x: pointerOriginRef.current.x + event.delta.x,
      y: pointerOriginRef.current.y + event.delta.y,
    }
    const { over, active } = event
    if (over && over.id !== active.id) {
      lastOverIdRef.current = over.id as string
      return
    }
    lastOverIdRef.current = null
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      const activeIdStr = active.id as string
      setActiveId(null)
      setOverlayRect(null)

      if (!userRole) return

      const oldIndex = orderedIds.indexOf(activeIdStr)
      if (oldIndex === -1) return

      lastPointerRef.current = {
        x: pointerOriginRef.current.x + event.delta.x,
        y: pointerOriginRef.current.y + event.delta.y,
      }

      const slotRects = getSlotRects?.() ?? []

      const overIdStr: string | null = over ? (over.id as string) : null

      const effectiveOverId =
        overIdStr && activeIdStr !== overIdStr
          ? overIdStr
          : lastOverIdRef.current && lastOverIdRef.current !== activeIdStr
            ? lastOverIdRef.current
            : null

      const computed = computeDragEndResult(
        orderedIds,
        activeIdStr,
        effectiveOverId,
        lastPointerRef.current,
        slotRects,
        getEffectiveColSpan,
        isWidgetResizable
      )
      if (!computed) return

      const next =
        computed.operation === 'swap' && computed.swapTargetId
          ? swapArrayItems(orderedIds, oldIndex, orderedIds.indexOf(computed.swapTargetId))
          : arrayMove(orderedIds, oldIndex, computed.newIndex)

      if (areWidgetIdListsEqual(orderedIds, next)) return

      setOrderedIds(userRole, next)

      // QA 중 UI 안정성을 위해 DnD는 순서 이동만 처리하고,
      // 위젯 너비(12/24)는 리사이즈 핸들에서만 변경한다.
      onLayoutSaved?.()
    },
    [
      orderedIds,
      setOrderedIds,
      userRole,
      getEffectiveColSpan,
      getSlotRects,
      onLayoutSaved,
    ]
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setOverlayRect(null)
  }, [])

  return {
    activeId,
    overlayRect,
    sensors,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  }
}
