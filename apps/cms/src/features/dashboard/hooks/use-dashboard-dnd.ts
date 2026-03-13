/**
 * 대시보드 DnD(드래그 앤 드롭) 로직 훅
 * 비즈니스 로직: orderedIds 변경 시 setOrderedIds(role, next) 호출 — 동일 유지
 *
 * - 100% 위젯 오른쪽 드롭 시 50% 분할 및 나머지 위젯 재정렬
 * - 빈 공간 드롭: over가 없을 때 포인터 위치로 삽입 인덱스 계산
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

const COL_SPAN_FULL = 24
const COL_SPAN_HALF = 12

/** 100% 위젯 위 드롭 시: 포인터가 가운데 이 비율(40%) 안이면 오버레이→순서만, 좌/우 치우침이면 50% 분할 */
const FULL_WIDTH_CENTER_RATIO = 0.4

export interface SlotRect {
  id: string
  rect: DOMRect
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

/**
 * 포인터 위치로 삽입 인덱스 계산 (빈 공간 또는 슬롯 기준).
 * 반환: { newIndex, insertAfterId } — insertAfterId가 100%이면 50% 분할 대상.
 * @param excludeId 이 id의 슬롯은 무시(드래그 중인 위젯의 빈 자리 제외)
 *
 * 영역 판단: 행(row) 단위로 먼저 결정한 뒤, 그 행 안에서 가로 위치로 앞/뒤 삽입.
 * - 같은 세로 구간(행)에 있으면 "이 행의 빈 오른쪽"이 명확히 "마지막 위젯 뒤"로 잡힘.
 */
function getInsertIndexFromPoint(
  point: { x: number; y: number },
  slotRects: SlotRect[],
  orderedIds: string[],
  excludeId: string | null
): { newIndex: number; insertAfterId: string | null } {
  if (slotRects.length === 0) return { newIndex: orderedIds.length, insertAfterId: null }

  const ROW_OVERLAP_THRESHOLD = 8 // 세로로 이만큼 겹치면 같은 행

  // 1) 행 구성: orderedIds 순서대로 슬롯을 돌며, 세로(top/bottom)가 겹치는 구간을 한 행으로 묶음
  interface RowItem {
    slot: SlotRect
    index: number
  }
  const rows: { top: number; bottom: number; items: RowItem[] }[] = []

  for (let i = 0; i < slotRects.length; i++) {
    if (slotRects[i].id === excludeId) continue
    const r = slotRects[i].rect
    const item: RowItem = { slot: slotRects[i], index: i }
    const rowTop = r.top
    const rowBottom = r.bottom

    const lastRow = rows[rows.length - 1]
    const overlapsLast =
      lastRow &&
      Math.min(lastRow.bottom, rowBottom) - Math.max(lastRow.top, rowTop) > ROW_OVERLAP_THRESHOLD
    if (lastRow && overlapsLast) {
      lastRow.items.push(item)
      lastRow.top = Math.min(lastRow.top, rowTop)
      lastRow.bottom = Math.max(lastRow.bottom, rowBottom)
    } else {
      rows.push({ top: rowTop, bottom: rowBottom, items: [item] })
    }
  }

  // 2) 포인터가 속한 행 찾기 (세로 구간)
  let targetRow: { top: number; bottom: number; items: RowItem[] } | null = null
  for (const row of rows) {
    if (point.y >= row.top - ROW_OVERLAP_THRESHOLD && point.y <= row.bottom + ROW_OVERLAP_THRESHOLD) {
      targetRow = row
      break
    }
  }
  if (!targetRow) {
    // 포인터가 어떤 행에도 없으면 기존 방식: 가장 가까운 슬롯(세로 우선)
    let bestIdx = 0
    let bestDist = Infinity
    for (let i = 0; i < slotRects.length; i++) {
      if (slotRects[i].id === excludeId) continue
      const r = slotRects[i].rect
      const cy = r.top + r.height / 2
      const cx = r.left + r.width / 2
      const dist = Math.abs(point.y - cy) * 2 + Math.abs(point.x - cx)
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = i
      }
    }
    if (bestDist === Infinity) return { newIndex: orderedIds.length, insertAfterId: null }
    const r = slotRects[bestIdx].rect
    const centerX = r.left + r.width / 2
    const insertAfter = point.x > centerX
    return {
      newIndex: insertAfter ? Math.min(bestIdx + 1, orderedIds.length) : bestIdx,
      insertAfterId: insertAfter ? orderedIds[bestIdx] : null,
    }
  }

  // 3) 해당 행 안에서 가로 위치로 삽입 인덱스 결정
  const items = targetRow.items
  const firstIdx = items[0].index
  const lastIdx = items[items.length - 1].index

  for (let j = 0; j < items.length; j++) {
    const r = items[j].slot.rect
    if (point.x >= r.left && point.x <= r.right && point.y >= r.top && point.y <= r.bottom) {
      const centerX = r.left + r.width / 2
      const insertAfter = point.x > centerX
      return {
        newIndex: insertAfter ? Math.min(items[j].index + 1, orderedIds.length) : items[j].index,
        insertAfterId: insertAfter ? orderedIds[items[j].index] : null,
      }
    }
  }

  // 포인터가 이 행의 슬롯 밖(빈 공간 또는 gutter)
  if (point.x <= items[0].slot.rect.left) {
    return { newIndex: firstIdx, insertAfterId: null }
  }
  if (point.x >= items[items.length - 1].slot.rect.right) {
    return {
      newIndex: Math.min(lastIdx + 1, orderedIds.length),
      insertAfterId: orderedIds[lastIdx],
    }
  }
  // 두 슬롯 사이(gutter 등): 오른쪽 슬롯 앞에 삽입
  for (let j = 0; j < items.length - 1; j++) {
    const leftRight = items[j].slot.rect.right
    const rightLeft = items[j + 1].slot.rect.left
    if (point.x > leftRight && point.x < rightLeft) {
      return {
        newIndex: items[j + 1].index,
        insertAfterId: null,
      }
    }
  }
  return {
    newIndex: Math.min(lastIdx + 1, orderedIds.length),
    insertAfterId: orderedIds[lastIdx],
  }
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
            overRect != null &&
            lastPointerRef.current.x < overRect.left + overRect.width / 2
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
      setDropInsertIndex(null)

      if (!userRole) return

      const oldIndex = orderedIds.indexOf(activeIdStr)
      if (oldIndex === -1) return

      const slotRects = getSlotRects?.() ?? []

      let newIndex: number
      let overIdStr: string | null = over ? (over.id as string) : null
      let shouldSplit = false
      let droppedInEmptySpace = false
      let skipShrinkActive = false

      // 드롭 시 over가 null이어도 직전에 올려둔 위젯이 있으면 1:1 교환 (DragOverlay가 포인터를 가릴 수 있음)
      const effectiveOverId =
        overIdStr && activeIdStr !== overIdStr
          ? overIdStr
          : lastOverIdRef.current && lastOverIdRef.current !== activeIdStr
            ? lastOverIdRef.current
            : null

      if (effectiveOverId) {
        overIdStr = effectiveOverId
        const overIndex = orderedIds.indexOf(overIdStr)
        if (overIndex === -1) return

        const targetColSpan = getEffectiveColSpan(overIdStr)
        const activeColSpan = getEffectiveColSpan(activeIdStr)
        const isTargetFullWidth =
          targetColSpan === COL_SPAN_FULL &&
          isWidgetResizable(overIdStr) &&
          isWidgetResizable(activeIdStr)

        // 100%↔100%: 항상 1:1 위치 교환. 중앙이면 사이즈 유지, 좌/우 치우침이면 둘 다 50% 분할
        if (isTargetFullWidth) {
          let pointerInCenter = false
          const overRect = slotRects.find(s => s.id === overIdStr)?.rect
          if (overRect && overRect.width > 0) {
            const ratio = (lastPointerRef.current.x - overRect.left) / overRect.width
            const half = (1 - FULL_WIDTH_CENTER_RATIO) / 2 // 좌측 치우침 구간 끝
            pointerInCenter = ratio >= half && ratio <= 1 - half
          }
          newIndex = overIndex
          if (!pointerInCenter) {
            shouldSplit = true
          }
        } else if (targetColSpan === activeColSpan) {
          // 같은 크기(50%↔50%)만 1:1 위치 교환
          newIndex = overIndex
        } else {
          // 100%를 50% 위젯 위에 드롭 → 그 자리를 차지(스왑)하고 50%로 축소. 문의 현황 등이 아래로 이동.
          if (activeColSpan === COL_SPAN_FULL && targetColSpan === COL_SPAN_HALF && isWidgetResizable(activeIdStr)) {
            newIndex = overIndex
            droppedInEmptySpace = true
          } else {
            // 그 외(50%를 100% 위에 등): 위젯 위에 드롭 시 1:1 교환
            newIndex = overIndex
          }
        }
      } else if (slotRects.length > 0) {
        // 빈 공간 드롭: 포인터 위치로 삽입 인덱스 계산 (드래그 중인 위젯 자리는 제외)
        const point = lastPointerRef.current
        const { newIndex: idx, insertAfterId } = getInsertIndexFromPoint(
          point,
          slotRects,
          orderedIds,
          activeIdStr
        )
        newIndex = idx
        if (insertAfterId && newIndex > 0) {
          const targetColSpan = getEffectiveColSpan(insertAfterId)
          const couldSplit =
            targetColSpan === COL_SPAN_FULL &&
            isWidgetResizable(insertAfterId) &&
            isWidgetResizable(activeIdStr)
          if (couldSplit) {
            // 100% 위젯 옆에 삽입 시에도: 포인터가 해당 위젯 중앙이면 순서만, 좌/우 치우침이면 50% 분할
            const overRect = slotRects.find(s => s.id === insertAfterId)?.rect
            if (overRect && overRect.width > 0) {
              const ratio = (point.x - overRect.left) / overRect.width
              const half = (1 - FULL_WIDTH_CENTER_RATIO) / 2
              const pointerInCenter = ratio >= half && ratio <= 1 - half
              if (!pointerInCenter) {
                shouldSplit = true
                overIdStr = insertAfterId
              } else {
                skipShrinkActive = true
              }
            } else {
              shouldSplit = true
              overIdStr = insertAfterId
            }
          }
        }
        droppedInEmptySpace = true
      } else {
        return
      }

      const next = arrayMove(orderedIds, oldIndex, newIndex)
      setOrderedIds(userRole, next)

      if (shouldSplit && overIdStr) {
        setWidgetWidth(userRole, overIdStr, COL_SPAN_HALF)
        setWidgetWidth(userRole, activeIdStr, COL_SPAN_HALF)
      } else if (droppedInEmptySpace && !skipShrinkActive) {
        const activeColSpan = getEffectiveColSpan(activeIdStr)
        if (
          activeColSpan === COL_SPAN_FULL &&
          isWidgetResizable(activeIdStr)
        ) {
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
    setDropInsertIndex(null)
  }, [])

  return {
    activeId,
    dropInsertIndex,
    sensors,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  }
}
