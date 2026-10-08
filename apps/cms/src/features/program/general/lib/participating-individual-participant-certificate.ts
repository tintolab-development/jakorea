import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { SchoolDetailStudentRow } from '@/features/program/general/model/school-detail-types'
import {
  buildStudentCertificateDownloadContext,
  type StudentCertificateDownloadContext,
} from '@/features/program/general/lib/build-student-certificate-issuance'
import { resolveStudentCertificateKind } from '@/features/program/general/lib/resolve-student-certificate-kind'
import type { Program } from '@/types/domain'
import { resolveGeneralProgramDisplayTitle } from '@/features/program/general/lib/detail-common-info-display'
import { mapApiBirthDateToDisplay } from '@/features/program/general/api/adapters/student-roster-adapters'
import { toGenderLabelOrRaw } from '@/features/user/api/map-member-gender-birth'
import { fetchIndividualApplicationDetailRemote } from '@/features/program/general/api/applications-api-client'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { queryClient } from '@/shared/lib/query-client'

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
 * 목록 응답 `birthDate`가 없을 때(백엔드 미배포 환경)만 개인 신청 상세(`profile`)에서 보강한다.
 * 상세 조회 실패 시 원본 행을 그대로 쓴다.
 */
export async function hydrateParticipatingParticipantCertificateProfile(
  participant: ParticipatingIndividualParticipantRow
): Promise<ParticipatingIndividualParticipantRow> {
  if (participant.detail?.birthDate?.trim()) return participant
  const applicationId = participant.individualApplicationId?.trim()
  if (!applicationId) return participant

  try {
    const dto = await queryClient.fetchQuery({
      queryKey: generalApplicationsQueryKeys.individualDetail(applicationId),
      queryFn: () => fetchIndividualApplicationDetailRemote(applicationId),
      staleTime: 30_000,
      retry: false,
    })
    const birthDate = dto.profile?.birthDate?.trim()
    const gender = toGenderLabelOrRaw(dto.profile?.gender)
    if (!birthDate && !gender) return participant
    return {
      ...participant,
      detail: {
        ...participant.detail,
        birthDate: birthDate || participant.detail?.birthDate,
        gender: participant.detail?.gender || gender,
      },
    }
  } catch {
    return participant
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
    programId: program.id,
  })
}
