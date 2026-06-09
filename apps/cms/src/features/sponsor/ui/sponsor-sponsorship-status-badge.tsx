/**
 * 후원사 관리 — 후원 상태 배지 (테이블·StatusDropdownCell·상세 폼 공통)
 */

import type { SponsorSponsorshipStatus } from '@/types/domain'
import { EditableStatusBadge } from '@/shared/components/editable-status-badge'
import {
  getSponsorSponsorshipStatusBadgeTone,
  SPONSOR_SPONSORSHIP_STATUS_LABEL,
} from '@/shared/constants/editable-status-badge-tones'

export interface SponsorSponsorshipStatusBadgeProps {
  status: SponsorSponsorshipStatus
  className?: string
}

export function SponsorSponsorshipStatusBadge({
  status,
  className,
}: SponsorSponsorshipStatusBadgeProps) {
  return (
    <EditableStatusBadge
      label={SPONSOR_SPONSORSHIP_STATUS_LABEL[status]}
      tone={getSponsorSponsorshipStatusBadgeTone(status)}
      className={className}
    />
  )
}
