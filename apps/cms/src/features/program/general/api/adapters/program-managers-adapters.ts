import type { ProgramManagerResponse } from '@/shared/api/generated/dashboard/schemas/programManagerResponse'
import type { ProgramManagerRow } from '@/features/program/general/model/program-managers'
import type { ProgramRole } from '@/types/user'
import dayjs from 'dayjs'

const PROGRAM_ROLES: readonly ProgramRole[] = ['OWNER', 'PARTNER', 'ASSISTANT']

/** BE `ProgramAdminAssignmentRole` — PM | PARTNER | VIEWER */
export type ProgramManagerApiRole = 'PM' | 'PARTNER' | 'VIEWER'

export function mapProgramManagerRole(raw: string | undefined | null): ProgramRole | null {
  const normalized = (raw ?? '').trim().toUpperCase()
  if ((PROGRAM_ROLES as readonly string[]).includes(normalized)) {
    return normalized as ProgramRole
  }
  // BE 저장/응답 정본: PM | PARTNER | VIEWER. 요청 별칭 OWNER·ROLE_LEAD·PROGRAM_LEAD → PM.
  // 알 수 없는 코드는 ASSISTANT로 내리지 않는다.
  if (
    normalized === 'PM' ||
    normalized === 'OWNER' ||
    normalized === 'ROLE_LEAD' ||
    normalized === 'PROGRAM_LEAD'
  ) {
    return 'OWNER'
  }
  if (normalized === 'VIEWER' || normalized === 'ASSIST') return 'ASSISTANT'
  return null
}

/** UI ProgramRole → BE assignment role
 * - OWNER → PM
 * - ASSISTANT(UI 뷰어) → VIEWER 리터럴. ASSISTANT를 보내면 BE가 PARTNER로 저장한다.
 * - MANAGER는 별칭이 없어 보내지 않는다.
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

  const rows: ProgramManagerRow[] = []
  for (const dto of sorted) {
    const role = mapProgramManagerRole(dto.role)
    if (!role) continue
    rows.push({
      id: String(dto.id ?? `mgr-${rows.length}`),
      no: rows.length + 1,
      name: dto.adminName?.trim() || '-',
      role,
      // GET …/managers adminPhone — /admin-accounts 목록과 동일 마스킹. 서버 값을 그대로 쓴다.
      phone: dto.adminPhone?.trim() || '',
      email: dto.adminEmail?.trim() || '',
      registeredAt: formatAssignedAt(dto.assignedAt),
      adminId: dto.adminId,
      cmsRoleCode: dto.adminRoleCode?.trim() || undefined,
      removableYn: dto.removableYn,
    })
  }
  return rows
}
