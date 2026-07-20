/**
 * 도메인 공통 진행현황 표시: 프로그램 수강·정산 등
 * - text: 글자색만
 * - badge: 액센트 색 + border 10% + background 6%
 */

import type { CSSProperties } from 'react'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import { programEnrollmentDisplayConfig } from '@/shared/constants/status'
import {
  INSTRUCTOR_SETTLEMENT_STATUS_BADGE_CLASS,
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS,
  type InstructorSettlementUiStatus,
} from '@/shared/constants/instructor-settlement-status'
import './status-badge.css'

export type StatusBadgeVariant = 'text' | 'badge'

function programEnrollmentStatusToKebab(status: ProgramEnrollmentDisplayStatus): string {
  return status.replace(/_/g, '-').toLowerCase()
}

type StatusBadgeProgramEnrollmentProps = {
  domain: 'programEnrollment'
  status: ProgramEnrollmentDisplayStatus
  variant?: StatusBadgeVariant
  className?: string
}

type StatusBadgeSettlementProps = {
  domain: 'settlement'
  status: InstructorSettlementUiStatus
  variant?: StatusBadgeVariant
  className?: string
}

type StatusBadgeCustomProps = {
  domain: 'custom'
  label: string
  accentColor: string
  variant?: StatusBadgeVariant
  className?: string
}

export type StatusBadgeProps =
  | StatusBadgeProgramEnrollmentProps
  | StatusBadgeSettlementProps
  | StatusBadgeCustomProps

export function StatusBadge(props: StatusBadgeProps) {
  const variant: StatusBadgeVariant = props.variant ?? 'badge'
  const variantClass = `status-badge--variant-${variant}`

  if (props.domain === 'custom') {
    const style = { ['--status-accent' as string]: props.accentColor } as CSSProperties
    return (
      <span
        role="status"
        className={`status-badge ${variantClass} status-badge--custom ${props.className ?? ''}`.trim()}
        style={style}
      >
        {props.label}
      </span>
    )
  }

  if (props.domain === 'settlement') {
    const label = INSTRUCTOR_SETTLEMENT_STATUS_LABELS[props.status]
    const mod = INSTRUCTOR_SETTLEMENT_STATUS_BADGE_CLASS[props.status]
    return (
      <span
        role="status"
        className={`status-badge ${variantClass} ${mod} ${props.className ?? ''}`.trim()}
      >
        {label}
      </span>
    )
  }

  const label = programEnrollmentDisplayConfig.labels[props.status]
  const mod = `status-badge--program-enrollment-${programEnrollmentStatusToKebab(props.status)}`
  return (
    <span role="status" className={`status-badge ${variantClass} ${mod} ${props.className ?? ''}`.trim()}>
      {label}
    </span>
  )
}
