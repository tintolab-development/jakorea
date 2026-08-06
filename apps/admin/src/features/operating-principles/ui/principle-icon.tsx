/**
 * 운영 원칙 임시 아이콘 — 고정 매핑, 수정/삭제 불가
 */
import type { ReactElement } from 'react'
import type { PrincipleIconKey } from '@/entities/operating-principles/model/types'

const ICON_COLOR = '#01A1AF'

type PrincipleIconProps = {
  iconKey: PrincipleIconKey
  size?: number
  className?: string
}

function AuditIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="8" y="6" width="24" height="28" rx="2" stroke={ICON_COLOR} strokeWidth="2" />
      <path d="M14 14H26M14 20H26M14 26H20" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="28" r="6" fill={ICON_COLOR} />
      <path
        d="M25.5 28L27.5 30L30.5 26"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BoardIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="14" cy="14" r="5" fill={ICON_COLOR} opacity="0.85" />
      <circle cx="26" cy="14" r="5" fill={ICON_COLOR} />
      <circle cx="20" cy="26" r="5" fill={ICON_COLOR} opacity="0.7" />
      <path
        d="M17 17L19 22M23 17L21 22"
        stroke={ICON_COLOR}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PrivacyIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M20 8L30 13V20C30 26 25.5 31 20 33C14.5 31 10 26 10 20V13L20 8Z"
        fill={ICON_COLOR}
        fillOpacity="0.2"
        stroke={ICON_COLOR}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M17 20L19.5 22.5L24 17"
        stroke={ICON_COLOR}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AssetIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="10" y="14" width="20" height="16" rx="2" fill={ICON_COLOR} fillOpacity="0.2" stroke={ICON_COLOR} strokeWidth="2" />
      <path d="M14 14V12C14 9.8 16.2 8 20 8C23.8 8 26 9.8 26 12V14" stroke={ICON_COLOR} strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="22" r="2.5" fill={ICON_COLOR} />
    </svg>
  )
}

function PartnershipIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="14" cy="16" r="6" stroke={ICON_COLOR} strokeWidth="2" fill={ICON_COLOR} fillOpacity="0.15" />
      <circle cx="26" cy="16" r="6" stroke={ICON_COLOR} strokeWidth="2" fill={ICON_COLOR} fillOpacity="0.35" />
      <path
        d="M10 30C10 26.5 13 24 17 24H23C27 24 30 26.5 30 30"
        stroke={ICON_COLOR}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

const ICONS: Record<PrincipleIconKey, (props: { size: number }) => ReactElement> = {
  p1: AuditIcon,
  p2: BoardIcon,
  p3: PrivacyIcon,
  p4: AssetIcon,
  p5: PartnershipIcon,
}

export function PrincipleIcon({ iconKey, size = 40, className }: PrincipleIconProps) {
  const Icon = ICONS[iconKey] ?? AuditIcon
  return (
    <span
      className={className}
      role="img"
      aria-label={`운영 원칙 아이콘 ${iconKey}`}
      style={{ display: 'inline-flex', lineHeight: 0 }}
    >
      <Icon size={size} />
    </span>
  )
}
