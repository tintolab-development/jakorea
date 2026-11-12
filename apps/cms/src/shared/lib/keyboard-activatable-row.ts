/**
 * 클릭으로 이동하는 표 행(antd `onRow`)에 키보드 접근을 붙인다 (QA-0256).
 * - Tab 포커스(tabIndex 0), Enter/Space 실행, `data-row-activatable` 로 포커스 표시 스타일 연결
 * - 행 안의 체크박스·버튼 등 자식에서 올라온 키 입력은 무시한다 (자식 자체 동작 유지)
 */

import type { HTMLAttributes, KeyboardEvent } from 'react'

export const KEYBOARD_ACTIVATABLE_ROW_ATTR = 'data-row-activatable'

export type KeyboardActivatableRowProps = HTMLAttributes<HTMLElement> & {
  [KEYBOARD_ACTIVATABLE_ROW_ATTR]: 'true'
}

export function isRowActivationKey(event: Pick<KeyboardEvent, 'key'>): boolean {
  return event.key === 'Enter' || event.key === ' '
}

export function keyboardActivatableRowProps(
  onActivate: () => void,
  options?: { ariaLabel?: string }
): KeyboardActivatableRowProps {
  return {
    onClick: onActivate,
    onKeyDown: event => {
      if (event.target !== event.currentTarget) return
      if (!isRowActivationKey(event)) return
      event.preventDefault()
      onActivate()
    },
    tabIndex: 0,
    ...(options?.ariaLabel ? { 'aria-label': options.ariaLabel } : {}),
    [KEYBOARD_ACTIVATABLE_ROW_ATTR]: 'true',
  }
}
