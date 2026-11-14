/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import {
  COL_SPAN_FULL,
  COL_SPAN_HALF,
  FULL_WIDTH_CENTER_RATIO,
  areWidgetIdListsEqual,
  computeDragEndResult,
  getInsertIndexFromPoint,
  isPointerInFullWidthCenterBand,
  type SlotRect,
} from './dashboard-dnd-helpers'

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect
}

describe('areWidgetIdListsEqual', () => {
  it('같은 순서면 true', () => {
    expect(areWidgetIdListsEqual(['a', 'b'], ['a', 'b'])).toBe(true)
  })

  it('다르면 false', () => {
    expect(areWidgetIdListsEqual(['a', 'b'], ['b', 'a'])).toBe(false)
    expect(areWidgetIdListsEqual(['a'], ['a', 'b'])).toBe(false)
  })
})

describe('isPointerInFullWidthCenterBand', () => {
  it('중앙 FULL_WIDTH_CENTER_RATIO 구간이면 true', () => {
    const r = rect(0, 0, 100, 40)
    const half = (1 - FULL_WIDTH_CENTER_RATIO) / 2
    expect(isPointerInFullWidthCenterBand(r.left + r.width * (half + 0.01), r)).toBe(true)
  })

  it('좌측 치우침이면 false', () => {
    const r = rect(0, 0, 100, 40)
    expect(isPointerInFullWidthCenterBand(r.left + r.width * 0.1, r)).toBe(false)
  })
})

describe('getInsertIndexFromPoint', () => {
  it('슬롯이 없으면 맨 뒤 인덱스', () => {
    const ordered = ['a', 'b']
    expect(getInsertIndexFromPoint({ x: 0, y: 0 }, [], ordered, null).newIndex).toBe(2)
  })

  it('단일 슬롯 중심 오른쪽이면 그 뒤에 삽입', () => {
    const ordered = ['w1']
    const slots: SlotRect[] = [{ id: 'w1', rect: rect(0, 0, 200, 100) }]
    const { newIndex, insertAfterId } = getInsertIndexFromPoint({ x: 150, y: 50 }, slots, ordered, null)
    expect(newIndex).toBe(1)
    expect(insertAfterId).toBe('w1')
  })
})

describe('computeDragEndResult', () => {
  const resizable = () => true
  const alwaysFull = (_id: string) => COL_SPAN_FULL as 12 | 24

  it('effectiveOverId 없고 slotRects 없으면 null', () => {
    expect(
      computeDragEndResult(['a', 'b'], 'a', null, { x: 0, y: 0 }, [], alwaysFull, resizable)
    ).toBeNull()
  })

  it('경우 ①: 1단 위젯을 1단 위젯 위에 놓으면 2단 한 줄, 끌고 온 위젯이 오른쪽(아래→위)', () => {
    const ordered = ['target', 'middle', 'drag']
    const slots: SlotRect[] = [{ id: 'target', rect: rect(0, 0, 100, 50) }]
    const r = computeDragEndResult(
      ordered,
      'drag',
      'target',
      { x: 50, y: 25 },
      slots,
      alwaysFull,
      resizable
    )
    expect(r!.pairRowWithTargetId).toBe('target')
    expect(r!.operation).toBe('move')
    expect(r!.swapTargetId).toBeNull()
    // arrayMove(ordered, 2, newIndex) → [target, drag, middle]
    expect(r!.newIndex).toBe(1)
  })

  it('경우 ①: 위에서 아래 1단 위젯으로 끌어도 [대상][끌고 온 위젯] 순서', () => {
    const ordered = ['drag', 'middle', 'target']
    const r = computeDragEndResult(
      ordered,
      'drag',
      'target',
      { x: 5, y: 25 },
      [],
      alwaysFull,
      resizable
    )
    expect(r!.pairRowWithTargetId).toBe('target')
    // arrayMove(ordered, 0, newIndex) → [middle, target, drag]
    expect(r!.newIndex).toBe(2)
  })

  it('50%를 지원하지 않는 위젯이 끼면 1단 → 1단이어도 기존처럼 1:1 교환', () => {
    const notKpi = (id: string) => id !== 'kpi'
    const r = computeDragEndResult(['drag', 'kpi'], 'drag', 'kpi', { x: 0, y: 0 }, [], alwaysFull, notKpi)
    expect(r!.pairRowWithTargetId).toBeNull()
    expect(r!.operation).toBe('swap')
    expect(r!.swapTargetId).toBe('kpi')
  })

  it('대상 앞에 짝 없는 2단 위젯이 있어 한 줄로 서지 못하면 기존처럼 1:1 교환', () => {
    const span = (id: string) => (id === 'lone-half' ? COL_SPAN_HALF : COL_SPAN_FULL) as 12 | 24
    const r = computeDragEndResult(
      ['lone-half', 'target', 'drag'],
      'drag',
      'target',
      { x: 0, y: 0 },
      [],
      span,
      resizable
    )
    expect(r!.pairRowWithTargetId).toBeNull()
    expect(r!.operation).toBe('swap')
  })

  it('2단 위젯을 끌었을 때는 기존 동작(1:1 교환, 폭 변경 없음) 유지', () => {
    const span = (id: string) => (id === 'drag' ? COL_SPAN_HALF : COL_SPAN_FULL) as 12 | 24
    const r = computeDragEndResult(
      ['target', 'drag', 'other-half'],
      'drag',
      'target',
      { x: 0, y: 0 },
      [],
      span,
      resizable
    )
    expect(r!.pairRowWithTargetId).toBeNull()
    expect(r!.operation).toBe('swap')
    expect(r!.swapTargetId).toBe('target')
  })

  it('50%↔50% 같은 크기면 스왑 인덱스만', () => {
    const ordered = ['a', 'b']
    const slots: SlotRect[] = [
      { id: 'a', rect: rect(0, 0, 100, 50) },
      { id: 'b', rect: rect(100, 0, 100, 50) },
    ]
    const half = (_id: string) => COL_SPAN_HALF as 12 | 24
    const r = computeDragEndResult(ordered, 'a', 'b', { x: 150, y: 25 }, slots, half, resizable)
    expect(r!.operation).toBe('swap')
    expect(r!.swapTargetId).toBe('b')
    expect(r!.shouldSplit).toBe(false)
    expect(r!.newIndex).toBe(1)
  })

  it('effectiveOverId 없고 빈 공간 드롭이면 move 유지', () => {
    const ordered = ['a', 'b', 'c']
    const slots: SlotRect[] = [
      { id: 'a', rect: rect(0, 0, 100, 50) },
      { id: 'b', rect: rect(100, 0, 100, 50) },
      { id: 'c', rect: rect(0, 60, 200, 50) },
    ]
    const half = (_id: string) => COL_SPAN_HALF as 12 | 24
    const r = computeDragEndResult(ordered, 'a', null, { x: 180, y: 20 }, slots, half, resizable)
    expect(r).not.toBeNull()
    expect(r!.operation).toBe('move')
    expect(r!.swapTargetId).toBeNull()
  })

  it('경우 ②: 1단 위젯을 2단 줄의 위젯 위에 놓으면 그 위젯과 순서만 바꾸고 분할하지 않는다', () => {
    // 2단 줄 [left | right] 아래 1단 위젯 wide — wide를 right 위에 드롭
    const ordered = ['left', 'right', 'wide']
    const slots: SlotRect[] = [
      { id: 'left', rect: rect(0, 0, 100, 50) },
      { id: 'right', rect: rect(100, 0, 100, 50) },
    ]
    const span = (id: string) => (id === 'wide' ? COL_SPAN_FULL : COL_SPAN_HALF) as 12 | 24
    const r = computeDragEndResult(
      ordered,
      'wide',
      'right',
      { x: 150, y: 25 },
      slots,
      span,
      resizable
    )
    expect(r!.operation).toBe('swap')
    expect(r!.swapTargetId).toBe('right')
    expect(r!.shouldSplit).toBe(false)
    expect(r!.splitTargetId).toBeNull()
    expect(r!.pairRowWithTargetId).toBeNull()
  })
})
