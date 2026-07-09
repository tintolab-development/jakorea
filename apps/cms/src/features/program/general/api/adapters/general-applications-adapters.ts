import type { ApplicantApprovalStatusKey, ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import type { OrganizationApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/organizationApplicationListItemResponse'
import type { InstructorApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationListItemResponse'
import type { IndividualApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/individualApplicationListItemResponse'
import type { ParticipantListItemResponse } from '@/shared/api/generated/dashboard/schemas/participantListItemResponse'
import type { ParticipatingIndividualParticipantRow } from '@/data/mock/participating-individual-participants'

function toId(value: number | string | undefined): string {
  if (value == null) return ''
  return String(value)
}

export function mapApiApplicationStatusToApprovalStatus(
  status?: string
): ApplicantApprovalStatusKey {
  const normalized = status?.trim().toUpperCase() ?? ''
  if (['APPROVED', 'ASSIGNED', 'WAITING_ASSIGNMENT'].includes(normalized)) {
    return 'approved'
  }
  if (['REJECTED', 'AUTO_REJECTED', 'CANCELLED'].includes(normalized)) {
    return 'rejected'
  }
  return 'pending'
}

export function mapApprovalStatusToApiFilter(
  status?: ApplicantApprovalStatusKey
): string | undefined {
  if (!status) return undefined
  switch (status) {
    case 'approved':
      return 'APPROVED'
    case 'rejected':
      return 'REJECTED'
    case 'pending':
      return 'WAITING_REVIEW'
    default:
      return undefined
  }
}

export function mapOrganizationApplicationToApplicantSchoolRow(
  dto: OrganizationApplicationListItemResponse,
  index: number,
  programId: string
): ApplicantSchoolRow {
  return {
    id: toId(dto.id),
    no: index + 1,
    schoolName: dto.organizationName?.trim() || '기관명 없음',
    region: '',
    educationGrade: '',
    classCount: dto.requestedClassCount ?? 0,
    studentCount: dto.requestedStudentCount ?? 0,
    teacherName: dto.teacherName?.trim() || '-',
    appliedAt: dto.submittedAt,
    approvalStatus: mapApiApplicationStatusToApprovalStatus(dto.applicationStatus),
    programId,
  }
}

export function mapInstructorApplicationToApplicantInstructorRow(
  dto: InstructorApplicationListItemResponse,
  index: number,
  _programId: string
): ApplicantInstructorRow {
  return {
    id: toId(dto.id),
    no: index + 1,
    instructorName: dto.instructorName?.trim() || '이름 없음',
    lectureExperienceYears: 0,
    educationLevel: '',
    educationSchoolName: '',
    contact: '',
    email: '',
    address: '',
    appliedAt: dto.submittedAt,
    schoolName: '',
    approvalStatus: mapApiApplicationStatusToApprovalStatus(dto.applicationStatus),
    instructorFeeGradeLabel: dto.instructorFeeGradeSnapshot,
  }
}

export function mapIndividualApplicationToApplicantRow(
  dto: IndividualApplicationListItemResponse,
  index: number,
  programId: string
): GeneralIndividualApplicantRow {
  return {
    id: toId(dto.id),
    no: index + 1,
    applicantName: dto.memberName?.trim() || '이름 없음',
    affiliation: '',
    educationGrade: '',
    homeAddress: '',
    appliedAt: dto.submittedAt,
    approvalStatus: mapApiApplicationStatusToApprovalStatus(dto.applicationStatus),
    programId,
  } as GeneralIndividualApplicantRow
}

export function mapParticipantToParticipatingIndividualRow(
  dto: ParticipantListItemResponse,
  index: number,
  programId: string
): ParticipatingIndividualParticipantRow {
  return {
    id: toId(dto.participantId),
    no: index + 1,
    applicantName: dto.memberName?.trim() || '이름 없음',
    affiliation: '',
    educationGrade: '',
    homeAddress: '',
    approvalStatus: 'approved',
    programId,
    lectureAttendanceSessions: [],
    satisfactionSurveyCompleted: false,
    participationAppliedAt: dto.joinedAt ?? '',
    activityWithdrawn: dto.giveUpAt != null,
  }
}
