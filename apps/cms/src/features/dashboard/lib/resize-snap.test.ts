import { describe, expect, it } from 'vitest'
import { RESIZE_THRESHOLD_PX, resolveResizeSnap } from './resize-snap'

describe('resolveResizeSnap', () => {
  it('threshold 미만이면 시작 span 유지', () => {
    expect(resolveResizeSnap(12, RESIZE_THRESHOLD_PX)).toBe(12)
    expect(resolveResizeSnap(24, -RESIZE_THRESHOLD_PX)).toBe(24)
    expect(resolveResizeSnap(12, 0)).toBe(12)
  })

  it('오른쪽으로 threshold 초과면 100%', () => {
    expect(resolveResizeSnap(12, RESIZE_THRESHOLD_PX + 1)).toBe(24)
    expect(resolveResizeSnap(24, RESIZE_THRESHOLD_PX + 1)).toBe(24)
  })

  it('왼쪽으로 threshold 초과면 50%', () => {
    expect(resolveResizeSnap(24, -(RESIZE_THRESHOLD_PX + 1))).toBe(12)
    expect(resolveResizeSnap(12, -(RESIZE_THRESHOLD_PX + 1))).toBe(12)
  })
})
