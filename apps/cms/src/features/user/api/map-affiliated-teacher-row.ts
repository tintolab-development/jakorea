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
  if (typeof row.teacherMemberId === 'number' && Number.isFinite(row.teacherMemberId)) {
    return row.teacherMemberId
  }
  if (typeof row.memberId === 'number' && Number.isFinite(row.memberId)) {
    return row.memberId
  }
  if (typeof row.id === 'number' && Number.isFinite(row.id) && row.id > 0) {
    return row.id
  }
  const fromLinked = Number(row.linkedUserId)
  if (
    row.linkedUserId != null &&
    Number.isFinite(fromLinked) &&
    String(fromLinked) === String(row.linkedUserId).trim()
  ) {
    return fromLinked
  }
  return undefined
}

export function mapAffiliatedTeacherRow(
  row: ApiSchoolAffiliatedTeacherRow
): SchoolAffiliatedTeacherRow {
  const teacherMemberId = resolveTeacherMemberId(row)
  const linkedFromApi = row.linkedUserId?.trim() || undefined
  const rowId = row.id != null ? String(row.id) : undefined
  /** API가 linkedUserId를 생략해도 teacherMemberId/id로 상세 이동 가능하도록 보정 */
  const linkedUserId =
    linkedFromApi ||
    (row.uuid?.trim() || undefined) ||
    (teacherMemberId != null ? String(teacherMemberId) : undefined) ||
    rowId

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
