import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type {
  ApplicationDecisionCancelRequestWithNotification,
  OrganizationApplicationApprovePayload,
} from '@/features/program/general/api/applications-api-client'
import type { ApplicationDecisionResponse } from '@/shared/api/generated/dashboard/schemas/applicationDecisionResponse'
import type { ApplicationRejectRequest } from '@/shared/api/generated/dashboard/schemas/applicationRejectRequest'
import type { TextbookDeliveryUpdateRequestTextbookDeliveryStatus } from '@/shared/api/generated/dashboard/schemas/textbookDeliveryUpdateRequestTextbookDeliveryStatus'
import {
  fetchProgramParticipantsRemote,
  patchParticipantTextbookDeliveryRemote,
} from '@/features/program/general/api/program-progress-api-client'
import { getApiErrorCode, getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import { mapTrainedTeacherOrganizationApplicationToRow } from './organization-applications-adapters'
import type { TrainedTeacherOrganizationDecisionResponse } from './trained-teacher-organization-approve-payload'
import {
  approveTrainedTeacherOrganizationApplicationRemote,
  cancelTrainedTeacherOrganizationApplicationApprovalRemote,
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
): Promise<TrainedTeacherOrganizationDecisionResponse | undefined> {
  assertRemoteReady()
  return approveTrainedTeacherOrganizationApplicationRemote(programId, applicationId, payload)
}

export async function cancelTrainedTeacherOrganizationApplicationApproval(
  programId: string,
  applicationId: string,
  payload: ApplicationDecisionCancelRequestWithNotification
): Promise<ApplicationDecisionResponse> {
  assertRemoteReady()
  return cancelTrainedTeacherOrganizationApplicationApprovalRemote(
    programId,
    applicationId,
    payload
  )
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

function matchesOrganizationApplication(
  item: {
    organizationApplicationId?: number
    sourceApplicationId?: number
  },
  applicationNumeric: number
): boolean {
  return (
    item.organizationApplicationId === applicationNumeric ||
    item.sourceApplicationId === applicationNumeric
  )
}

async function resolveOrganizationParticipantId(
  programId: string,
  applicationId: string
): Promise<string | undefined> {
  const applicationNumeric = Number(applicationId)
  if (!Number.isFinite(applicationNumeric)) return undefined
  let pageIndex = 0
  for (;;) {
    const page = await fetchProgramParticipantsRemote(programId, {
      participantType: 'ORGANIZATION',
      size: 200,
      page: pageIndex,
    })
    const match = (page.items ?? []).find(item =>
      matchesOrganizationApplication(item, applicationNumeric)
    )
    if (match?.participantId != null) return String(match.participantId)
    const loaded = page.items?.length ?? 0
    const totalPages = page.totalPages ?? (loaded < 200 ? pageIndex + 1 : pageIndex + 2)
    if (loaded === 0 || pageIndex + 1 >= totalPages) return undefined
    pageIndex += 1
  }
}

const MISSING_ORGANIZATION_PARTICIPANT_MESSAGE =
  '기관 참여자를 찾지 못했습니다. 새로고침 후 다시 시도해 주세요.'

/**
 * TT 진행 현황 교재 배송 변경.
 * PATCH /api/admin/programs/{programId}/participants/{participantId}/textbook-delivery
 * 표시 SSOT는 TT org-application GET 루트 textbookDeliveryStatus.
 */
export async function updateTrainedTeacherOrganizationApplicationTextbookDelivery(
  programId: string,
  applicationId: string,
  textbookDeliveryStatus: TextbookDeliveryUpdateRequestTextbookDeliveryStatus,
  cachedParticipantId?: string
) {
  assertRemoteReady()
  const payload = { textbookDeliveryStatus }
  const resolveId = () => resolveOrganizationParticipantId(programId, applicationId)
  const participantId = cachedParticipantId?.trim() || (await resolveId())
  if (!participantId) {
    throw new Error(MISSING_ORGANIZATION_PARTICIPANT_MESSAGE)
  }
  try {
    return await patchParticipantTextbookDeliveryRemote(programId, participantId, payload)
  } catch (error) {
    const shouldRefetchParticipant =
      Boolean(cachedParticipantId?.trim()) &&
      getApiErrorHttpStatus(error) === 404 &&
      getApiErrorCode(error) === 'PARTICIPANT_NOT_FOUND'
    if (!shouldRefetchParticipant) throw error
    const freshId = await resolveId()
    if (!freshId || freshId === participantId) throw error
    return patchParticipantTextbookDeliveryRemote(programId, freshId, payload)
  }
}
