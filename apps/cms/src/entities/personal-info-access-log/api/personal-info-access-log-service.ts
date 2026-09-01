/**
 * 개인정보 조회 기록 (write-only stub — 목록은 GET /api/logs/privacy-access)
 */

import type {
  PersonalInfoAccessLog,
  RecordPersonalInfoAccessPayload,
} from '@/types/personal-info-access-log'

const personalInfoAccessLogMemory: PersonalInfoAccessLog[] = []

export async function logPersonalInfoAccess(
  log: Omit<PersonalInfoAccessLog, 'id'>
): Promise<PersonalInfoAccessLog> {
  await new Promise(resolve => setTimeout(resolve, 80))
  const newLog: PersonalInfoAccessLog = {
    ...log,
    id: `pi-log-${Math.random().toString(36).slice(2, 11)}-${Date.now()}`,
  }
  personalInfoAccessLogMemory.unshift(newLog)
  return newLog
}

export async function recordPersonalInfoAccess(
  payload: RecordPersonalInfoAccessPayload
): Promise<PersonalInfoAccessLog> {
  return logPersonalInfoAccess({
    targetName: payload.targetName ?? '-',
    accessItem: payload.accessItem,
    accessPurpose: payload.accessPurpose,
    accessorId: payload.accessorId ?? 'unknown-user',
    accessorName: payload.accessorName ?? '알 수 없음',
    accessedAt: new Date().toISOString(),
    ipAddress: payload.ipAddress ?? '14.128.xxx.xxx',
  })
}
