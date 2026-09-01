import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import { getTrainedTeachersInstitutionApplicationsForProgram } from '@/features/program/general/lib/institution-applications-mock'
import {
  approveOrganizationApplicationRemote,
  rejectOrganizationApplicationRemote,
} from '@/features/program/general/api/applications-api-client'
import type { ApplicationRejectRequest } from '@/shared/api/generated/dashboard/schemas/applicationRejectRequest'
import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import { mapTrainedTeacherOrganizationApplicationToRow } from './organization-applications-adapters'
import {
  fetchTrainedTeacherOrganizationApplicationRemote,
  fetchTrainedTeacherOrganizationApplicationsRemote,
} from './organization-applications-client'

function assertRemoteReady(): void {
  if (shouldUseTrainedTeacherProgramsRemoteApi()) return
  throw new Error(
    '교육받은 교사 기관 신청 API가 활성화되지 않았습니다. VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED(또는 trainedTeacherPrograms)와 programs 모듈을 확인해 주세요.'
  )
}

export async function listTrainedTeacherOrganizationApplications(
  programId: string
): Promise<ApplicantSchoolRow[]> {
  if (!shouldUseTrainedTeacherProgramsRemoteApi()) {
    return getTrainedTeachersInstitutionApplicationsForProgram(programId)
  }
  assertRemoteReady()
  const items = await fetchTrainedTeacherOrganizationApplicationsRemote(programId)
  return items.map((item, index) =>
    mapTrainedTeacherOrganizationApplicationToRow(item, index, programId)
  )
}

export async function getTrainedTeacherOrganizationApplication(
  programId: string,
  applicationId: string
): Promise<ApplicantSchoolRow> {
  if (!shouldUseTrainedTeacherProgramsRemoteApi()) {
    const local = getTrainedTeachersInstitutionApplicationsForProgram(programId).find(
      row => row.id === applicationId
    )
    if (!local) throw new Error('기관 신청을 찾을 수 없습니다.')
    return local
  }
  assertRemoteReady()
  const dto = await fetchTrainedTeacherOrganizationApplicationRemote(programId, applicationId)
  return mapTrainedTeacherOrganizationApplicationToRow(dto, 0, programId)
}

/**
 * OpenAPI에 TT 전용 approve/reject가 없어 공통 organization-applications 결정을 재사용.
 * BE가 동일 applicationId를 허용해야 한다.
 */
export async function approveTrainedTeacherOrganizationApplication(
  applicationId: string
): Promise<void> {
  assertRemoteReady()
  await approveOrganizationApplicationRemote(applicationId)
}

export async function rejectTrainedTeacherOrganizationApplication(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<void> {
  assertRemoteReady()
  await rejectOrganizationApplicationRemote(applicationId, payload)
}
