/**
 * 후원사 관리 — 후원 상태 배지 (테이블·StatusDropdownCell 공통)
 */

import type { CSSProperties } from 'react'
import type { SponsorSponsorshipStatus } from '@/types/domain'
import { AppStatusBadge } from '@/shared/components/app-status-badge'
import '@/shared/components/app-status-badge.css'
import './sponsor-sponsorship-status-badge.css'

const LABELS: Record<SponsorSponsorshipStatus, string> = {
  active: '진행 중',
  ended: '후원 종료',
}

export interface SponsorSponsorshipStatusBadgeProps {
  status: SponsorSponsorshipStatus
  /** 테이블 컬럼: 고정 120×30 해제, 라벨 길이에 맞춤 */
  variant?: 'default' | 'table'
  className?: string
  style?: CSSProperties
}

export function SponsorSponsorshipStatusBadge({
  status,
  variant = 'default',
  className,
  style,
}: SponsorSponsorshipStatusBadgeProps) {
  const variantClass = variant === 'table' ? ' sponsor-sponsorship-status-badge--table' : ''
  return (
    <AppStatusBadge
      label={LABELS[status]}
      className={`sponsor-sponsorship-status-badge sponsor-sponsorship-status-badge--${status}${variantClass} ${className ?? ''}`.trim()}
      style={style}
    />
  )
}
