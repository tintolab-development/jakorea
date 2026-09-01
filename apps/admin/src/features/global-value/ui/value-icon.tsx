/**
 * JA Global Value 임시 아이콘 — 고정 매핑, 수정/삭제 불가
 */
import type { ReactElement } from 'react'
import type { GlobalValueKey } from '@/entities/global-value/model/types'

const ICON_COLOR = '#01A1AF'

type ValueIconProps = {
  iconKey: GlobalValueKey
  size?: number
  className?: string
}

function FlowerIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="20" cy="12" r="5" fill={ICON_COLOR} />
      <circle cx="12" cy="18" r="5" fill={ICON_COLOR} opacity="0.85" />
      <circle cx="28" cy="18" r="5" fill={ICON_COLOR} opacity="0.85" />
      <circle cx="14" cy="27" r="5" fill={ICON_COLOR} opacity="0.7" />
      <circle cx="26" cy="27" r="5" fill={ICON_COLOR} opacity="0.7" />
      <circle cx="20" cy="20" r="4" fill={ICON_COLOR} />
    </svg>
  )
}

function SproutIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M20 32V18"
        stroke={ICON_COLOR}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M20 22C20 16 14 12 8 12C8 20 14 24 20 24"
        fill={ICON_COLOR}
        opacity="0.85"
      />
      <path
        d="M20 20C20 14 26 10 32 10C32 18 26 22 20 22"
        fill={ICON_COLOR}
      />
    </svg>
  )
}

function MoleculeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4.5" fill={ICON_COLOR} />
      <circle cx="28" cy="12" r="4.5" fill={ICON_COLOR} opacity="0.8" />
      <circle cx="20" cy="28" r="4.5" fill={ICON_COLOR} opacity="0.9" />
      <circle cx="20" cy="18" r="3" fill={ICON_COLOR} opacity="0.6" />
      <line x1="14.5" y1="14" x2="17.5" y2="17" stroke={ICON_COLOR} strokeWidth="1.5" />
      <line x1="25.5" y1="14" x2="22.5" y2="17" stroke={ICON_COLOR} strokeWidth="1.5" />
      <line x1="20" y1="21" x2="20" y2="24" stroke={ICON_COLOR} strokeWidth="1.5" />
    </svg>
  )
}

function BulbIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M20 8C14.5 8 10 12.5 10 18C10 21.5 12 24.5 15 26V28C15 29 15.5 29.5 16.5 29.5H23.5C24.5 29.5 25 29 25 28V26C28 24.5 30 21.5 30 18C30 12.5 25.5 8 20 8Z"
        fill={ICON_COLOR}
      />
      <rect x="16" y="30.5" width="8" height="2" rx="1" fill={ICON_COLOR} opacity="0.7" />
      <rect x="17" y="33" width="6" height="1.5" rx="0.75" fill={ICON_COLOR} opacity="0.5" />
    </svg>
  )
}

function HexLinkIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M14 10L22 6L30 10V18L22 22L14 18V10Z"
        stroke={ICON_COLOR}
        strokeWidth="2"
        fill={ICON_COLOR}
        fillOpacity="0.15"
      />
      <path
        d="M10 20L18 16L26 20V28L18 32L10 28V20Z"
        stroke={ICON_COLOR}
        strokeWidth="2"
        fill={ICON_COLOR}
        fillOpacity="0.35"
      />
    </svg>
  )
}

const ICONS: Record<GlobalValueKey, (props: { size: number }) => ReactElement> = {
  value_1: FlowerIcon,
  value_2: SproutIcon,
  value_3: MoleculeIcon,
  value_4: BulbIcon,
  value_5: HexLinkIcon,
}

export function ValueIcon({ iconKey, size = 40, className }: ValueIconProps) {
  const Icon = ICONS[iconKey] ?? FlowerIcon
  return (
    <span
      className={className}
      role="img"
      aria-label={`글로벌 밸류 아이콘 ${iconKey}`}
      style={{ display: 'inline-flex', lineHeight: 0 }}
    >
      <Icon size={size} />
    </span>
  )
}
