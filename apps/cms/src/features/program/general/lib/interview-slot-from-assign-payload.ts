import dayjs from 'dayjs'
import { parseInterviewDisplayDateLabel } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assign/schedule-utils'

/**
 * 면접 배정 모달 payload(dateLabel + timeRange) → OpenAPI InterviewSlotCreateRequest 필드.
 * timeRange 예: `10:00-11:00` / `10:00 ~ 11:00`
 */
export function buildInterviewSlotTimesFromAssignPayload(params: {
  dateLabel: string
  timeRange: string
}): { slotDate: string; startAt: string; endAt: string } | null {
  const date = parseInterviewDisplayDateLabel(params.dateLabel)
  if (!date) return null

  const normalized = params.timeRange.replace(/\s/g, '').replace('~', '-')
  const match = normalized.match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/)
  if (!match) return null

  const slotDate = date.format('YYYY-MM-DD')
  const startAt = dayjs(`${slotDate}T${match[1]}:00`).toISOString()
  const endAt = dayjs(`${slotDate}T${match[2]}:00`).toISOString()
  return { slotDate, startAt, endAt }
}
