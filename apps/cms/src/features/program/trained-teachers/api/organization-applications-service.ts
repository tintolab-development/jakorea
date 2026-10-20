import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { OrganizationApplicationApprovePayload } from '@/features/program/general/api/applications-api-client'
import type { ApplicationRejectRequest } from '@/shared/api/generated/dashboard/schemas/applicationRejectRequest'
import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import { mapTrainedTeacherOrganizationApplicationToRow } from './organization-applications-adapters'
import {
  approveTrainedTeacherOrganizationApplicationRemote,
  fetchTrainedTeacherOrganizationApplicationRemote,
  fetchTrainedTeacherOrganizationApplicationsRemote,
  giveUpTrainedTeacherOrganizationApplicationRemote,
  rejectTrainedTeacherOrganizationApplicationRemote,
  removeTrainedTeacherOrganizationApplicationFromProgressRemote,
  resendTrainedTeacherOrganizationApplicationNotificationRemote,
  type TrainedTeacherOrganizationActivityGiveUpPayload,
  type TrainedTeacherOrganizationNotificationResendPayload,
  type TrainedTeacherOrganizationProgressRemovalPayload,
} from './organization-applications-client'

function assertRemoteReady(): void {
  if (shouldUseTrainedTeacherProgramsRemoteApi()) return
  throw new Error(
    '교육받은 교사 기관 신청 API가 활성화되지 않았습니다. VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED(또는 trainedTeacherPrograms)와 programs 모듈을 확인해 주세요. mock 폴백은 사용하지 않습니다.'
  )
}

export async function listTrainedTeacherOrganizationApplications(
  programId: string,
  query: import('./organization-applications-list-query').TrainedTeacherOrganizationApplicationsListQuery = {}
): Promise<ApplicantSchoolRow[]> {
  assertRemoteReady()
  const items = await fetchTrainedTeacherOrganizationApplicationsRemote(programId, query)
  return items.map((item, index) =>
    mapTrainedTeacherOrganizationApplicationToRow(item, index, programId)
  )
}

export async function getTrainedTeacherOrganizationApplication(
  programId: string,
  applicationId: string
): Promise<ApplicantSchoolRow> {
  assertRemoteReady()
  const dto = await fetchTrainedTeacherOrganizationApplicationRemote(programId, applicationId)
  return mapTrainedTeacherOrganizationApplicationToRow(dto, 0, programId)
}

/** TT 전용 approve — Primary 스코프 가드 포함 */
export async function approveTrainedTeacherOrganizationApplication(
  programId: string,
  applicationId: string,
  payload?: OrganizationApplicationApprovePayload
): Promise<void> {
  assertRemoteReady()
  await approveTrainedTeacherOrganizationApplicationRemote(programId, applicationId, payload)
}

export async function rejectTrainedTeacherOrganizationApplication(
  programId: string,
  applicationId: string,
  payload: ApplicationRejectRequest
): Promise<void> {
  assertRemoteReady()
  await rejectTrainedTeacherOrganizationApplicationRemote(programId, applicationId, payload)
}

export async function resendTrainedTeacherOrganizationApplicationNotification(
  programId: string,
  applicationId: string,
  payload: TrainedTeacherOrganizationNotificationResendPayload,
  idempotencyKey: string
): Promise<void> {
  assertRemoteReady()
  await resendTrainedTeacherOrganizationApplicationNotificationRemote(
    programId,
    applicationId,
    payload,
    idempotencyKey
  )
}

export async function giveUpTrainedTeacherOrganizationApplication(
  programId: string,
  applicationId: string,
  payload: TrainedTeacherOrganizationActivityGiveUpPayload
) {
  assertRemoteReady()
  return giveUpTrainedTeacherOrganizationApplicationRemote(programId, applicationId, payload)
}

export async function removeTrainedTeacherOrganizationApplicationFromProgress(
  programId: string,
  applicationId: string,
  payload: TrainedTeacherOrganizationProgressRemovalPayload
) {
  assertRemoteReady()
  return removeTrainedTeacherOrganizationApplicationFromProgressRemote(
    programId,
    applicationId,
    payload
  )
}
