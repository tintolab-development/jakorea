import {
  mapIndividualApplicationToApplicantRow,
  mapInstructorApplicationToApplicantInstructorRow,
  mapOrganizationApplicationToApplicantSchoolRow,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import {
  approveIndividualApplicationRemote,
  approveInstructorApplicationRemote,
  approveOrganizationApplicationRemote,
  fetchIndividualApplicationsRemote,
  fetchInstructorApplicationsRemote,
  fetchOrganizationApplicationsRemote,
  rejectIndividualApplicationRemote,
  rejectInstructorApplicationRemote,
  rejectOrganizationApplicationRemote,
  type ApplicationsListQuery,
} from '@/features/program/general/api/applications-api-client'
import { getGeneralInstitutionApplicationsForProgram } from '@/features/program/general/lib/institution-applications-mock'
import {
  getApplicantInstructorsByProgramId,
} from '@/data/mock/applicant-instructors'
import {
  getGeneralIndividualApplicationsForProgram,
  getGeneralParticipantDoc1Applicants,
} from '@/data/mock/general-individual-applications-mock'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import type { ApplicationRejectRequest } from '@/shared/api/generated/dashboard/schemas/applicationRejectRequest'

function assertApplicationsRemoteReady(): void {
  if (!shouldUseGeneralApplicationsRemoteApi()) {
    throw new Error(
      '일반 프로그램 신청 API가 활성화되지 않았습니다. programs·applications 모듈과 API 로그인을 확인해 주세요.'
    )
  }
}

export async function fetchGeneralOrganizationApplications(
  programId: string,
  params?: ApplicationsListQuery
): Promise<ApplicantSchoolRow[]> {
  if (!shouldUseGeneralApplicationsRemoteApi()) {
    return getGeneralInstitutionApplicationsForProgram(programId)
  }

  assertApplicationsRemoteReady()
  const page = await fetchOrganizationApplicationsRemote(programId, {
    page: 0,
    size: 500,
    ...params,
  })
  return (page.items ?? []).map((item, index) =>
    mapOrganizationApplicationToApplicantSchoolRow(item, index, programId)
  )
}

export async function fetchGeneralInstructorApplications(
  programId: string,
  params?: ApplicationsListQuery
): Promise<ApplicantInstructorRow[]> {
  if (!shouldUseGeneralApplicationsRemoteApi()) {
    return getApplicantInstructorsByProgramId(programId)
  }

  assertApplicationsRemoteReady()
  const page = await fetchInstructorApplicationsRemote(programId, {
    page: 0,
    size: 500,
    ...params,
  })
  return (page.items ?? []).map((item, index) =>
    mapInstructorApplicationToApplicantInstructorRow(item, index, programId)
  )
}

export async function fetchGeneralIndividualApplications(
  programId: string,
  options?: { doc1?: boolean; query?: ApplicationsListQuery }
): Promise<GeneralIndividualApplicantRow[]> {
  if (!shouldUseGeneralApplicationsRemoteApi()) {
    if (options?.doc1) return getGeneralParticipantDoc1Applicants(programId)
    return getGeneralIndividualApplicationsForProgram(programId)
  }

  assertApplicationsRemoteReady()
  const page = await fetchIndividualApplicationsRemote(programId, {
    page: 0,
    size: 500,
    ...options?.query,
  })
  return (page.items ?? []).map((item, index) =>
    mapIndividualApplicationToApplicantRow(item, index, programId)
  )
}

export async function approveGeneralOrganizationApplication(applicationId: string): Promise<void> {
  if (!shouldUseGeneralApplicationsRemoteApi()) return
  assertApplicationsRemoteReady()
  await approveOrganizationApplicationRemote(applicationId)
}

export async function rejectGeneralOrganizationApplication(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<void> {
  if (!shouldUseGeneralApplicationsRemoteApi()) return
  assertApplicationsRemoteReady()
  await rejectOrganizationApplicationRemote(applicationId, payload)
}

export async function approveGeneralInstructorApplication(applicationId: string): Promise<void> {
  if (!shouldUseGeneralApplicationsRemoteApi()) return
  assertApplicationsRemoteReady()
  await approveInstructorApplicationRemote(applicationId)
}

export async function rejectGeneralInstructorApplication(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<void> {
  if (!shouldUseGeneralApplicationsRemoteApi()) return
  assertApplicationsRemoteReady()
  await rejectInstructorApplicationRemote(applicationId, payload)
}

export async function approveGeneralIndividualApplication(applicationId: string): Promise<void> {
  if (!shouldUseGeneralApplicationsRemoteApi()) return
  assertApplicationsRemoteReady()
  await approveIndividualApplicationRemote(applicationId)
}

export async function rejectGeneralIndividualApplication(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<void> {
  if (!shouldUseGeneralApplicationsRemoteApi()) return
  assertApplicationsRemoteReady()
  await rejectIndividualApplicationRemote(applicationId, payload)
}
