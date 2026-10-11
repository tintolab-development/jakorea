import type { AttendanceItemResponse } from '@/shared/api/generated/dashboard/schemas/attendanceItemResponse'

export type BulkAttendanceScheduleIdsInput =
  | readonly (string | number | null | undefined)[]
  | undefined

export type NormalizedBulkAttendanceScheduleIds =
  | { kind: 'all' }
  | { kind: 'filtered'; scheduleIds: number[] }
  | { kind: 'empty' }

export function normalizeBulkAttendanceScheduleIds(
  scheduleIds?: BulkAttendanceScheduleIdsInput
): NormalizedBulkAttendanceScheduleIds {
  if (scheduleIds === undefined) {
    return { kind: 'all' }
  }
  const ids = [
    ...new Set(
      scheduleIds
        .map(id => (typeof id === 'string' ? Number(id.trim()) : id))
        .filter((id): id is number => typeof id === 'number' && Number.isFinite(id) && id > 0)
    ),
  ].sort((a, b) => a - b)
  if (ids.length === 0) {
    return { kind: 'empty' }
  }
  return { kind: 'filtered', scheduleIds: ids }
}

export function bulkAttendanceScheduleIdsCacheKey(
  normalized: NormalizedBulkAttendanceScheduleIds
): string {
  if (normalized.kind === 'all') return '__all__'
  if (normalized.kind === 'empty') return '__empty__'
  return normalized.scheduleIds.join(',')
}

export function groupAttendancesByScheduleId(
  items: readonly AttendanceItemResponse[]
): Record<string, AttendanceItemResponse[]> {
  const grouped: Record<string, AttendanceItemResponse[]> = {}
  for (const item of items) {
    if (item.scheduleId == null) continue
    const key = String(item.scheduleId)
    const bucket = grouped[key] ?? []
    bucket.push(item)
    grouped[key] = bucket
  }
  return grouped
}

export function ensureAttendancesByScheduleIdKeys(
  grouped: Record<string, AttendanceItemResponse[]>,
  scheduleIds: readonly number[]
): Record<string, AttendanceItemResponse[]> {
  const next = { ...grouped }
  for (const id of scheduleIds) {
    const key = String(id)
    if (!next[key]) {
      next[key] = []
    }
  }
  return next
}
