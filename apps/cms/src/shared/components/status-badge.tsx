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
  getInstructorSettlementStatusPresentation,
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
  /** 원문 API 별칭은 문구를 바꾸지 않고 동일 업무 색만 공유한다. */
  label?: string
  title?: string
  variant?: StatusBadgeVariant
  className?: string
}

type StatusBadgeCustomProps = {
  domain: 'custom'
  label: string
  accentColor: string
  /** 문구·색과 독립적인 약화 표현(현행 opacity 50%). */
  muted?: boolean
  /** 행 약화와 별도로 상태 Text 자체의 기존 opacity를 보존한다. */
  opacity?: number
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
    const style = { ['--status-accent' as string]: props.accentColor, opacity: props.opacity } as CSSProperties
    return (
      <span
        role="status"
        className={`status-badge ${variantClass} status-badge--custom ${props.muted ? 'status-badge--muted' : ''} ${props.className ?? ''}`.trim()}
        style={style}
      >
        {props.label}
      </span>
    )
  }

  if (props.domain === 'settlement') {
    const presentation = getInstructorSettlementStatusPresentation(
      props.status, variant === 'text' ? 'text' : 'tag'
    )
    const label = props.label ?? presentation.label
    const style = { ['--status-accent' as string]: presentation.color } as CSSProperties
    const mod = INSTRUCTOR_SETTLEMENT_STATUS_BADGE_CLASS[props.status]
    return (
      <span
        role="status"
        className={`status-badge ${variantClass} status-badge--settlement-presentation ${mod} ${props.className ?? ''}`.trim()}
        style={style}
        title={props.title}
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
