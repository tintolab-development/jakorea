import type { Application } from '@/types/domain'
import type { SchoolOrganizationProgramEnrollmentHistoryItemResponse } from '@/features/user/api/school-organization-program-enrollment-history.types'

export const SCHOOL_ORG_ENROLLMENT_ROW_ID_PREFIX = 'org-enroll-'

export function toSchoolOrganizationEnrollmentRowId(historyRowId: number): string {
  return `${SCHOOL_ORG_ENROLLMENT_ROW_ID_PREFIX}${historyRowId}`
}

export function parseSchoolOrganizationEnrollmentRowId(
  rowId: string
): { historyRowId: number } | null {
  const trimmed = rowId.trim()
  const match = new RegExp(`^${SCHOOL_ORG_ENROLLMENT_ROW_ID_PREFIX}(\\d+)$`).exec(trimmed)
  if (!match) return null
  const historyRowId = Number(match[1])
  if (!Number.isFinite(historyRowId)) return null
  return { historyRowId }
}

export function mapSchoolOrganizationProgramEnrollmentHistoryItem(
  item: SchoolOrganizationProgramEnrollmentHistoryItemResponse,
  organizationUserId: string
): Application {
  const now = new Date().toISOString()
  const historyRowId = item.historyRowId
  const programId = String(item.programId)

  return {
    id: toSchoolOrganizationEnrollmentRowId(historyRowId),
    programId,
    subjectType: 'school',
    subjectId: organizationUserId,
    status: 'submitted',
    managerName: item.managerName?.trim() || undefined,
    submittedAt: item.submittedAt ?? now,
    createdAt: item.submittedAt ?? now,
    updatedAt: item.submittedAt ?? now,
    customFields: {
      programName: item.programName?.trim() || undefined,
      progressYear: item.progressYear,
      enrollmentDisplayStatus: item.enrollmentDisplayStatus,
      businessArea: item.businessArea?.trim() || undefined,
      educationGrade: item.educationGrade?.trim() || undefined,
      organizationApplicationId: item.organizationApplicationId,
      historyRowId,
      deletable: item.deletable,
    },
  }
}

export function mapSchoolOrganizationProgramEnrollmentHistoryItems(
  items: SchoolOrganizationProgramEnrollmentHistoryItemResponse[] | undefined,
  organizationUserId: string
): Application[] {
  if (!items?.length) return []
  return items.map(item =>
    mapSchoolOrganizationProgramEnrollmentHistoryItem(item, organizationUserId)
  )
}
