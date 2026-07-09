import type { SchoolAffiliatedTeacherRow as ApiSchoolAffiliatedTeacherRow } from '@/shared/api/generated/members/schemas/schoolAffiliatedTeacherRow'
import type { SchoolAffiliatedTeacherRow, SchoolTeacherEmploymentStatus } from '@/types/user'

function mapEmploymentStatus(raw?: string): SchoolTeacherEmploymentStatus {
  const v = raw?.trim().toUpperCase()
  if (v === 'ON_LEAVE' || v === 'LEAVE') return 'ON_LEAVE'
  if (v === 'WITHDRAWN' || v === 'RESIGNED') return 'WITHDRAWN'
  if (v === 'TRANSFERRED') return 'TRANSFERRED'
  return 'ACTIVE'
}

export function mapAffiliatedTeacherRow(
  row: ApiSchoolAffiliatedTeacherRow
): SchoolAffiliatedTeacherRow {
  const id = row.id?.trim() || row.linkedUserId?.trim() || `teacher-${crypto.randomUUID()}`
  return {
    id,
    name: row.name?.trim() || '-',
    assignedGrade: row.assignedGrade?.trim() || '-',
    phone: row.phone?.trim() || '-',
    email: row.email?.trim() || '-',
    employmentStatus: mapEmploymentStatus(row.employmentStatus),
    joinedAt: row.joinedAt ?? new Date().toISOString(),
    ...(row.linkedUserId?.trim() ? { linkedUserId: row.linkedUserId.trim() } : {}),
  }
}

export function mapAffiliatedTeacherRows(
  rows: ApiSchoolAffiliatedTeacherRow[] | undefined
): SchoolAffiliatedTeacherRow[] {
  if (!rows?.length) return []
  return rows.map(mapAffiliatedTeacherRow)
}
