/** Gemini 승인 연수의 목록·상세 Text. 날짜/배정 파생은 소비처의 기존 계약을 유지한다. */
import { StatusBadge } from '@/shared/components/status-badge'
import {
  approvedTrainingStatusModifier,
  getGeminiApprovedTrainingStatusPresentation,
} from '../../lib/approved/format-display'
import type { GeminiApprovedTrainingStatus } from '../../model/approved/types'

export function GeminiApprovedTrainingStatusText({
  status,
  context,
}: {
  status: GeminiApprovedTrainingStatus | null
  context: 'list' | 'detail'
}) {
  if (status == null) return '-'
  const base = context === 'list'
    ? 'gemini-approved-training-list__status'
    : 'gemini-approved-training-detail-info__status'
  return (
    <StatusBadge
      domain="custom"
      variant="text"
      {...getGeminiApprovedTrainingStatusPresentation(status)}
      className={`${base} ${base}--${approvedTrainingStatusModifier(status)}`}
    />
  )
}
