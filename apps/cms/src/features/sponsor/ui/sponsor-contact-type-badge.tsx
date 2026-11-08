import { StatusTag } from '@/shared/components/status-tag'
import { getSponsorContactTypeTag, type SponsorContactType } from '@/shared/lib/status-tag-specs'

export type { SponsorContactType }

export interface SponsorContactTypeBadgeProps {
  type: SponsorContactType
}

/** 담당자 구분 태그 — 주 담당자 blue · 담당자 gray (공통 StatusTag) */
export function SponsorContactTypeBadge({ type }: SponsorContactTypeBadgeProps) {
  return <StatusTag {...getSponsorContactTypeTag(type)} />
}
