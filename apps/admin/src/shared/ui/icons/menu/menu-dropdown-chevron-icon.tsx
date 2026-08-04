import type { CSSProperties, SVGProps } from 'react'

/** 시안 LNB 드롭다운 쉐브론 스펙 */
export const MENU_DROPDOWN_ICON_SIZE = 20

const BASE_STYLE: CSSProperties = {
  width: MENU_DROPDOWN_ICON_SIZE,
  height: MENU_DROPDOWN_ICON_SIZE,
  flexShrink: 0,
  aspectRatio: '1 / 1',
  display: 'block',
  transition: 'transform 0.2s ease',
}

/** 펼침(open) = 시안 기본(▲), 접힘 = 180° 회전(▼) */
const PATH =
  'M9.65569 6.97751C9.89828 6.8173 10.2282 6.84449 10.4418 7.05807L15.4418 12.0581C15.6859 12.3022 15.6859 12.6978 15.4418 12.9419C15.1977 13.1859 14.8021 13.1859 14.558 12.9419L9.99992 8.38376L5.44182 12.9419C5.19774 13.1859 4.80211 13.1859 4.55803 12.9419C4.31395 12.6978 4.31395 12.3022 4.55803 12.0581L9.55803 7.05807L9.65569 6.97751Z'

export type MenuDropdownChevronIconProps = SVGProps<SVGSVGElement> & {
  /** submenu 펼침 여부 */
  open?: boolean
  size?: number
}

export function MenuDropdownChevronIcon({
  open = false,
  size = MENU_DROPDOWN_ICON_SIZE,
  style,
  ...rest
}: MenuDropdownChevronIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      focusable="false"
      style={{
        ...BASE_STYLE,
        width: size,
        height: size,
        transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
        ...style,
      }}
      {...rest}
    >
      <path d={PATH} fill="currentColor" />
    </svg>
  )
}
