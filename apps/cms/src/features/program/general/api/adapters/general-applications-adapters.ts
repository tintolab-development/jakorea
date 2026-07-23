import type { ApplicantApprovalStatusKey, ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import type { ParticipatingVolunteerRow } from '@/data/mock/participating-volunteers'
import type { OrganizationApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/organizationApplicationListItemResponse'
import type { InstructorApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationListItemResponse'
import type { IndividualApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/individualApplicationListItemResponse'
import type { ParticipantListItemResponse } from '@/shared/api/generated/dashboard/schemas/participantListItemResponse'
import type { VolunteerApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/volunteerApplicationListItemResponse'
import type { ParticipatingIndividualParticipantRow } from '@/data/mock/participating-individual-participants'
import type {
  GeneralDocumentScreeningStatus,
  GeneralInterviewAssignmentStatus,
  GeneralSecondInterviewScreeningStatus,
} from '@/features/program/general/lib/volunteer-screening-constants'

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
    instructorFeeGradeLabel: dto.instructorFeeGradeSnapshot?.trim() || undefined,
    rejectionReason: dto.rejectReason?.trim() || undefined,
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

export function mapApiDocumentStatusToScreeningStatus(
  status?: string
): GeneralDocumentScreeningStatus {
  const normalized = status?.trim().toUpperCase() ?? ''
  if (['PASS', 'PASSED', 'APPROVED'].includes(normalized)) return 'pass'
  if (['FAIL', 'FAILED', 'REJECTED', 'AUTO_REJECTED'].includes(normalized)) return 'fail'
  return 'pending'
}

export function mapApiInterviewStatusToAssignmentStatus(
  status?: string,
  giveUpYn?: boolean
): GeneralInterviewAssignmentStatus {
  if (giveUpYn) return 'withdrawn'
  const normalized = status?.trim().toUpperCase() ?? ''
  if (['ASSIGNED', 'COMPLETED'].includes(normalized)) return 'assigned'
  if (['WITHDRAWN', 'GIVE_UP', 'CANCELLED'].includes(normalized)) return 'withdrawn'
  return 'waiting'
}

export function mapApiFinalResultToSecondInterviewStatus(
  status?: string,
  reserveRank?: number
): GeneralSecondInterviewScreeningStatus | undefined {
  const normalized = status?.trim().toUpperCase() ?? ''
  if (!normalized) return undefined
  if (['PASS', 'PASSED', 'APPROVED'].includes(normalized)) return 'pass'
  if (['FAIL', 'FAILED', 'REJECTED'].includes(normalized)) return 'fail'
  if (normalized === 'RESERVE' || normalized.startsWith('RESERVE')) {
    const rank = reserveRank ?? (Number(normalized.replace(/\D/g, '')) || 1)
    const clamped = Math.min(4, Math.max(1, rank)) as 1 | 2 | 3 | 4
    return `reserve${clamped}`
  }
  if (['WAITING', 'PENDING'].includes(normalized)) return 'waiting'
  if (['COMPLETED'].includes(normalized)) return 'completed'
  return 'waiting'
}

export function mapVolunteerApplicationToGeneralVolunteerApplicantRow(
  dto: VolunteerApplicationListItemResponse,
  index: number,
  programId: string
): GeneralVolunteerApplicantRow {
  return {
    id: toId(dto.id),
    no: index + 1,
    name: dto.memberName?.trim() || '이름 없음',
    contact: '-',
    email: '-',
    contactRaw: '',
    emailRaw: '',
    id1365: '',
    scheduleChangeCancelCount: 0,
    applicationType: dto.isReparticipation ? 'ujat-graduate' : 'new',
    hasJaVolunteerExperience: Boolean(dto.isReparticipation),
    essayIntro: '',
    essayEducationExperience: '',
    essayNecessity: '',
    essayJaExperience: '',
    managerAEvaluation: 'unreviewed',
    managerBEvaluation: 'unreviewed',
    documentScreeningStatus: mapApiDocumentStatusToScreeningStatus(dto.documentStatus),
    interviewSlotCount: 0,
    interviewAssignmentStatus: mapApiInterviewStatusToAssignmentStatus(
      dto.interviewStatus,
      dto.giveUpYn
    ),
    programId: toId(dto.programId) || programId,
    englishName: '',
    gender: '',
    birthDate: '',
    age: 0,
    universityName: '',
    major: '',
    applicationRoute: '',
    interviewAvailability: [],
    secondInterviewScreeningStatus: mapApiFinalResultToSecondInterviewStatus(
      dto.finalResultStatus,
      dto.reserveRank
    ),
  }
}

export function filterVolunteerDoc1Rows(
  rows: GeneralVolunteerApplicantRow[]
): GeneralVolunteerApplicantRow[] {
  return rows.filter(row => row.documentScreeningStatus === 'pending')
}

export function filterVolunteerDocPassedRows(
  rows: GeneralVolunteerApplicantRow[]
): GeneralVolunteerApplicantRow[] {
  return rows.filter(row => row.documentScreeningStatus === 'pass')
}

export function filterVolunteerInterview2Rows(
  rows: GeneralVolunteerApplicantRow[]
): GeneralVolunteerApplicantRow[] {
  return rows.filter(
    row =>
      row.documentScreeningStatus === 'pass' &&
      (row.interviewAssignmentStatus === 'assigned' ||
        row.interviewAssignmentStatus === 'withdrawn')
  )
}

export function mapParticipantToParticipatingSchoolRow(
  dto: ParticipantListItemResponse,
  index: number,
  programId: string
): ParticipatingSchoolRow {
  return {
    id: toId(dto.participantId),
    no: index + 1,
    schoolName: dto.memberName?.trim() || '기관명 없음',
    region: '',
    educationGrade: '',
    classCount: 0,
    studentCount: 0,
    lectureRound: '',
    textbookStatus: 'not_applicable',
    approvalStatus: 'approved',
    teacherName: '-',
    instructors: '',
    programId,
  }
}

export function mapParticipantToParticipatingInstructorRow(
  dto: ParticipantListItemResponse,
  index: number,
  _programId: string
): ParticipatingInstructorRow {
  return {
    id: toId(dto.participantId),
    no: index + 1,
    instructorName: dto.memberName?.trim() || '이름 없음',
    schoolName: '',
    educationGrade: '',
    classCount: 0,
    studentCount: 0,
    lectureRound: '',
    settlementStatus: 'none',
    teacherName: '-',
    contact: '',
    email: '',
  }
}

export function mapParticipantToParticipatingVolunteerRow(
  dto: ParticipantListItemResponse,
  index: number,
  _programId: string
): ParticipatingVolunteerRow {
  return {
    id: toId(dto.participantId),
    no: index + 1,
    volunteerName: dto.memberName?.trim() || '이름 없음',
    id1365: '',
    assignedInstitutionNames: [],
    sessions: [],
    contact: '-',
    email: '-',
    activityWithdrawn: dto.giveUpAt != null,
  }
}
