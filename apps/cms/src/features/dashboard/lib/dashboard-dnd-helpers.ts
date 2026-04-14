/**
 * 대시보드 DnD 순수 로직 (테스트·훅 공용)
 * @see use-dashboard-dnd.ts
 */

export const COL_SPAN_FULL = 24
export const COL_SPAN_HALF = 12

/** 100% 위젯 위 드롭 시 중앙 밴드 계산에 사용하는 비율(빈 공간 드롭 분할 판정에 사용) */
export const FULL_WIDTH_CENTER_RATIO = 0.4

export interface SlotRect {
  id: string
  rect: DOMRect
}

export interface DragEndComputed {
  newIndex: number
  /** 드롭 의도: 위젯 위 드롭은 swap, 빈 공간 포인터 삽입은 move */
  operation: 'swap' | 'move'
  /** swap 시 맞교환 대상 위젯 id */
  swapTargetId: string | null
  shouldSplit: boolean
  /** 50% 분할 시 함께 줄일 100% 위젯 id (setWidgetWidth 첫 인자) */
  splitTargetId: string | null
  droppedInEmptySpace: boolean
  skipShrinkActive: boolean
}

/** 포인터가 100% 슬롯 중앙 밴드 안에 있는지 (분할하지 않음) */
export function isPointerInFullWidthCenterBand(
  pointerX: number,
  rect: DOMRect,
  centerRatio = FULL_WIDTH_CENTER_RATIO
): boolean {
  if (rect.width <= 0) return false
  const ratio = (pointerX - rect.left) / rect.width
  const half = (1 - centerRatio) / 2
  return ratio >= half && ratio <= 1 - half
}

/**
 * 드래그 종료 시 삽입 인덱스·분할 여부 계산 (React/DnD 없음)
 */
export function computeDragEndResult(
  orderedIds: string[],
  activeIdStr: string,
  effectiveOverId: string | null,
  pointer: { x: number; y: number },
  slotRects: SlotRect[],
  getEffectiveColSpan: (id: string) => 12 | 24,
  isResizable: (id: string) => boolean
): DragEndComputed | null {
  const oldIndex = orderedIds.indexOf(activeIdStr)
  if (oldIndex === -1) return null

  let newIndex = 0
  let operation: 'swap' | 'move' = 'move'
  let swapTargetId: string | null = null
  let shouldSplit = false
  let splitTargetId: string | null = null
  let droppedInEmptySpace = false
  let skipShrinkActive = false

  if (effectiveOverId) {
    const overIdStr = effectiveOverId
    const overIndex = orderedIds.indexOf(overIdStr)
    if (overIndex === -1) return null

    const targetColSpan = getEffectiveColSpan(overIdStr)
    const activeColSpan = getEffectiveColSpan(activeIdStr)
    const isTargetFullWidth =
      targetColSpan === COL_SPAN_FULL && isResizable(overIdStr) && isResizable(activeIdStr)
    operation = 'swap'
    swapTargetId = overIdStr

    if (isTargetFullWidth) {
      newIndex = overIndex
      // 위젯 위 드롭은 사용자 의도를 1:1 교환으로 해석한다.
      // 분할(50/50)은 over가 없는 빈 공간 드롭 경로에서만 판정한다.
    } else if (targetColSpan === activeColSpan) {
      newIndex = overIndex
    } else {
      if (
        activeColSpan === COL_SPAN_FULL &&
        targetColSpan === COL_SPAN_HALF &&
        isResizable(activeIdStr)
      ) {
        newIndex = overIndex
        droppedInEmptySpace = true
      } else {
        newIndex = overIndex
      }
    }
  } else if (slotRects.length > 0) {
    const { newIndex: idx, insertAfterId } = getInsertIndexFromPoint(
      pointer,
      slotRects,
      orderedIds,
      activeIdStr
    )
    newIndex = idx
    if (insertAfterId && newIndex > 0) {
      const targetColSpan = getEffectiveColSpan(insertAfterId)
      const couldSplit =
        targetColSpan === COL_SPAN_FULL &&
        isResizable(insertAfterId) &&
        isResizable(activeIdStr)
      if (couldSplit) {
        const overRect = slotRects.find(s => s.id === insertAfterId)?.rect
        if (overRect && overRect.width > 0) {
          const pointerInCenter = isPointerInFullWidthCenterBand(pointer.x, overRect)
          if (!pointerInCenter) {
            shouldSplit = true
            splitTargetId = insertAfterId
          } else {
            skipShrinkActive = true
          }
        } else {
          shouldSplit = true
          splitTargetId = insertAfterId
        }
      }
    }
    droppedInEmptySpace = true
  } else {
    return null
  }

  return {
    newIndex,
    operation,
    swapTargetId,
    shouldSplit,
    splitTargetId: shouldSplit ? splitTargetId : null,
    droppedInEmptySpace,
    skipShrinkActive,
  }
}

/**
 * 포인터 위치로 삽입 인덱스 계산 (빈 공간 또는 슬롯 기준).
 * 반환: { newIndex, insertAfterId } — insertAfterId가 100%이면 50% 분할 후보.
 * @param excludeId 이 id의 슬롯은 무시(드래그 중인 위젯의 빈 자리 제외)
 */
export function getInsertIndexFromPoint(
  point: { x: number; y: number },
  slotRects: SlotRect[],
  orderedIds: string[],
  excludeId: string | null
): { newIndex: number; insertAfterId: string | null } {
  if (slotRects.length === 0) return { newIndex: orderedIds.length, insertAfterId: null }

  const ROW_OVERLAP_THRESHOLD = 8

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

  let targetRow: { top: number; bottom: number; items: RowItem[] } | null = null
  for (const row of rows) {
    if (point.y >= row.top - ROW_OVERLAP_THRESHOLD && point.y <= row.bottom + ROW_OVERLAP_THRESHOLD) {
      targetRow = row
      break
    }
  }
  if (!targetRow) {
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

  if (point.x <= items[0].slot.rect.left) {
    return { newIndex: firstIdx, insertAfterId: null }
  }
  if (point.x >= items[items.length - 1].slot.rect.right) {
    return {
      newIndex: Math.min(lastIdx + 1, orderedIds.length),
      insertAfterId: orderedIds[lastIdx],
    }
  }
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
