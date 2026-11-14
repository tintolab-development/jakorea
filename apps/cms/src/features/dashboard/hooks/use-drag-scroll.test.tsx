/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DRAG_SCROLL_CLICK_THRESHOLD_PX, useDragScroll } from './use-drag-scroll'

function Tabs({ onSelect }: { onSelect: () => void }) {
  const { containerRef, dragScrollHandlers } = useDragScroll<HTMLDivElement>()
  return (
    <div ref={containerRef} data-testid="tabs" {...dragScrollHandlers}>
      <button type="button" onClick={onSelect}>
        탭
      </button>
    </div>
  )
}

describe('useDragScroll', () => {
  beforeEach(() => {
    HTMLElement.prototype.setPointerCapture = vi.fn()
    HTMLElement.prototype.releasePointerCapture = vi.fn()
    HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
  })

  afterEach(() => {
    cleanup()
  })

  it('누른 채 끌면 가로로 스크롤하고 손을 뗀 뒤 클릭(선택)은 막는다', () => {
    const onSelect = vi.fn()
    render(<Tabs onSelect={onSelect} />)
    const tabs = screen.getByTestId('tabs')
    const button = screen.getByRole('button')
    tabs.scrollLeft = 100

    fireEvent.pointerDown(button, { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 200 })
    fireEvent.pointerMove(button, { pointerId: 1, pointerType: 'mouse', clientX: 140 })
    expect(tabs.scrollLeft).toBe(160)

    fireEvent.pointerUp(button, { pointerId: 1, pointerType: 'mouse', clientX: 140 })
    fireEvent.click(button)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('임계 거리 미만으로 움직이면 클릭으로 처리한다', () => {
    const onSelect = vi.fn()
    render(<Tabs onSelect={onSelect} />)
    const button = screen.getByRole('button')

    fireEvent.pointerDown(button, { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 200 })
    fireEvent.pointerMove(button, {
      pointerId: 1,
      pointerType: 'mouse',
      clientX: 200 + DRAG_SCROLL_CLICK_THRESHOLD_PX - 1,
    })
    fireEvent.pointerUp(button, { pointerId: 1, pointerType: 'mouse' })
    fireEvent.click(button)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})
