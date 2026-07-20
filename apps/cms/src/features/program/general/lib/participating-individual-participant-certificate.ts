import type { ParticipatingIndividualParticipantRow } from '@/data/mock/participating-individual-participants'
import type { SchoolDetailStudentRow } from '@/features/program/general/model/school-detail-types'
import {
  buildStudentCertificateDownloadContext,
  type StudentCertificateDownloadContext,
} from '@/features/program/general/lib/build-student-certificate-issuance'
import { resolveStudentCertificateKind } from '@/features/program/general/lib/resolve-student-certificate-kind'
import type { Program } from '@/types/domain'
import { resolveGeneralProgramDisplayTitle } from '@/features/program/general/lib/detail-common-info-display'

export function toParticipatingParticipantCertificateStudent(
  participant: ParticipatingIndividualParticipantRow
): SchoolDetailStudentRow {
  return {
    id: participant.id,
    no: participant.no,
    name: participant.applicantName,
    gender: participant.detail?.gender === '여성' ? 'female' : 'male',
    birthDate: participant.detail?.birthDate,
    gradeClass: participant.detail?.affiliationGrade ?? '',
    lectureAttendance: '',
  }
}

export function buildParticipatingParticipantCertificateContext(input: {
  participant: ParticipatingIndividualParticipantRow
  program: Program
  hasStudentSatisfactionSurvey?: boolean
  issuanceReasonLabel: string
}): StudentCertificateDownloadContext {
  const { participant, program, hasStudentSatisfactionSurvey = false, issuanceReasonLabel } = input
  const student = toParticipatingParticipantCertificateStudent(participant)
  const certificateKind = resolveStudentCertificateKind({
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
    issuanceReasonLabel,
  })
}
