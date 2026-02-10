/**
 * 2열 밀집 레이아웃 (No gaps, x=0|6 only)
 * - cols=12, 왼쪽 x=0 / 오른쪽 x=6 만 허용 (중간 x 금지)
 * - 저장되는 레이아웃은 항상 sanitize 후에만 저장
 */

import type { LayoutItem } from 'react-grid-layout'
import { getDndSizeForWidget } from './dnd-layout-constants'

const COLS_DEFAULT = 12
const LEFT_X = 0
const RIGHT_X = 6

/** 그리드 너비를 2열 규칙에 맞게 정규화: 6 또는 12 (레거시/폴백용) */
export function normalizeWidth(w: number): 6 | 12 {
  return w >= COLS_DEFAULT ? 12 : 6
}

/**
 * 단일 레이아웃 아이템을 2열에만 맞춤 (x=0 또는 x=6, 클램프 포함)
 * - w === 12 → x = 0
 * - w === 6  → x <= 2 → x = 0, else → x = 6
 * - x ∈ [0, cols - w], y >= 0
 */
export function sanitizeToTwoColumns(item: LayoutItem, cols: number = COLS_DEFAULT): LayoutItem {
  const w = item.w >= cols ? 12 : 6
  let x: number
  if (w === 12) {
    x = LEFT_X
  } else {
    x = item.x <= 2 ? LEFT_X : RIGHT_X
  }
  x = Math.max(0, Math.min(cols - w, x))
  const y = Math.max(0, Number(item.y))
  return {
    ...item,
    w,
    x,
    y,
    minW: item.minW ?? 2,
    minH: item.minH ?? 2,
  }
}

/**
 * 레이아웃 배열 전체를 2열로 정리 (저장 전 항상 사용)
 */
export function sanitizeLayoutToTwoColumns(
  layout: LayoutItem[],
  cols: number = COLS_DEFAULT
): LayoutItem[] {
  return layout.map(item => sanitizeToTwoColumns(item, cols))
}

/** @deprecated use sanitizeToTwoColumns */
export function snapToColumns(item: LayoutItem): LayoutItem {
  return sanitizeToTwoColumns(item, COLS_DEFAULT)
}

/** @deprecated use sanitizeLayoutToTwoColumns */
export function snapLayoutToColumns(layout: LayoutItem[]): LayoutItem[] {
  return sanitizeLayoutToTwoColumns(layout, COLS_DEFAULT)
}

export interface WidgetOrderItem {
  id: string
  widgetKey: string
}

/**
 * 드롭 시 사용자가 선택한 열 (미드라인 기준). instanceId -> 0 | 6
 */
export type PreferredColumnMap = Record<string, 0 | 6>

/**
 * 위젯 순서와 현재 레이아웃을 받아 2열 밀집 레이아웃으로 재배치.
 * - preferredColumn: 해당 instanceId의 반폭 위젯을 지정한 열(0 또는 6)에 배치 (드롭 위치 기준)
 * - FULL: x=0, y=max(leftY,rightY), leftY=rightY=y+h
 * - HALF: preferredColumn 있으면 그 열, 없으면 더 짧은 열
 * - 출력은 마지막에 sanitize로 한 번 더 보정
 */
export function repackLayout(
  layout: LayoutItem[],
  widgetOrder: WidgetOrderItem[],
  cols: number = COLS_DEFAULT,
  preferredColumn?: PreferredColumnMap
): LayoutItem[] {
  const sanitizedInput = sanitizeLayoutToTwoColumns(layout, cols)
  const byId = new Map<string, LayoutItem>()
  for (const item of sanitizedInput) {
    byId.set(item.i, { ...item })
  }

  let leftY = 0
  let rightY = 0
  const result: LayoutItem[] = []

  for (const widget of widgetOrder) {
    const item = byId.get(widget.id)
    if (!item) continue

    const { w, h } = getDndSizeForWidget(widget.widgetKey)

    const packed: LayoutItem = {
      ...item,
      w,
      h,
      minW: 2,
      minH: 2,
    }

    if (w === 12) {
      packed.x = LEFT_X
      packed.y = Math.max(leftY, rightY)
      leftY = packed.y + h
      rightY = leftY
    } else {
      const preferred = preferredColumn?.[widget.id]
      if (preferred === LEFT_X) {
        packed.x = LEFT_X
        packed.y = leftY
        leftY += h
      } else if (preferred === RIGHT_X) {
        packed.x = RIGHT_X
        packed.y = rightY
        rightY += h
      } else if (leftY <= rightY) {
        packed.x = LEFT_X
        packed.y = leftY
        leftY += h
      } else {
        packed.x = RIGHT_X
        packed.y = rightY
        rightY += h
      }
    }

    result.push(sanitizeToTwoColumns(packed, cols))
  }

  return result
}
