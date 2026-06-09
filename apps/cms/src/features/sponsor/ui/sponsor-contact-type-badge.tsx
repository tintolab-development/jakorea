import { EditableStatusBadge } from '@/shared/components/editable-status-badge'
import type { EditableStatusBadgeTone } from '@/shared/constants/editable-status-badge-tones'

export type SponsorContactType = 'lead' | 'assistant'

const LABELS: Record<SponsorContactType, string> = {
  lead: '주 담당자',
  assistant: '담당자',
}

const TONE: Record<SponsorContactType, EditableStatusBadgeTone> = {
  lead: 'blue',
  assistant: 'gray',
}

export interface SponsorContactTypeBadgeProps {
  type: SponsorContactType
}

export function SponsorContactTypeBadge({ type }: SponsorContactTypeBadgeProps) {
  return <EditableStatusBadge label={LABELS[type]} tone={TONE[type]} />
}
