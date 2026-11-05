import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { SchoolDetailStudentRow } from '@/features/program/general/model/school-detail-types'
import {
  buildStudentCertificateDownloadContext,
  type StudentCertificateDownloadContext,
} from '@/features/program/general/lib/build-student-certificate-issuance'
import { resolveStudentCertificateKind } from '@/features/program/general/lib/resolve-student-certificate-kind'
import type { StudentCertificateKind } from '@/features/program/general/lib/resolve-student-certificate-kind'
import type { Program } from '@/types/domain'
import { resolveGeneralProgramDisplayTitle } from '@/features/program/general/lib/detail-common-info-display'
import { mapApiBirthDateToDisplay } from '@/features/program/general/api/adapters/student-roster-adapters'
import { unmaskIndividualParticipantForCertificateIssue } from '@/features/program/shared/lib/unmask-for-certificate-issue'

export function toParticipatingParticipantCertificateStudent(
  participant: ParticipatingIndividualParticipantRow
): SchoolDetailStudentRow {
  return {
    id: participant.id,
    no: participant.no,
    name: participant.applicantName,
    gender: participant.detail?.gender === '여성' ? 'female' : 'male',
    birthDate: mapApiBirthDateToDisplay(participant.detail?.birthDate),
    gradeClass: participant.detail?.affiliationGrade ?? '',
    lectureAttendance: '',
  }
}

/**
 * 발급 직전 개인정보 원문 조회. 조회 이력 목적은 `증명서 발급`.
 */
export async function hydrateParticipatingParticipantCertificateProfile(
  participant: ParticipatingIndividualParticipantRow
): Promise<ParticipatingIndividualParticipantRow> {
  return unmaskIndividualParticipantForCertificateIssue(participant)
}

export function buildParticipatingParticipantCertificateContext(input: {
  participant: ParticipatingIndividualParticipantRow
  program: Program
  hasStudentSatisfactionSurvey?: boolean
  issuanceReasonLabel: string
  /** 서버 eligibility 유형. 없으면 출석 세션 힌트만 사용한다. */
  certificateKind?: StudentCertificateKind
  certifiedPeriodLabel?: string | null
  certifiedPeriodStart?: Date | string | null
  certifiedPeriodEnd?: Date | string | null
  requireCertifiedPeriod?: boolean
}): StudentCertificateDownloadContext {
  const { participant, program, hasStudentSatisfactionSurvey = false, issuanceReasonLabel } = input
  const student = toParticipatingParticipantCertificateStudent(participant)
  const certificateKind =
    input.certificateKind ??
    resolveStudentCertificateKind({
      sessions: participant.lectureAttendanceSessions,
      satisfactionSurveyRequired: hasStudentSatisfactionSurvey,
      satisfactionSurveyCompleted: participant.satisfactionSurveyCompleted,
    })

  return buildStudentCertificateDownloadContext({
    student,
    certificateKind,
    schoolName: participant.affiliation,
    educationGrade: participant.educationGrade,
    programTitle: resolveGeneralProgramDisplayTitle(program),
    programStartDate: program.startDate,
    programEndDate: program.endDate,
    certifiedPeriodLabel: input.certifiedPeriodLabel,
    certifiedPeriodStart: input.certifiedPeriodStart,
    certifiedPeriodEnd: input.certifiedPeriodEnd,
    requireCertifiedPeriod: input.requireCertifiedPeriod,
    issuanceReasonLabel,
    programId: program.id,
  })
}
