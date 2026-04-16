import { mockPersonalInfoAccessLogs } from '@/data/mock/personal-info-access-logs'
import type {
  PersonalInfoAccessLog,
  PersonalInfoAccessLogFilters,
  RecordPersonalInfoAccessPayload,
} from '@/types/personal-info-access-log'

function normalizeText(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

function applyFilters(
  logs: PersonalInfoAccessLog[],
  filters?: PersonalInfoAccessLogFilters
): PersonalInfoAccessLog[] {
  if (!filters) return logs

  const accessPurpose = normalizeText(filters.accessPurpose)
  const accessorName = normalizeText(filters.accessorName)
  const startDate = filters.startDate ? new Date(filters.startDate).getTime() : null
  const endDate = filters.endDate ? new Date(filters.endDate).getTime() : null

  return logs.filter(log => {
    if (accessPurpose && !log.accessPurpose.toLowerCase().includes(accessPurpose)) return false
    if (accessorName && !log.accessorName.toLowerCase().includes(accessorName)) return false

    const accessedAt = new Date(log.accessedAt).getTime()
    if (startDate != null && accessedAt < startDate) return false
    if (endDate != null && accessedAt > endDate) return false
    return true
  })
}

export async function getPersonalInfoAccessLogs(
  filters?: PersonalInfoAccessLogFilters
): Promise<PersonalInfoAccessLog[]> {
  await new Promise(resolve => setTimeout(resolve, 120))
  const logs = [...mockPersonalInfoAccessLogs].sort(
    (a, b) => new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime()
  )
  return applyFilters(logs, filters)
}

export async function logPersonalInfoAccess(
  log: Omit<PersonalInfoAccessLog, 'id'>
): Promise<PersonalInfoAccessLog> {
  await new Promise(resolve => setTimeout(resolve, 80))
  const newLog: PersonalInfoAccessLog = {
    ...log,
    id: `pi-log-${Math.random().toString(36).slice(2, 11)}-${Date.now()}`,
  }
  mockPersonalInfoAccessLogs.unshift(newLog)
  return newLog
}

export async function recordPersonalInfoAccess(
  payload: RecordPersonalInfoAccessPayload
): Promise<PersonalInfoAccessLog> {
  return logPersonalInfoAccess({
    accessItem: payload.accessItem,
    accessPurpose: payload.accessPurpose,
    accessorId: payload.accessorId ?? 'unknown-user',
    accessorName: payload.accessorName ?? '알 수 없음',
    accessedAt: new Date().toISOString(),
    ipAddress: payload.ipAddress ?? '14.128.xxx.xxx',
  })
}
