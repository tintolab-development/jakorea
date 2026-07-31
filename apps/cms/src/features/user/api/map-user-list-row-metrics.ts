import type { UserListRowMetrics } from '@/types/user'
import type { UserListRowMetrics as ApiUserListRowMetrics } from '@/shared/api/generated/members/schemas/userListRowMetrics'
import { roleCodeToAdminPermissionVariant } from '@/features/user/api/admin-approval-role'
import {
  resolveInstructorPublicTextField,
  toInstructorFeeGradeDisplayLabel,
} from '@/features/user/api/map-instructor-activity-display'

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
  const feeGradeLabel = toInstructorFeeGradeDisplayLabel(metrics.instructorFeeGradeLabel)
  if (feeGradeLabel) {
    mapped.instructorFeeGradeLabel = feeGradeLabel
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
    const label = resolveInstructorPublicTextField(metrics.highestEducationLabel)
    if (label) mapped.highestEducationLabel = label
  }
  if (metrics.instructorCareerSummaryLabel?.trim()) {
    const label = resolveInstructorPublicTextField(metrics.instructorCareerSummaryLabel)
    if (label) mapped.instructorCareerSummaryLabel = label
  }
  if (metrics.instructorCareerYearsLabel?.trim()) {
    const label = resolveInstructorPublicTextField(metrics.instructorCareerYearsLabel)
    if (label) mapped.instructorCareerYearsLabel = label
  }

  return Object.keys(mapped).length > 0 ? mapped : undefined
}
