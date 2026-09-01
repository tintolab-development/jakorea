import { describe, expect, it } from 'vitest'
import {
  serializeDashboardLayoutSnapshot,
  shouldSkipLayoutPersist,
  type DashboardLayoutSnapshot,
} from './layout-snapshot'

function snap(
  partial: Partial<DashboardLayoutSnapshot> = {}
): DashboardLayoutSnapshot {
  return {
    orderedWidgetIds: ['a', 'b'],
    widgetWidths: { a: 24, b: 12 },
    ...partial,
  }
}

describe('shouldSkipLayoutPersist', () => {
  it('이전 스냅샷과 같으면 skip', () => {
    const next = snap()
    const prev = serializeDashboardLayoutSnapshot(next)
    expect(shouldSkipLayoutPersist(prev, next)).toBe(true)
  })

  it('순서가 바뀌면 persist', () => {
    const prev = serializeDashboardLayoutSnapshot(snap())
    expect(shouldSkipLayoutPersist(prev, snap({ orderedWidgetIds: ['b', 'a'] }))).toBe(
      false
    )
  })

  it('너비가 바뀌면 persist', () => {
    const prev = serializeDashboardLayoutSnapshot(snap())
    expect(
      shouldSkipLayoutPersist(prev, snap({ widgetWidths: { a: 12, b: 12 } }))
    ).toBe(false)
  })

  it('이전이 없으면 persist', () => {
    expect(shouldSkipLayoutPersist(null, snap())).toBe(false)
  })
})
