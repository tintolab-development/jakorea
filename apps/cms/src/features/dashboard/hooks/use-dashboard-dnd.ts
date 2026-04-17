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
  COL_SPAN_HALF,
  computeDragEndResult,
  getInsertIndexFromPoint,
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
  setWidgetWidth,
  getSlotRects,
  onLayoutSaved,
}: UseDashboardDndParams) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overlayRect, setOverlayRect] = useState<OverlayRect | null>(null)
  const [dropInsertIndex, setDropInsertIndex] = useState<number | null>(null)
  const lastPointerRef = useRef({ x: 0, y: 0 })
  const lastDropIndexRef = useRef<number | null>(null)
  /** 드롭 시 over가 null이어도 직전에 올려둔 위젯으로 1:1 교환하기 위함 (DragOverlay가 포인터를 가릴 수 있음) */
  const lastOverIdRef = useRef<string | null>(null)
  const slotRectsCacheRef = useRef<SlotRect[]>([])
  const slotRectsCacheTimeRef = useRef(0)
  const THROTTLE_MS = 80

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
    setDropInsertIndex(null)
    lastDropIndexRef.current = null
    lastOverIdRef.current = null
    slotRectsCacheRef.current = []
    slotRectsCacheTimeRef.current = 0
    const activator = event.activatorEvent as PointerEvent
    if (activator?.clientX != null) {
      lastPointerRef.current = { x: activator.clientX, y: activator.clientY }
    }
  }, [])

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      lastPointerRef.current.x += event.delta.x
      lastPointerRef.current.y += event.delta.y
      const { over, active } = event
      const activeIdStr = active.id as string
      const now = Date.now()
      if (getSlotRects) {
        if (
          slotRectsCacheRef.current.length === 0 ||
          now - slotRectsCacheTimeRef.current > THROTTLE_MS
        ) {
          slotRectsCacheRef.current = getSlotRects()
          slotRectsCacheTimeRef.current = now
        }
      }
      const slotRects = slotRectsCacheRef.current
      let nextIndex: number | null = null
      if (over && over.id !== active.id) {
        const overIdStr = over.id as string
        lastOverIdRef.current = overIdStr
        const overIndex = orderedIds.indexOf(overIdStr)
        if (overIndex >= 0) {
          const overRect = slotRects.find(s => s.id === overIdStr)?.rect
          nextIndex =
            overRect != null && lastPointerRef.current.x < overRect.left + overRect.width / 2
              ? overIndex
              : Math.min(overIndex + 1, orderedIds.length)
        }
      } else {
        if (!over || over.id === active.id) lastOverIdRef.current = null
        if (slotRects.length > 0) {
          const { newIndex } = getInsertIndexFromPoint(
            lastPointerRef.current,
            slotRects,
            orderedIds,
            activeIdStr
          )
          nextIndex = newIndex
        }
      }
      if (nextIndex !== lastDropIndexRef.current) {
        lastDropIndexRef.current = nextIndex
        setDropInsertIndex(nextIndex)
      }
    },
    [orderedIds, getSlotRects]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      const activeIdStr = active.id as string
      setActiveId(null)
      setOverlayRect(null)
      setDropInsertIndex(null)

      if (!userRole) return

      const oldIndex = orderedIds.indexOf(activeIdStr)
      if (oldIndex === -1) return

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
      // setOrderedIds 내부 reorderToAvoidTopGap 후처리를 유지해 상단 빈칸 보정 정책을 그대로 적용한다.
      setOrderedIds(userRole, next)

      if (computed.shouldSplit && computed.splitTargetId) {
        setWidgetWidth(userRole, computed.splitTargetId, COL_SPAN_HALF)
        setWidgetWidth(userRole, activeIdStr, COL_SPAN_HALF)
      } else if (computed.droppedInEmptySpace && !computed.skipShrinkActive) {
        const activeColSpan = getEffectiveColSpan(activeIdStr)
        if (activeColSpan === COL_SPAN_FULL && isWidgetResizable(activeIdStr)) {
          setWidgetWidth(userRole, activeIdStr, COL_SPAN_HALF)
        }
      }
      onLayoutSaved?.()
    },
    [
      orderedIds,
      setOrderedIds,
      userRole,
      getEffectiveColSpan,
      setWidgetWidth,
      getSlotRects,
      onLayoutSaved,
    ]
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setOverlayRect(null)
    setDropInsertIndex(null)
  }, [])

  return {
    activeId,
    overlayRect,
    dropInsertIndex,
    sensors,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  }
}
