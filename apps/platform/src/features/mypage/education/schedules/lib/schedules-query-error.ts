import { isAxiosError } from 'axios'
import { getApplicationApiErrorCode } from '@/features/program/lib/application-api-error'

export function getEducationSchedulesQueryErrorCode(error: unknown): string | null {
  return getApplicationApiErrorCode(error)
}

export function getEducationSchedulesQueryTraceId(error: unknown): string | null {
  if (!isAxiosError(error)) return null
  const data = error.response?.data
  if (!data || typeof data !== 'object') return null
  const record = data as { error?: { traceId?: unknown } }
  const traceId = record.error?.traceId
  if (typeof traceId !== 'string') return null
  const trimmed = traceId.trim()
  return trimmed.length > 0 ? trimmed : null
}
