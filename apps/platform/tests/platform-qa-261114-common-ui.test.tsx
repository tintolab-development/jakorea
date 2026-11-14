// @vitest-environment jsdom
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  formatNotificationBodyFirstLine,
  formatNotificationDate,
} from '../src/features/notification/lib/format'
import { DRAG_SCROLL_CLICK_THRESHOLD_PX } from '../src/shared/hooks/use-drag-scroll'
import { getDecadePanelYears, getDecadeStart } from '../src/shared/ui/pf-date-input/date-utils'
import { PFModal } from '../src/shared/ui/pf-modal'
import { PFTabs } from '../src/shared/ui/pf-tabs'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement | null = null
let root: Root | null = null

function render(node: ReactNode) {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root!.render(node)
  })
}

function pointer(target: Element, type: string, init: Record<string, unknown>) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, ...init })
  for (const [key, value] of Object.entries(init)) {
    Object.defineProperty(event, key, { value })
  }
  act(() => {
    target.dispatchEvent(event)
  })
}

afterEach(() => {
  act(() => {
    root?.unmount()
  })
  container?.remove()
  container = null
  root = null
  document.body.innerHTML = ''
})

describe('공통 팝업 — 바깥(딤) 클릭으로 닫지 않음 (QA 2026-11-14)', () => {
  it('기본값은 딤 클릭에 onClose를 부르지 않고, 닫기 아이콘은 닫는다', () => {
    const onClose = vi.fn()
    render(
      <PFModal open onClose={onClose} title="팝업">
        <p>본문</p>
      </PFModal>,
    )
    const backdrop = document.querySelector('[role="dialog"]')!.parentElement!
    pointer(backdrop, 'pointerdown', {})
    expect(onClose).not.toHaveBeenCalled()

    pointer(document.querySelector('button[aria-label="닫기"]')!, 'pointerdown', {})
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('알림 카테고리 탭 드래그 스크롤', () => {
  beforeEach(() => {
    HTMLElement.prototype.setPointerCapture = vi.fn()
    HTMLElement.prototype.releasePointerCapture = vi.fn()
    HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
  })

  const items = [
    { key: 'a', label: '전체' },
    { key: 'b', label: '정산' },
  ]

  it('누른 채 끌면 가로 스크롤하고 손을 뗀 뒤 탭 선택은 막는다', () => {
    const onChange = vi.fn()
    render(<PFTabs items={items} value="a" onChange={onChange} size="small" dragScroll />)
    const tablist = document.querySelector('[role="tablist"]') as HTMLElement
    const tab = document.querySelectorAll('[role="tab"]')[1]!
    tablist.scrollLeft = 100

    pointer(tab, 'pointerdown', { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 200 })
    pointer(tab, 'pointermove', { pointerId: 1, pointerType: 'mouse', clientX: 140 })
    expect(tablist.scrollLeft).toBe(160)
    pointer(tab, 'pointerup', { pointerId: 1, pointerType: 'mouse', clientX: 140 })
    act(() => {
      ;(tab as HTMLElement).click()
    })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('임계 거리 미만으로 움직이면 클릭으로 탭을 고른다', () => {
    const onChange = vi.fn()
    render(<PFTabs items={items} value="a" onChange={onChange} size="small" dragScroll />)
    const tab = document.querySelectorAll('[role="tab"]')[1]!

    pointer(tab, 'pointerdown', { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 200 })
    pointer(tab, 'pointermove', {
      pointerId: 1,
      pointerType: 'mouse',
      clientX: 200 + DRAG_SCROLL_CLICK_THRESHOLD_PX - 1,
    })
    pointer(tab, 'pointerup', { pointerId: 1, pointerType: 'mouse' })
    act(() => {
      ;(tab as HTMLElement).click()
    })
    expect(onChange).toHaveBeenCalledWith('b')
  })
})

describe('알림 목록 표시 형식', () => {
  it('날짜는 YYYY년 M월 D일 (0 채움 없음)', () => {
    expect(formatNotificationDate('2026-01-15T03:00:00Z')).toBe('2026년 1월 15일')
    expect(formatNotificationDate('2026-11-05T03:00:00Z')).toBe('2026년 11월 5일')
    expect(formatNotificationDate(null)).toBe('-')
  })

  it('2줄은 본문의 첫 번째 줄', () => {
    expect(formatNotificationBodyFirstLine('\n  첫 줄  \n둘째 줄')).toBe('첫 줄')
    expect(formatNotificationBodyFirstLine('한 줄')).toBe('한 줄')
    expect(formatNotificationBodyFirstLine('  ')).toBe('-')
  })
})

describe('데이트피커 연도 패널', () => {
  it('해당 연대 10개 연도만 보인다 (앞 연대 09·다음 연대 00 제외)', () => {
    expect(getDecadeStart(2026)).toBe(2020)
    expect(getDecadePanelYears(2020)).toEqual([
      2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029,
    ])
  })
})
