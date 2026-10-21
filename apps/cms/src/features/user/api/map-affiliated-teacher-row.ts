import type { SchoolAffiliatedTeacherRow as ApiSchoolAffiliatedTeacherRow } from '@/shared/api/generated/members/schemas/schoolAffiliatedTeacherRow'
import type { SchoolAffiliatedTeacherResponse } from '@/shared/api/generated/members/schemas/schoolAffiliatedTeacherResponse'
import type { SchoolAffiliatedTeacherRow, SchoolTeacherEmploymentStatus } from '@/types/user'
import { registerMemberIdMapping } from '@/features/user/api/member-id-registry'
import { coercePositiveInt } from '@/features/user/api/user-response-row-id'

type AffiliatedTeacherApiRow = ApiSchoolAffiliatedTeacherRow | SchoolAffiliatedTeacherResponse

function mapEmploymentStatus(raw?: string): SchoolTeacherEmploymentStatus {
  const v = raw?.trim().toUpperCase()
  if (v === 'ON_LEAVE' || v === 'LEAVE') return 'ON_LEAVE'
  if (v === 'WITHDRAWN' || v === 'RESIGNED') return 'WITHDRAWN'
  if (v === 'TRANSFERRED') return 'TRANSFERRED'
  return 'ACTIVE'
}

function resolveTeacherMemberId(row: AffiliatedTeacherApiRow): number | undefined {
  return coercePositiveInt(row.memberId)
}

export function mapAffiliatedTeacherRow(row: AffiliatedTeacherApiRow): SchoolAffiliatedTeacherRow {
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
  rows: AffiliatedTeacherApiRow[] | undefined
): SchoolAffiliatedTeacherRow[] {
  if (!rows?.length) return []
  return rows.map(mapAffiliatedTeacherRow)
}

/** 소속 교사 선택 탈퇴 — uuid 또는 memberId 중 하나로 회원 삭제 식별자를 만든다. */
export function resolveAffiliatedTeacherWithdrawTarget(row: {
  linkedUserId?: string
  teacherMemberId?: number
}): { userId: string; memberId?: number } | null {
  const memberId = coercePositiveInt(row.teacherMemberId)
  const userId = row.linkedUserId?.trim() || (memberId != null ? String(memberId) : '')
  if (!userId) return null
  return { userId, ...(memberId != null ? { memberId } : {}) }
}
