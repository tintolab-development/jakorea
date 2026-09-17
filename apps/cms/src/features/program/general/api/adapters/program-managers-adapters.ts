import type { ProgramManagerResponse } from '@/shared/api/generated/dashboard/schemas/programManagerResponse'
import type { ProgramManagerRow } from '@/features/program/general/model/program-managers'
import type { ProgramRole } from '@/types/user'
import dayjs from 'dayjs'

const PROGRAM_ROLES: readonly ProgramRole[] = ['OWNER', 'PARTNER', 'ASSISTANT']

/** BE `ProgramAdminAssignmentRole` — PM | PARTNER | VIEWER */
export type ProgramManagerApiRole = 'PM' | 'PARTNER' | 'VIEWER'

export function mapProgramManagerRole(raw: string | undefined | null): ProgramRole {
  const normalized = (raw ?? '').trim().toUpperCase()
  if ((PROGRAM_ROLES as readonly string[]).includes(normalized)) {
    return normalized as ProgramRole
  }
  // BE canonical: PM / PARTNER / VIEWER
  if (normalized === 'PM' || normalized === 'MANAGER' || normalized === 'ROLE_LEAD') {
    return 'OWNER'
  }
  if (normalized === 'VIEWER' || normalized === 'ASSIST') return 'ASSISTANT'
  return 'ASSISTANT'
}

/** UI ProgramRole → BE assignment role
 * - OWNER → PM (별칭 허용)
 * - ASSISTANT(UI 라벨: 뷰어) → VIEWER (조회 전용)
 * BE가 요청 문자열 `ASSISTANT`를 PARTNER로 별칭 처리해도, FE는 VIEWER를 보낸다.
 */
export function toProgramManagerApiRole(role: ProgramRole): ProgramManagerApiRole {
  switch (role) {
    case 'OWNER':
      return 'PM'
    case 'PARTNER':
      return 'PARTNER'
    case 'ASSISTANT':
      return 'VIEWER'
    default: {
      const _exhaustive: never = role
      return _exhaustive
    }
  }
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
