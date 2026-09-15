import {
  filterVolunteerDoc1Rows,
  filterVolunteerDocPassedRows,
  filterVolunteerInterview2Rows,
  filterIndividualDoc1Rows,
  filterIndividualDocPassedRows,
  filterIndividualInterview2Rows,
  mapIndividualApplicationToApplicantRow,
  mapInstructorApplicationToApplicantInstructorRow,
  mapOrganizationApplicationToApplicantSchoolRow,
  mapVolunteerApplicationToGeneralVolunteerApplicantRow,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import { mapParticipantsToVolunteerScreeningRows } from '@/features/program/general/lib/participant-volunteer-row-adapter'
import { shouldUseApplicationsHttpRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import {
  approveIndividualApplicationRemote,
  approveInstructorApplicationRemote,
  approveOrganizationApplicationRemote,
  assignVolunteerInterviewSlotRemote,
  createInterviewAssignmentRemote,
  createInterviewSlotRemote,
  fetchIndividualApplicationsRemote,
  fetchInstructorApplicationsRemote,
  fetchOrganizationApplicationsRemote,
  fetchOrganizationApplicationRequestedSchedulesRemote,
  fetchVolunteerApplicationsRemote,
  listInterviewSlotsRemote,
  rejectIndividualApplicationRemote,
  rejectInstructorApplicationRemote,
  rejectOrganizationApplicationRemote,
  submitIndividualDocumentResultRemote,
  submitIndividualFinalResultRemote,
  submitVolunteerDocumentResultRemote,
  submitVolunteerFinalResultRemote,
  type ApplicationsListQuery,
} from '@/features/program/general/api/applications-api-client'
import {
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
  assertApplicationsRemoteReady()
  const page = await fetchOrganizationApplicationsRemote(programId, {
    page: 0,
    size: 50,
    ...params,
  })
  const items = page.items ?? []
  const scheduleResults = await Promise.all(
    items.map(async item => {
      const applicationId = item.id == null ? '' : String(item.id)
      if (!applicationId) return [] as Awaited<
        ReturnType<typeof fetchOrganizationApplicationRequestedSchedulesRemote>
      >
      try {
        return await fetchOrganizationApplicationRequestedSchedulesRemote(applicationId)
      } catch {
        return []
      }
    })
  )
  return items.map((item, index) =>
    mapOrganizationApplicationToApplicantSchoolRow(item, index, programId, {
      requestedSchedules: scheduleResults[index],
    })
  )
}

export async function fetchGeneralInstructorApplications(
  programId: string,
  params?: ApplicationsListQuery
): Promise<ApplicantInstructorRow[]> {
  assertApplicationsRemoteReady()
  const page = await fetchInstructorApplicationsRemote(programId, {
    page: 0,
    size: 50,
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
  assertApplicationsRemoteReady()
  const page = await fetchIndividualApplicationsRemote(programId, {
    page: 0,
    size: 50,
    ...options?.query,
  })
  const rows = (page.items ?? []).map((item, index) =>
    mapIndividualApplicationToApplicantRow(item, index, programId)
  )
  if (options?.doc1) return filterIndividualDoc1Rows(rows)
  return rows
}

export async function fetchGeneralIndividualDocPassedAsVolunteerRows(
  programId: string
): Promise<GeneralVolunteerApplicantRow[]> {
  assertApplicationsRemoteReady()
  const rows = await fetchGeneralIndividualApplications(programId)
  return sortGeneralVolunteerDocPassedApplicants(
    mapParticipantsToVolunteerScreeningRows(filterIndividualDocPassedRows(rows))
  )
}

export async function fetchGeneralIndividualInterview2AsVolunteerRows(
  programId: string
): Promise<GeneralVolunteerApplicantRow[]> {
  assertApplicationsRemoteReady()
  const rows = await fetchGeneralIndividualApplications(programId)
  return sortGeneralVolunteerInterview2Applicants(
    mapParticipantsToVolunteerScreeningRows(filterIndividualInterview2Rows(rows))
  )
}

export async function fetchGeneralVolunteerApplications(
  programId: string,
  params?: ApplicationsListQuery
): Promise<GeneralVolunteerApplicantRow[]> {
  assertApplicationsRemoteReady()
  const page = await fetchVolunteerApplicationsRemote(programId, {
    page: 0,
    size: 50,
    ...params,
  })
  return (page.items ?? []).map((item, index) =>
    mapVolunteerApplicationToGeneralVolunteerApplicantRow(item, index, programId)
  )
}

export async function fetchGeneralVolunteerDoc1Applications(
  programId: string
): Promise<GeneralVolunteerApplicantRow[]> {
  assertApplicationsRemoteReady()
  const rows = await fetchGeneralVolunteerApplications(programId)
  return sortGeneralVolunteerByInterviewSlotCount(filterVolunteerDoc1Rows(rows))
}

export async function fetchGeneralVolunteerDocPassedApplications(
  programId: string
): Promise<GeneralVolunteerApplicantRow[]> {
  assertApplicationsRemoteReady()
  const rows = await fetchGeneralVolunteerApplications(programId)
  return sortGeneralVolunteerDocPassedApplicants(filterVolunteerDocPassedRows(rows))
}

export async function fetchGeneralVolunteerInterview2Applications(
  programId: string
): Promise<GeneralVolunteerApplicantRow[]> {
  assertApplicationsRemoteReady()
  const rows = await fetchGeneralVolunteerApplications(programId)
  return sortGeneralVolunteerInterview2Applicants(filterVolunteerInterview2Rows(rows))
}

export async function approveGeneralOrganizationApplication(applicationId: string): Promise<void> {
  assertApplicationsRemoteReady()
  await approveOrganizationApplicationRemote(applicationId)
}

export async function rejectGeneralOrganizationApplication(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<void> {
  assertApplicationsRemoteReady()
  await rejectOrganizationApplicationRemote(applicationId, payload)
}

export async function approveGeneralInstructorApplication(applicationId: string): Promise<void> {
  assertApplicationsRemoteReady()
  await approveInstructorApplicationRemote(applicationId)
}

export async function rejectGeneralInstructorApplication(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<void> {
  assertApplicationsRemoteReady()
  await rejectInstructorApplicationRemote(applicationId, payload)
}

export async function approveGeneralIndividualApplication(applicationId: string): Promise<void> {
  assertApplicationsRemoteReady()
  await approveIndividualApplicationRemote(applicationId)
}

export async function rejectGeneralIndividualApplication(
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<void> {
  assertApplicationsRemoteReady()
  await rejectIndividualApplicationRemote(applicationId, payload)
}

export async function submitGeneralVolunteerDocumentResult(
  applicationId: string,
  payload: DocumentResultRequest
): Promise<void> {
  assertApplicationsRemoteReady()
  await submitVolunteerDocumentResultRemote(applicationId, payload)
}

export async function submitGeneralIndividualDocumentResult(
  applicationId: string,
  payload: DocumentResultRequest
): Promise<void> {
  assertApplicationsRemoteReady()
  await submitIndividualDocumentResultRemote(applicationId, payload)
}

export async function submitGeneralVolunteerFinalResult(
  applicationId: string,
  payload: VolunteerFinalResultRequest
): Promise<void> {
  assertApplicationsRemoteReady()
  await submitVolunteerFinalResultRemote(applicationId, payload)
}

export async function submitGeneralIndividualFinalResult(
  applicationId: string,
  payload: VolunteerFinalResultRequest
): Promise<void> {
  assertApplicationsRemoteReady()
  await submitIndividualFinalResultRemote(applicationId, payload)
}

/**
 * 면접 슬롯 생성 후 봉사자 신청에 배정. mock/no-op 없음.
 */
export async function assignGeneralVolunteerInterview(params: {
  programId: string
  applicationId: string
  slotDate: string
  startAt: string
  endAt: string
  maxAssignCount?: number
}): Promise<{ interviewSlotId?: number; interviewAssignmentId?: number }> {
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

/**
 * 면접 슬롯 생성 후 개인 신청에 배정.
 * Canonical: POST /api/admin/interview-assignments + individualApplicationId
 */
export async function assignGeneralIndividualInterview(params: {
  programId: string
  applicationId: string
  slotDate: string
  startAt: string
  endAt: string
  maxAssignCount?: number
}): Promise<{ interviewSlotId?: number; interviewAssignmentId?: number }> {
  assertApplicationsRemoteReady()

  const individualApplicationId = Number(params.applicationId)
  if (!Number.isFinite(individualApplicationId)) {
    throw new Error('개인 신청 ID가 올바르지 않습니다.')
  }

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

  const assignment = await createInterviewAssignmentRemote({
    individualApplicationId,
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
 * GET interview-slots. mock 폴백 없음 — 실패 시 throw.
 */
export async function listGeneralInterviewSlots(
  programId: string,
  range?: { from?: string; to?: string }
): Promise<GeneralInterviewSlotListItem[]> {
  assertApplicationsRemoteReady()
  const rows = await listInterviewSlotsRemote(programId, range)
  return rows
    .filter(row => row.interviewSlotId != null && row.slotDate && row.startAt && row.endAt)
    .map(row => ({
      interviewSlotId: row.interviewSlotId as number,
      slotDate: row.slotDate as string,
      startAt: row.startAt as string,
      endAt: row.endAt as string,
      maxAssignCount: row.maxAssignCount ?? 1,
      assignedCount: row.currentAssignCount ?? 0,
      exceptionSlot: row.exceptionSlot ?? false,
    }))
}
