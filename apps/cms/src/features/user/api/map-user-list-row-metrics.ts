import type { UserListRowMetrics } from '@/types/user'
import type { UserListRowMetrics as ApiUserListRowMetrics } from '@/shared/api/generated/members/schemas/userListRowMetrics'
import { roleCodeToAdminPermissionVariant } from '@/features/user/api/admin-approval-role'

export function mapApiUserListRowMetrics(
  metrics?: ApiUserListRowMetrics | null
): UserListRowMetrics | undefined {
  if (!metrics || typeof metrics !== 'object') return undefined

  const mapped: UserListRowMetrics = {}
  if (metrics.institutionProgramApplicationCount != null) {
    mapped.institutionProgramApplicationCount = metrics.institutionProgramApplicationCount
  }
  if (metrics.institutionProgramAttendanceCount != null) {
    mapped.institutionProgramAttendanceCount = metrics.institutionProgramAttendanceCount
  }
  if (metrics.institutionRegisteredTeacherCount != null) {
    mapped.institutionRegisteredTeacherCount = metrics.institutionRegisteredTeacherCount
  }
  if (metrics.instructorTypeLabel?.trim()) {
    mapped.instructorTypeLabel = metrics.instructorTypeLabel.trim()
  }
  if (metrics.instructorFeeGradeLabel?.trim()) {
    mapped.instructorFeeGradeLabel = metrics.instructorFeeGradeLabel.trim()
  }
  if (metrics.permissionApplicationTypeLabel?.trim()) {
    mapped.permissionApplicationTypeLabel = metrics.permissionApplicationTypeLabel.trim()
  }
  if (metrics.jaEvaluationGrade?.trim()) {
    mapped.jaEvaluationGrade = metrics.jaEvaluationGrade.trim()
  }
  if (metrics.settlementStatusLabel?.trim()) {
    mapped.settlementStatusLabel = metrics.settlementStatusLabel.trim()
  }
  if (metrics.managedProgramCount != null) {
    mapped.managedProgramCount = metrics.managedProgramCount
  }
  if (metrics.managedProgramInProgressCount != null) {
    mapped.managedProgramInProgressCount = metrics.managedProgramInProgressCount
  }
  const adminVariant = roleCodeToAdminPermissionVariant(metrics.adminPermissionVariant)
  if (adminVariant) mapped.adminPermissionVariant = adminVariant
  if (metrics.employmentStatusLabel?.trim()) {
    mapped.employmentStatusLabel = metrics.employmentStatusLabel.trim()
  }
  if (metrics.instructorAssignedGrade?.trim()) {
    mapped.instructorAssignedGrade = metrics.instructorAssignedGrade.trim()
  }
  if (metrics.highestEducationLabel?.trim()) {
    mapped.highestEducationLabel = metrics.highestEducationLabel.trim()
  }
  if (metrics.instructorCareerSummaryLabel?.trim()) {
    mapped.instructorCareerSummaryLabel = metrics.instructorCareerSummaryLabel.trim()
  }
  if (metrics.instructorCareerYearsLabel?.trim()) {
    mapped.instructorCareerYearsLabel = metrics.instructorCareerYearsLabel.trim()
  }

  return Object.keys(mapped).length > 0 ? mapped : undefined
}
