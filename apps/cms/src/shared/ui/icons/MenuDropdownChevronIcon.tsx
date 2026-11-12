/**
 * LNB 드롭다운 쉐브론 — 원본 `shared/assets/icons/inputs/chevron-up-default.svg`
 * (Figma `Icon / Field / w22` type=top, LNB에서는 20으로 배치).
 * mask로 그려 색은 currentColor(LNB 글자색)를 따른다.
 */

import type { CSSProperties } from 'react'
import chevronUpUrl from '@/shared/assets/icons/inputs/chevron-up-default.svg'
import { MaskIcon, type MaskIconProps } from './MaskIcon'

/** 시안 LNB 드롭다운 쉐브론 스펙 */
const MENU_DROPDOWN_ICON_SIZE = 20

export type MenuDropdownChevronIconProps = MaskIconProps & {
  /** submenu 펼침 여부 */
  open?: boolean
  size?: number
}

/** 펼침(open) = 시안 기본(▲), 접힘 = 180° 회전(▼) */
export function MenuDropdownChevronIcon({
  open = false,
  size = MENU_DROPDOWN_ICON_SIZE,
  style,
  ...rest
}: MenuDropdownChevronIconProps) {
  const chevronStyle: CSSProperties = {
    display: 'block',
    width: size,
    height: size,
    transition: 'transform 0.2s ease',
    transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
    ...style,
  }

  return <MaskIcon src={chevronUpUrl} style={chevronStyle} {...rest} />
}
