import type { CSSProperties, SVGProps } from 'react'

/** 시안 LNB 대메뉴 아이콘 스펙 */
export const MENU_ICON_SIZE = 24

const MENU_ICON_STYLE: CSSProperties = {
  width: MENU_ICON_SIZE,
  height: MENU_ICON_SIZE,
  flexShrink: 0,
  aspectRatio: '1 / 1',
  display: 'block',
}

export type MenuIconProps = SVGProps<SVGSVGElement> & {
  size?: number
}

/**
 * LNB 대메뉴 아이콘 팩토리.
 * - fill은 currentColor (메뉴 active/hover 색상 연동)
 * - Figma 내보내기 mask는 제거 (경로만 유지)
 * - 스펙: 24×24 / flex-shrink: 0 / aspect-ratio: 1/1
 */
export function createMenuIcon(pathD: string, displayName: string) {
  function MenuIcon({ size = MENU_ICON_SIZE, style, ...rest }: MenuIconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        focusable="false"
        style={{ ...MENU_ICON_STYLE, width: size, height: size, ...style }}
        {...rest}
      >
        <path d={pathD} fill="currentColor" />
      </svg>
    )
  }
  MenuIcon.displayName = displayName
  return MenuIcon
}
