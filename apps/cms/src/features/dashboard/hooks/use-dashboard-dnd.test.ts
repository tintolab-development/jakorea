/** @vitest-environment jsdom */
import { act, renderHook } from '@testing-library/react'
import type { DragEndEvent } from '@dnd-kit/core'
import { describe, expect, it, vi } from 'vitest'

import { useDashboardDnd } from './use-dashboard-dnd'

function dragEnd(activeId: string, overId: string | null): DragEndEvent {
  return {
    active: { id: activeId },
    over: overId ? { id: overId } : null,
    delta: { x: 0, y: 0 },
  } as unknown as DragEndEvent
}

describe('useDashboardDnd — 경우 ② (기획 확정 2026-11-14)', () => {
  it('1단 위젯을 2단 줄의 위젯 위에 놓으면 순서만 바뀌고 각 위젯 폭은 그대로다', () => {
    const setOrderedIds = vi.fn()
    const setWidgetWidth = vi.fn()
    const roleWidths: Record<string, 12 | 24> = { left: 12, right: 12, wide: 24 }

    const { result } = renderHook(() =>
      useDashboardDnd({
        orderedIds: ['left', 'right', 'wide'],
        setOrderedIds,
        userRole: 'ADMIN',
        roleWidths,
        displayItemsMeta: [],
        setWidgetWidth,
        getSlotRects: () => [],
      })
    )

    act(() => {
      result.current.handleDragEnd(dragEnd('wide', 'right'))
    })

    expect(setOrderedIds).toHaveBeenCalledTimes(1)
    expect(setOrderedIds).toHaveBeenCalledWith('ADMIN', ['left', 'wide', 'right'])
    expect(setWidgetWidth).not.toHaveBeenCalled()
    expect(roleWidths).toEqual({ left: 12, right: 12, wide: 24 })
  })
})

describe('useDashboardDnd — 경우 ① (기획 확정 2026-11-14)', () => {
  it('1단 위젯을 1단 위젯 위에 놓으면 둘 다 2단(역할별 폭)으로 바꾸고 [대상][끌고 온 위젯]으로 저장한다', () => {
    const setOrderedIds = vi.fn()
    const setWidgetWidth = vi.fn()
    const onLayoutSaved = vi.fn()

    const { result } = renderHook(() =>
      useDashboardDnd({
        orderedIds: ['target', 'middle', 'drag'],
        setOrderedIds,
        userRole: 'ADMIN',
        roleWidths: { target: 24, middle: 24, drag: 24 },
        displayItemsMeta: [],
        setWidgetWidth,
        getSlotRects: () => [],
        onLayoutSaved,
      })
    )

    act(() => {
      result.current.handleDragEnd(dragEnd('drag', 'target'))
    })

    expect(setWidgetWidth).toHaveBeenCalledWith('ADMIN', 'target', 12)
    expect(setWidgetWidth).toHaveBeenCalledWith('ADMIN', 'drag', 12)
    expect(setOrderedIds).toHaveBeenCalledWith('ADMIN', ['target', 'drag', 'middle'])
    expect(onLayoutSaved).toHaveBeenCalledTimes(1)
  })

  it('이미 붙어 있는 1단 두 개도 2단 한 줄로 만든다(순서 그대로)', () => {
    const setOrderedIds = vi.fn()
    const setWidgetWidth = vi.fn()

    const { result } = renderHook(() =>
      useDashboardDnd({
        orderedIds: ['target', 'drag'],
        setOrderedIds,
        userRole: 'ADMIN',
        roleWidths: { target: 24, drag: 24 },
        displayItemsMeta: [],
        setWidgetWidth,
        getSlotRects: () => [],
      })
    )

    act(() => {
      result.current.handleDragEnd(dragEnd('drag', 'target'))
    })

    expect(setWidgetWidth).toHaveBeenCalledTimes(2)
    expect(setOrderedIds).toHaveBeenCalledWith('ADMIN', ['target', 'drag'])
  })
})
