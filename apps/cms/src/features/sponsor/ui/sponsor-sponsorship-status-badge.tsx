/**
 * 후원사 관리 — 후원 상태 태그 (테이블·StatusDropdownCell·상세 폼 공통, 공통 StatusTag)
 */

import type { SponsorSponsorshipStatus } from '@/types/domain'
import { StatusTag } from '@/shared/components/status-tag'
import { getSponsorSponsorshipStatusTag } from '@/shared/lib/status-tag-specs'

export interface SponsorSponsorshipStatusBadgeProps {
  status: SponsorSponsorshipStatus
}

export function SponsorSponsorshipStatusBadge({ status }: SponsorSponsorshipStatusBadgeProps) {
  return <StatusTag {...getSponsorSponsorshipStatusTag(status)} />
}
