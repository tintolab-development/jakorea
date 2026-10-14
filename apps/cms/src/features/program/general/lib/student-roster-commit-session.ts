/**
 * 학생 명단 PUT 편집·추가 세션 — organizationApplicationId + expectedRevisionNo 스냅샷
 */

import type { SchoolDetailStudentRow } from '@/features/program/general/model/school-detail-types'
import {
  parseStudentRosterRevisionNo,
  type StudentRosterCommitSession,
} from '@/features/program/general/lib/student-roster-revision'

export function createStudentRosterCommitSession(input: {
  organizationApplicationId: string
  revisionNo: number | null | undefined
  baselineRows?: SchoolDetailStudentRow[]
}): StudentRosterCommitSession | null {
  const orgId = input.organizationApplicationId.trim()
  const expectedRevisionNo = parseStudentRosterRevisionNo(input.revisionNo)
  if (!orgId || expectedRevisionNo == null) return null
  return {
    organizationApplicationId: orgId,
    expectedRevisionNo,
    baselineRows: input.baselineRows,
  }
}

export function isStudentRosterCommitSessionForOrganization(
  session: StudentRosterCommitSession | null | undefined,
  organizationApplicationId: string
): boolean {
  if (!session) return false
  return session.organizationApplicationId === String(organizationApplicationId).trim()
}
