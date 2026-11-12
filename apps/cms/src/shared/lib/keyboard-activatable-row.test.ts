import type { KeyboardEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { keyboardActivatableRowProps } from './keyboard-activatable-row'

function keyEvent(key: string, sameTarget = true) {
  const currentTarget = {}
  return {
    key,
    target: sameTarget ? currentTarget : {},
    currentTarget,
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent<HTMLElement>
}

describe('keyboardActivatableRowProps', () => {
  it('Tab 포커스 가능한 행 속성을 만든다', () => {
    const props = keyboardActivatableRowProps(() => {}, { ariaLabel: '프로그램 A 상세' })
    expect(props.tabIndex).toBe(0)
    expect(props['aria-label']).toBe('프로그램 A 상세')
    expect(props['data-row-activatable']).toBe('true')
  })

  it('Enter·Space로 실행하고 기본 동작(스크롤)을 막는다', () => {
    const onActivate = vi.fn()
    const props = keyboardActivatableRowProps(onActivate)
    const enter = keyEvent('Enter')
    props.onKeyDown?.(enter)
    props.onKeyDown?.(keyEvent(' '))
    expect(onActivate).toHaveBeenCalledTimes(2)
    expect(enter.preventDefault).toHaveBeenCalled()
  })

  it('다른 키나 자식 요소(체크박스 등)에서 올라온 키는 무시한다', () => {
    const onActivate = vi.fn()
    const props = keyboardActivatableRowProps(onActivate)
    props.onKeyDown?.(keyEvent('a'))
    props.onKeyDown?.(keyEvent('Enter', false))
    expect(onActivate).not.toHaveBeenCalled()
  })
})
