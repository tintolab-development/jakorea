import type { ProgramManagerResponse } from '@/shared/api/generated/dashboard/schemas/programManagerResponse'
import type { ProgramManagerRow } from '@/data/mock/program-managers'
import type { ProgramRole } from '@/types/user'
import dayjs from 'dayjs'

const PROGRAM_ROLES: readonly ProgramRole[] = ['OWNER', 'PARTNER', 'ASSISTANT']

export function mapProgramManagerRole(raw: string | undefined | null): ProgramRole {
  const normalized = (raw ?? '').trim().toUpperCase()
  if ((PROGRAM_ROLES as readonly string[]).includes(normalized)) {
    return normalized as ProgramRole
  }
  // BE 별칭 방어
  if (normalized === 'PM' || normalized === 'MANAGER') return 'OWNER'
  if (normalized === 'VIEWER' || normalized === 'ASSIST') return 'ASSISTANT'
  return 'ASSISTANT'
}

function formatAssignedAt(iso: string | undefined | null): string {
  if (!iso?.trim()) return '-'
  const d = dayjs(iso)
  return d.isValid() ? d.format('YYYY.MM.DD HH:mm') : iso.trim()
}

/** 등록일시 오름차순 → No. 1..n (최신 등록이 큰 No) */
export function mapProgramManagerResponsesToRows(
  items: ProgramManagerResponse[]
): ProgramManagerRow[] {
  const sorted = [...items].sort((a, b) => {
    const aTime = a.assignedAt ? dayjs(a.assignedAt).valueOf() : 0
    const bTime = b.assignedAt ? dayjs(b.assignedAt).valueOf() : 0
    if (aTime !== bTime) return aTime - bTime
    return (a.id ?? 0) - (b.id ?? 0)
  })

  return sorted.map((dto, index) => ({
    id: String(dto.id ?? `mgr-${index}`),
    no: index + 1,
    name: dto.adminName?.trim() || '-',
    role: mapProgramManagerRole(dto.role),
    // ProgramManagerResponse에 phone 없음 — 연락처 컬럼은 '-'
    phone: '',
    email: dto.adminEmail?.trim() || '',
    registeredAt: formatAssignedAt(dto.assignedAt),
    adminId: dto.adminId,
    removableYn: dto.removableYn,
  }))
}
