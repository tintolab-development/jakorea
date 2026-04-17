/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import {
  COL_SPAN_FULL,
  COL_SPAN_HALF,
  FULL_WIDTH_CENTER_RATIO,
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

  it('100% 위에 드롭·중앙이면 분할 없이 해당 인덱스', () => {
    const ordered = ['drag', 'target']
    const slots: SlotRect[] = [{ id: 'target', rect: rect(0, 0, 100, 50) }]
    const centerX = 50
    const r = computeDragEndResult(
      ordered,
      'drag',
      'target',
      { x: centerX, y: 25 },
      slots,
      alwaysFull,
      resizable
    )
    expect(r).not.toBeNull()
    expect(r!.operation).toBe('swap')
    expect(r!.swapTargetId).toBe('target')
    expect(r!.shouldSplit).toBe(false)
    expect(r!.newIndex).toBe(1)
  })

  it('100% 위에 드롭·좌측 치우침이어도 위젯 위 드롭이면 swap', () => {
    const ordered = ['drag', 'target']
    const slots: SlotRect[] = [{ id: 'target', rect: rect(0, 0, 100, 50) }]
    const r = computeDragEndResult(
      ordered,
      'drag',
      'target',
      { x: 5, y: 25 },
      slots,
      alwaysFull,
      resizable
    )
    expect(r!.operation).toBe('swap')
    expect(r!.swapTargetId).toBe('target')
    expect(r!.shouldSplit).toBe(false)
    expect(r!.splitTargetId).toBeNull()
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
})
