import {
  filterVolunteerDoc1Rows,
  filterVolunteerDocPassedRows,
  filterVolunteerInterview2Rows,
  mapIndividualApplicationToApplicantRow,
  mapInstructorApplicationToApplicantInstructorRow,
  mapOrganizationApplicationToApplicantSchoolRow,
  mapVolunteerApplicationToGeneralVolunteerApplicantRow,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import {
  approveIndividualApplicationRemote,
  approveInstructorApplicationRemote,
  approveOrganizationApplicationRemote,
  fetchIndividualApplicationsRemote,
  fetchInstructorApplicationsRemote,
  fetchOrganizationApplicationsRemote,
  fetchVolunteerApplicationsRemote,
  rejectIndividualApplicationRemote,
  rejectInstructorApplicationRemote,
  rejectOrganizationApplicationRemote,
  submitVolunteerDocumentResultRemote,
  submitVolunteerFinalResultRemote,
  type ApplicationsListQuery,
} from '@/features/program/general/api/applications-api-client'
import { getGeneralInstitutionApplicationsForProgram } from '@/features/program/general/lib/institution-applications-mock'
import { getApplicantInstructorsByProgramId } from '@/data/mock/applicant-instructors'
import {
  getGeneralIndividualApplicationsForProgram,
  getGeneralParticipantDoc1Applicants,
} from '@/data/mock/general-individual-applications-mock'
import {
  getGeneralVolunteerApplicants,
  getGeneralVolunteerDoc1Applicants,
  getGeneralVolunteerDocPassedApplicants,
  getGeneralVolunteerInterview2Applicants,
  sortGeneralVolunteerByInterviewSlotCount,
  sortGeneralVolunteerDocPassedApplicants,
  type GeneralVolunteerApplicantRow,
} from '@/data/mock/general-volunteer-applicants-mock'
import { sortGeneralVolunteerInterview2Applicants } from '@/features/program/general/lib/general-volunteer-interview2-display'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import type { ApplicationRejectRequest } from '@/shared/api/generated/dashboard/schemas/applicationRejectRequest'
import type { DocumentResultRequest } from '@/shared/api/generated/dashboard/schemas/documentResultRequest'
import type { VolunteerFinalResultRequest } from '@/shared/api/generated/dashboard/schemas/volunteerFinalResultRequest'
import type { GeneralSecondInterviewScreeningStatus } from '@/features/program/general/lib/volunteer-screening-constants'

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

export async function fetchGeneralVolunteerApplications(
  programId: string,
  params?: ApplicationsListQuery
): Promise<GeneralVolunteerApplicantRow[]> {
  if (!shouldUseGeneralApplicationsRemoteApi()) {
    return getGeneralVolunteerApplicants(programId)
  }

  assertApplicationsRemoteReady()
  const page = await fetchVolunteerApplicationsRemote(programId, {
    page: 0,
    size: 500,
    ...params,
  })
  return (page.items ?? []).map((item, index) =>
    mapVolunteerApplicationToGeneralVolunteerApplicantRow(item, index, programId)
  )
}

export async function fetchGeneralVolunteerDoc1Applications(
  programId: string
): Promise<GeneralVolunteerApplicantRow[]> {
  if (!shouldUseGeneralApplicationsRemoteApi()) {
    return getGeneralVolunteerDoc1Applicants(programId)
  }
  const rows = await fetchGeneralVolunteerApplications(programId)
  return sortGeneralVolunteerByInterviewSlotCount(filterVolunteerDoc1Rows(rows))
}

export async function fetchGeneralVolunteerDocPassedApplications(
  programId: string
): Promise<GeneralVolunteerApplicantRow[]> {
  if (!shouldUseGeneralApplicationsRemoteApi()) {
    return getGeneralVolunteerDocPassedApplicants(programId)
  }
  const rows = await fetchGeneralVolunteerApplications(programId)
  return sortGeneralVolunteerDocPassedApplicants(filterVolunteerDocPassedRows(rows))
}

export async function fetchGeneralVolunteerInterview2Applications(
  programId: string
): Promise<GeneralVolunteerApplicantRow[]> {
  if (!shouldUseGeneralApplicationsRemoteApi()) {
    return getGeneralVolunteerInterview2Applicants(programId)
  }
  const rows = await fetchGeneralVolunteerApplications(programId)
  return sortGeneralVolunteerInterview2Applicants(filterVolunteerInterview2Rows(rows))
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

export async function submitGeneralVolunteerDocumentResult(
  applicationId: string,
  payload: DocumentResultRequest
): Promise<void> {
  if (!shouldUseGeneralApplicationsRemoteApi()) return
  assertApplicationsRemoteReady()
  await submitVolunteerDocumentResultRemote(applicationId, payload)
}

export async function submitGeneralVolunteerFinalResult(
  applicationId: string,
  payload: VolunteerFinalResultRequest
): Promise<void> {
  if (!shouldUseGeneralApplicationsRemoteApi()) return
  assertApplicationsRemoteReady()
  await submitVolunteerFinalResultRemote(applicationId, payload)
}

export function mapSecondInterviewStatusToFinalResultPayload(
  status: Extract<
    GeneralSecondInterviewScreeningStatus,
    'pass' | 'fail' | 'reserve1' | 'reserve2' | 'reserve3' | 'reserve4'
  >,
  reason?: string
): VolunteerFinalResultRequest {
  if (status === 'pass') return { result: 'PASS', reason }
  if (status === 'fail') return { result: 'FAIL', reason }
  const rank = Number(status.replace('reserve', '')) as 1 | 2 | 3 | 4
  return { result: 'RESERVE', reserveRank: rank, reason }
}
