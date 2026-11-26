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

describe('useDashboardDnd — 칸 교환 (기획 확정 2026-11-26)', () => {
  it('1단 위젯을 2단 줄의 위젯 위에 놓으면 자리를 바꾸고 폭도 자리를 따라 맞바꾼다', () => {
    const setOrderedIds = vi.fn()
    const setWidgetWidth = vi.fn()
    const onLayoutSaved = vi.fn()

    const { result } = renderHook(() =>
      useDashboardDnd({
        orderedIds: ['left', 'right', 'wide'],
        setOrderedIds,
        userRole: 'ADMIN',
        roleWidths: { left: 12, right: 12, wide: 24 },
        displayItemsMeta: [],
        setWidgetWidth,
        getSlotRects: () => [],
        onLayoutSaved,
      })
    )

    act(() => {
      result.current.handleDragEnd(dragEnd('wide', 'right'))
    })

    expect(setOrderedIds).toHaveBeenCalledTimes(1)
    expect(setOrderedIds).toHaveBeenCalledWith('ADMIN', ['left', 'wide', 'right'])
    expect(setWidgetWidth).toHaveBeenCalledTimes(2)
    expect(setWidgetWidth).toHaveBeenCalledWith('ADMIN', 'wide', 12)
    expect(setWidgetWidth).toHaveBeenCalledWith('ADMIN', 'right', 24)
    expect(onLayoutSaved).toHaveBeenCalledTimes(1)
  })

  it('2단 위젯을 맨 위 1단 위젯 위에 놓아도 드롭이 그대로 반영된다(제자리로 돌아가지 않음)', () => {
    const setOrderedIds = vi.fn()
    const setWidgetWidth = vi.fn()

    const { result } = renderHook(() =>
      useDashboardDnd({
        orderedIds: ['top', 'h1', 'h2', 'rest'],
        setOrderedIds,
        userRole: 'ADMIN',
        roleWidths: { top: 24, h1: 12, h2: 12, rest: 24 },
        displayItemsMeta: [],
        setWidgetWidth,
        getSlotRects: () => [],
      })
    )

    act(() => {
      result.current.handleDragEnd(dragEnd('h1', 'top'))
    })

    expect(setOrderedIds).toHaveBeenCalledWith('ADMIN', ['h1', 'top', 'h2', 'rest'])
    expect(setWidgetWidth).toHaveBeenCalledWith('ADMIN', 'h1', 24)
    expect(setWidgetWidth).toHaveBeenCalledWith('ADMIN', 'top', 12)
  })

  it('같은 폭끼리 교환하면 폭은 건드리지 않는다', () => {
    const setOrderedIds = vi.fn()
    const setWidgetWidth = vi.fn()

    const { result } = renderHook(() =>
      useDashboardDnd({
        orderedIds: ['a', 'b', 'c'],
        setOrderedIds,
        userRole: 'ADMIN',
        roleWidths: { a: 12, b: 12, c: 24 },
        displayItemsMeta: [],
        setWidgetWidth,
        getSlotRects: () => [],
      })
    )

    act(() => {
      result.current.handleDragEnd(dragEnd('a', 'b'))
    })

    expect(setOrderedIds).toHaveBeenCalledWith('ADMIN', ['b', 'a', 'c'])
    expect(setWidgetWidth).not.toHaveBeenCalled()
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

describe('useDashboardDnd — 제자리 드롭', () => {
  it('끌던 위젯을 자기 원래 자리 위에 놓으면 순서·폭을 바꾸지 않는다', () => {
    const setOrderedIds = vi.fn()
    const setWidgetWidth = vi.fn()
    const onLayoutSaved = vi.fn()
    const rect = (left: number, top: number, width: number, height: number) =>
      ({
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
      }) as DOMRect

    const { result } = renderHook(() =>
      useDashboardDnd({
        orderedIds: ['a', 'b', 'c'],
        setOrderedIds,
        userRole: 'ADMIN',
        roleWidths: { a: 12, b: 12, c: 24 },
        displayItemsMeta: [],
        setWidgetWidth,
        getSlotRects: () => [
          { id: 'a', rect: rect(0, 0, 800, 400) },
          { id: 'b', rect: rect(800, 0, 800, 400) },
          { id: 'c', rect: rect(0, 432, 1600, 400) },
        ],
        onLayoutSaved,
      })
    )

    act(() => {
      result.current.handleDragEnd(dragEnd('a', 'a'))
    })

    expect(setOrderedIds).not.toHaveBeenCalled()
    expect(setWidgetWidth).not.toHaveBeenCalled()
    expect(onLayoutSaved).not.toHaveBeenCalled()
  })
})
