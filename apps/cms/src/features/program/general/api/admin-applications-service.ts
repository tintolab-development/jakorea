import {
  filterVolunteerDoc1Rows,
  filterVolunteerDocPassedRows,
  filterVolunteerInterview2Rows,
  mapIndividualApplicationToApplicantRow,
  mapInstructorApplicationToApplicantInstructorRow,
  mapOrganizationApplicationToApplicantSchoolRow,
  mapVolunteerApplicationToGeneralVolunteerApplicantRow,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import { shouldUseApplicationsHttpRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import {
  approveIndividualApplicationRemote,
  approveInstructorApplicationRemote,
  approveOrganizationApplicationRemote,
  assignVolunteerInterviewSlotRemote,
  createInterviewSlotRemote,
  fetchIndividualApplicationsRemote,
  fetchInstructorApplicationsRemote,
  fetchOrganizationApplicationsRemote,
  fetchVolunteerApplicationsRemote,
  listInterviewSlotsRemote,
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
  if (!shouldUseApplicationsHttpRemoteApi()) {
    throw new Error(
      '프로그램 신청 API가 활성화되지 않았습니다. programs(또는 1사1교 opt-in)·applications 모듈과 API 로그인을 확인해 주세요.'
    )
  }
}

export async function fetchGeneralOrganizationApplications(
  programId: string,
  params?: ApplicationsListQuery
): Promise<ApplicantSchoolRow[]> {
  if (!shouldUseApplicationsHttpRemoteApi()) {
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
  if (!shouldUseApplicationsHttpRemoteApi()) {
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
  if (!shouldUseApplicationsHttpRemoteApi()) {
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
  if (!shouldUseApplicationsHttpRemoteApi()) {
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
  if (!shouldUseApplicationsHttpRemoteApi()) {
    return getGeneralVolunteerDoc1Applicants(programId)
  }
  const rows = await fetchGeneralVolunteerApplications(programId)
  return sortGeneralVolunteerByInterviewSlotCount(filterVolunteerDoc1Rows(rows))
}

export async function fetchGeneralVolunteerDocPassedApplications(
  programId: string
): Promise<GeneralVolunteerApplicantRow[]> {
  if (!shouldUseApplicationsHttpRemoteApi()) {
    return getGeneralVolunteerDocPassedApplicants(programId)
  }
  const rows = await fetchGeneralVolunteerApplications(programId)
  return sortGeneralVolunteerDocPassedApplicants(filterVolunteerDocPassedRows(rows))
}

export async function fetchGeneralVolunteerInterview2Applications(
  programId: string
): Promise<GeneralVolunteerApplicantRow[]> {
  if (!shouldUseApplicationsHttpRemoteApi()) {
    return getGeneralVolunteerInterview2Applicants(programId)
  }
  const rows = await fetchGeneralVolunteerApplications(programId)
  return sortGeneralVolunteerInterview2Applicants(filterVolunteerInterview2Rows(rows))
}

export async function approveGeneralOrganizationApplication(applicationId: string): Promise<void> {
  if (!shouldUseApplicationsHttpRemoteApi()) return
  assertApplicationsRemoteReady()
  await approveOrganizationApplicationRemote(applicationId)
}

export async function rejectGeneralOrganizationApplication(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<void> {
  if (!shouldUseApplicationsHttpRemoteApi()) return
  assertApplicationsRemoteReady()
  await rejectOrganizationApplicationRemote(applicationId, payload)
}

export async function approveGeneralInstructorApplication(applicationId: string): Promise<void> {
  if (!shouldUseApplicationsHttpRemoteApi()) return
  assertApplicationsRemoteReady()
  await approveInstructorApplicationRemote(applicationId)
}

export async function rejectGeneralInstructorApplication(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<void> {
  if (!shouldUseApplicationsHttpRemoteApi()) return
  assertApplicationsRemoteReady()
  await rejectInstructorApplicationRemote(applicationId, payload)
}

export async function approveGeneralIndividualApplication(applicationId: string): Promise<void> {
  if (!shouldUseApplicationsHttpRemoteApi()) return
  assertApplicationsRemoteReady()
  await approveIndividualApplicationRemote(applicationId)
}

export async function rejectGeneralIndividualApplication(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<void> {
  if (!shouldUseApplicationsHttpRemoteApi()) return
  assertApplicationsRemoteReady()
  await rejectIndividualApplicationRemote(applicationId, payload)
}

export async function submitGeneralVolunteerDocumentResult(
  applicationId: string,
  payload: DocumentResultRequest
): Promise<void> {
  if (!shouldUseApplicationsHttpRemoteApi()) return
  assertApplicationsRemoteReady()
  await submitVolunteerDocumentResultRemote(applicationId, payload)
}

export async function submitGeneralVolunteerFinalResult(
  applicationId: string,
  payload: VolunteerFinalResultRequest
): Promise<void> {
  if (!shouldUseApplicationsHttpRemoteApi()) return
  assertApplicationsRemoteReady()
  await submitVolunteerFinalResultRemote(applicationId, payload)
}

/**
 * remote ON: 면접 슬롯 생성 후 봉사자 신청에 배정.
 * 슬롯 목록은 `listGeneralInterviewSlots` (GET hand-wrap, OpenAPI P2-1 미등재 시 mock 폴백).
 * remote OFF: no-op (호출부에서 로컬 row patch만).
 */
export async function assignGeneralVolunteerInterview(params: {
  programId: string
  applicationId: string
  slotDate: string
  startAt: string
  endAt: string
  maxAssignCount?: number
}): Promise<{ interviewSlotId?: number; interviewAssignmentId?: number }> {
  if (!shouldUseApplicationsHttpRemoteApi()) {
    return {}
  }
  assertApplicationsRemoteReady()

  const slot = await createInterviewSlotRemote(params.programId, {
    slotDate: params.slotDate,
    startAt: params.startAt,
    endAt: params.endAt,
    maxAssignCount: params.maxAssignCount ?? 1,
    exceptionSlot: false,
  })

  const interviewSlotId = slot.interviewSlotId
  if (interviewSlotId == null) {
    throw new Error('면접 슬롯 생성 응답에 interviewSlotId가 없습니다.')
  }

  const assignment = await assignVolunteerInterviewSlotRemote(params.applicationId, {
    interviewSlotId,
  })

  return {
    interviewSlotId,
    interviewAssignmentId: assignment.interviewAssignmentId,
  }
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

export type GeneralInterviewSlotListItem = {
  interviewSlotId: number
  slotDate: string
  startAt: string
  endAt: string
  maxAssignCount: number
  assignedCount: number
  exceptionSlot: boolean
}

/**
 * remote ON: GET interview-slots (OpenAPI GET/POST 등재). 404/실패 시 null → 호출부 mock.
 * remote OFF: null (호출부 mock).
 */
export async function listGeneralInterviewSlots(
  programId: string,
  range?: { from?: string; to?: string }
): Promise<GeneralInterviewSlotListItem[] | null> {
  if (!shouldUseApplicationsHttpRemoteApi()) return null
  assertApplicationsRemoteReady()
  try {
    const rows = await listInterviewSlotsRemote(programId, range)
    return rows
      .filter((row) => row.interviewSlotId != null && row.slotDate && row.startAt && row.endAt)
      .map((row) => ({
        interviewSlotId: row.interviewSlotId as number,
        slotDate: row.slotDate as string,
        startAt: row.startAt as string,
        endAt: row.endAt as string,
        maxAssignCount: row.maxAssignCount ?? 1,
        assignedCount: row.currentAssignCount ?? 0,
        exceptionSlot: row.exceptionSlot ?? false,
      }))
  } catch {
    return null
  }
}
