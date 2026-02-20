/**
 * DnD 대시보드 전용 레이아웃 상수 (2열, 3타입)
 * - FULL: w=12, h=FULL_HEIGHT (한 행 전체)
 * - TALL: w=6, h=TALL_HEIGHT (= 2 * NORMAL_HEIGHT)
 * - NORMAL: w=6, h=NORMAL_HEIGHT
 */

import { getDndWidgetType } from './dnd-widget-type-map'
import type { DndWidgetType } from './dnd-widget-type-map'

export const COLS = 12
export const LEFT_X = 0
export const RIGHT_X = 6

/** 일반 위젯 높이 (그리드 단위) */
export const NORMAL_HEIGHT = 4
/** 큰 위젯 높이 (2 * NORMAL_HEIGHT) */
export const TALL_HEIGHT = 8
/** 전폭 위젯 높이 */
export const FULL_HEIGHT = 6

export type WidgetLayoutType = 'normal' | 'tall' | 'full'

/**
 * DnD 타입에 따라 w/h 반환 (기존 카드 너비/프리셋 사용 안 함)
 * - FULL -> w=12, h=FULL_HEIGHT
 * - TALL -> w=6, h=TALL_HEIGHT
 * - NORMAL -> w=6, h=NORMAL_HEIGHT
 */
export function getDndSizeForWidget(widgetKey: string): { w: 6 | 12; h: number } {
  const type: DndWidgetType = getDndWidgetType(widgetKey)
  switch (type) {
    case 'FULL':
      return { w: 12, h: FULL_HEIGHT }
    case 'TALL':
      return { w: 6, h: TALL_HEIGHT }
    case 'NORMAL':
    default:
      return { w: 6, h: NORMAL_HEIGHT }
  }
}
