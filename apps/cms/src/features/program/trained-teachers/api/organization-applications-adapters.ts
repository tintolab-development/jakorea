import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import { mapApiApplicationStatusToApprovalStatus } from '@/features/program/general/api/adapters/general-applications-adapters'
import type { TrainedTeacherOrganizationApplicationResponse } from '@/shared/api/generated/dashboard/schemas/trainedTeacherOrganizationApplicationResponse'

function toId(value: number | string | undefined): string {
  if (value == null) return ''
  return String(value)
}

/** TT organization-application DTO → ApplicantSchoolRow */
export function mapTrainedTeacherOrganizationApplicationToRow(
  dto: TrainedTeacherOrganizationApplicationResponse,
  index: number,
  programId: string
): ApplicantSchoolRow {
  const schoolName =
    dto.schoolName?.trim() || dto.organizationName?.trim() || '기관명 없음'
  const memo = dto.desiredEducationScheduleMemo?.trim()
  const region =
    [dto.regionSido, dto.regionSigungu].filter(Boolean).join(' ') ||
    [dto.schoolSido, dto.schoolSigungu].filter(Boolean).join(' ') ||
    [dto.organizationSido, dto.organizationSigungu].filter(Boolean).join(' ') ||
    ''
  return {
    id: toId(dto.applicationId),
    no: index + 1,
    schoolName,
    region,
    educationGrade: '',
    classCount: dto.classCount ?? dto.requestedClassCount ?? 0,
    studentCount: dto.studentCount ?? dto.requestedStudentCount ?? 0,
    teacherName: dto.teacherName?.trim() || '-',
    contact: dto.teacherPhoneMasked?.trim() || undefined,
    appliedAt: dto.submittedAt ?? dto.createdAt,
    approvalStatus: mapApiApplicationStatusToApprovalStatus(dto.applicationStatus),
    programId: toId(dto.programId) || programId,
    desiredEducationPeriod: memo || undefined,
    detail: memo
      ? {
          otherRequests: memo,
        }
      : undefined,
  }
}
