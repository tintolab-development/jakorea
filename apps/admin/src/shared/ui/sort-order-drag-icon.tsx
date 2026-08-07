/**
 * 테이블 순서(DnD) 열 공통 아이콘 — 20×20 · opacity 0.6 · #3D3D3D
 */

import { useId, type CSSProperties, type SVGProps } from 'react'

export type SortOrderDragIconProps = Omit<
  SVGProps<SVGSVGElement>,
  'width' | 'height' | 'viewBox' | 'fill' | 'xmlns'
> & {
  /** 기본 20 */
  size?: number
}

const DEFAULT_STYLE: CSSProperties = {
  width: 20,
  height: 20,
  flexShrink: 0,
  aspectRatio: '1 / 1',
  opacity: 0.6,
  display: 'block',
}

export function SortOrderDragIcon({
  size = 20,
  style,
  className,
  ...rest
}: SortOrderDragIconProps) {
  const uid = useId().replace(/:/g, '')
  const maskId = `sort-order-mask-${uid}`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={className}
      style={{ ...DEFAULT_STYLE, width: size, height: size, ...style }}
      {...rest}
    >
      <mask
        id={maskId}
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="20"
        height="20"
      >
        <rect width="20" height="20" fill="#D9D9D9" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path
          d="M3 14C2.71667 14 2.47917 13.9042 2.2875 13.7125C2.09583 13.5208 2 13.2833 2 13C2 12.7167 2.09583 12.4792 2.2875 12.2875C2.47917 12.0958 2.71667 12 3 12H17C17.2833 12 17.5208 12.0958 17.7125 12.2875C17.9042 12.4792 18 12.7167 18 13C18 13.2833 17.9042 13.5208 17.7125 13.7125C17.5208 13.9042 17.2833 14 17 14H3ZM3 8C2.71667 8 2.47917 7.90417 2.2875 7.7125C2.09583 7.52083 2 7.28333 2 7C2 6.71667 2.09583 6.47917 2.2875 6.2875C2.47917 6.09583 2.71667 6 3 6H17C17.2833 6 17.5208 6.09583 17.7125 6.2875C17.9042 6.47917 18 6.71667 18 7C18 7.28333 17.9042 7.52083 17.7125 7.7125C17.5208 7.90417 17.2833 8 17 8H3Z"
          fill="#3D3D3D"
        />
      </g>
    </svg>
  )
}
