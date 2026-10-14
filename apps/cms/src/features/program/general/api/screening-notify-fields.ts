import type { DocumentResultRequestNotifyTiming } from '@/shared/api/generated/dashboard/schemas/documentResultRequestNotifyTiming'
import type { InterviewAssignmentCreateRequestNotifyTiming } from '@/shared/api/generated/dashboard/schemas/interviewAssignmentCreateRequestNotifyTiming'
import type { ScreeningResultNotifyFields } from '@/features/program/general/api/applications-api-client'

/** UI 문자열 notifyTiming → OpenAPI enum (런타임 검증 없음, BE가 최종 검증) */
export function toScreeningResultNotifyFields(input?: {
  notifyTiming?: string | null
  scheduledAt?: string | null
}): ScreeningResultNotifyFields | undefined {
  if (!input) return undefined
  const scheduledAt = input.scheduledAt?.trim() || undefined
  const raw = input.notifyTiming?.trim()
  const notifyTiming = raw
    ? (raw as DocumentResultRequestNotifyTiming)
    : undefined
  if (!notifyTiming && !scheduledAt) return undefined
  return { notifyTiming, scheduledAt }
}

export function toInterviewAssignmentNotifyFields(input?: {
  notifyTiming?: string | null
  scheduledAt?: string | null
}): { notifyTiming?: InterviewAssignmentCreateRequestNotifyTiming; scheduledAt?: string } | undefined {
  const base = toScreeningResultNotifyFields(input)
  if (!base) return undefined
  return {
    ...(base.notifyTiming
      ? { notifyTiming: base.notifyTiming as InterviewAssignmentCreateRequestNotifyTiming }
      : {}),
    ...(base.scheduledAt ? { scheduledAt: base.scheduledAt } : {}),
  }
}
