import { AppStatusBadge } from '@/shared/components/app-status-badge'
import '@/shared/components/app-status-badge.css'
import './sponsor-sponsorship-status-badge.css'

export type SponsorContactType = 'lead' | 'assistant'

const LABELS: Record<SponsorContactType, string> = {
  lead: '주 담당자',
  assistant: '담당자',
}

const STATUS_CLASS: Record<SponsorContactType, 'active' | 'ended'> = {
  lead: 'active',
  assistant: 'ended',
}

export interface SponsorContactTypeBadgeProps {
  type: SponsorContactType
}

export function SponsorContactTypeBadge({ type }: SponsorContactTypeBadgeProps) {
  const tone = STATUS_CLASS[type]
  return (
    <AppStatusBadge
      label={LABELS[type]}
      className={`sponsor-sponsorship-status-badge sponsor-sponsorship-status-badge--${tone} sponsor-sponsorship-status-badge--table`}
    />
  )
}
