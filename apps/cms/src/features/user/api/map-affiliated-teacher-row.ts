import type { SchoolAffiliatedTeacherRow as ApiSchoolAffiliatedTeacherRow } from '@/shared/api/generated/members/schemas/schoolAffiliatedTeacherRow'
import type { SchoolAffiliatedTeacherRow, SchoolTeacherEmploymentStatus } from '@/types/user'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'

function mapEmploymentStatus(raw?: string): SchoolTeacherEmploymentStatus {
  const v = raw?.trim().toUpperCase()
  if (v === 'ON_LEAVE' || v === 'LEAVE') return 'ON_LEAVE'
  if (v === 'WITHDRAWN' || v === 'RESIGNED') return 'WITHDRAWN'
  if (v === 'TRANSFERRED') return 'TRANSFERRED'
  return 'ACTIVE'
}

function resolveTeacherMemberId(row: ApiSchoolAffiliatedTeacherRow): number | undefined {
  if (typeof row.memberId === 'number' && Number.isFinite(row.memberId)) {
    return row.memberId
  }
  return undefined
}

export function mapAffiliatedTeacherRow(
  row: ApiSchoolAffiliatedTeacherRow
): SchoolAffiliatedTeacherRow {
  const teacherMemberId = resolveTeacherMemberId(row)
  /** API UUID가 없으면 memberId로 상세 이동 식별자를 보정한다. */
  const linkedUserId =
    row.uuid?.trim() || (teacherMemberId != null ? String(teacherMemberId) : undefined)

  if (linkedUserId && teacherMemberId != null) {
    registerMemberIdMapping(linkedUserId, teacherMemberId)
  }

  const id =
    row.uuid?.trim() ||
    linkedUserId ||
    (teacherMemberId != null ? String(teacherMemberId) : `teacher-${crypto.randomUUID()}`)
  return {
    id,
    name: row.name?.trim() || '-',
    assignedGrade: row.assignedGrade?.trim() || '-',
    phone: row.phone?.trim() || '-',
    email: row.email?.trim() || '-',
    employmentStatus: mapEmploymentStatus(row.employmentStatus),
    joinedAt: row.joinedAt ?? new Date().toISOString(),
    ...(linkedUserId ? { linkedUserId } : {}),
    ...(teacherMemberId != null ? { teacherMemberId } : {}),
  }
}

export function mapAffiliatedTeacherRows(
  rows: ApiSchoolAffiliatedTeacherRow[] | undefined
): SchoolAffiliatedTeacherRow[] {
  if (!rows?.length) return []
  return rows.map(mapAffiliatedTeacherRow)
}
