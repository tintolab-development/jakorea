import type { ScreeningResultNotifyFields } from '@/features/program/general/api/applications-api-client'

/** UI 문자열 notifyTiming → OpenAPI enum (런타임 검증 없음, BE가 최종 검증) */
export function toScreeningResultNotifyFields(input?: {
  notifyTiming?: string | null
  scheduledAt?: string | null
}): ScreeningResultNotifyFields | undefined {
  if (!input) return undefined
  const scheduledAt = input.scheduledAt?.trim() || undefined
  const notifyTiming = input.notifyTiming?.trim() || undefined
  if (!notifyTiming && !scheduledAt) return undefined
  return { notifyTiming, scheduledAt }
}

export function toInterviewAssignmentNotifyFields(input?: {
  notifyTiming?: string | null
  scheduledAt?: string | null
}): ScreeningResultNotifyFields | undefined {
  return toScreeningResultNotifyFields(input)
}
