import type { QueryClient } from '@tanstack/react-query'
import { toIsoLocalTime } from '@/shared/lib/attendance-arrival-time'
import type { ProgramAttendanceCorrectionConfirmPayload } from '@/features/program/shared/lib/attendance-correction-types'
import { mapUjatUiAttendanceStatusToApi } from '@/features/program/ujat/api/allocation-matrix-adapters'
import {
  bulkUpsertUjatAttendances,
  postUjatDirectAssignment,
  postUjatPartnerAssignmentCancel,
  postUjatPartnerAssignmentConfirm,
  type UjatPartnerAssignmentConfirmRequest,
  type UjatSemesterType,
} from '@/features/program/ujat/api/education-execution-api'
import { queryKeys } from '@/features/program/ujat/api/query-keys'
import type { UjatAttendanceStatus } from '../../attendance/types'

export function volunteerAssignmentInvalidationQueryKeys(input: {
  programId: string
  educationRegionCode: string
  semesterType: UjatSemesterType
}) {
  return [
    queryKeys.volunteerAssignmentProgressRoot(input.programId),
    queryKeys.partnerAssignmentsRoot(input.programId),
    queryKeys.partnerRecommendationRoot(input.programId),
    queryKeys.absenceReasons(input.programId),
    queryKeys.allocationMatrixRoot(input.programId),
    queryKeys.assignmentSubmissionsRoot(input.programId),
    queryKeys.allocationMatrix(input.programId, input.educationRegionCode, input.semesterType),
    queryKeys.assignmentSubmissions(input.programId, input.educationRegionCode, input.semesterType),
    queryKeys.volunteer1365AttendanceAll(input.programId),
  ] as const
}

export async function invalidateVolunteerAssignmentQueries(
  queryClient: QueryClient,
  input: {
    programId: string
    educationRegionCode: string
    semesterType: UjatSemesterType
  }
) {
  await Promise.all(
    volunteerAssignmentInvalidationQueryKeys(input).map(queryKey =>
      queryClient.invalidateQueries({ queryKey })
    )
  )
}

export async function cancelVolunteerAssignment(input: {
  programId: string
  scheduleId: number
  assignmentGroupId: string
  reason?: string
}) {
  return postUjatPartnerAssignmentCancel(
    input.programId,
    input.scheduleId,
    input.assignmentGroupId,
    { reason: input.reason?.trim() || null }
  )
}

export function buildVolunteerPartnerConfirmRequest(input: {
  mode: 'education' | 'partner'
  participantId: number
  partnerParticipantId: number
  selfIsSecondary?: boolean
  educationSlotId?: number | null
  organizationApplicationId?: number | null
  classLabel?: string | null
}): UjatPartnerAssignmentConfirmRequest {
  const selfIsSecondary = input.mode === 'partner' && input.selfIsSecondary === true
  return {
    primaryParticipantId: selfIsSecondary ? input.partnerParticipantId : input.participantId,
    secondaryParticipantId: selfIsSecondary ? input.participantId : input.partnerParticipantId,
    educationSlotId: input.educationSlotId ?? null,
    organizationApplicationId: input.organizationApplicationId ?? null,
    classLabel: input.classLabel ?? null,
  }
}

export async function confirmVolunteerAssignment(input: {
  programId: string
  mode: 'education' | 'partner'
  scheduleId: number
  participantId: number
  partnerParticipantId: number
  selfIsSecondary?: boolean
  educationSlotId?: number | null
  organizationApplicationId?: number | null
  classLabel?: string | null
}) {
  if (!Number.isFinite(input.partnerParticipantId)) {
    throw new Error('MISSING_PARTNER')
  }

  if (input.mode === 'education') {
    if (input.educationSlotId == null || !Number.isFinite(input.educationSlotId)) {
      throw new Error('MISSING_EDUCATION_SLOT')
    }
    await postUjatDirectAssignment(input.programId, input.educationSlotId, {
      participantId: input.participantId,
    })
  }

  return postUjatPartnerAssignmentConfirm(
    input.programId,
    input.scheduleId,
    buildVolunteerPartnerConfirmRequest(input)
  )
}

function toApiAttendanceStatus(
  status: ProgramAttendanceCorrectionConfirmPayload['status']
): UjatAttendanceStatus {
  if (status === 'absence') return 'absent'
  return status
}

export async function correctVolunteerAttendance(input: {
  programId: string
  scheduleId: number
  participantId: number
  payload: ProgramAttendanceCorrectionConfirmPayload
}) {
  const uiStatus = toApiAttendanceStatus(input.payload.status)
  // UJAT bulk upsert 계약에는 증빙 fileObjectId 필드가 없다. 사유 문구만 전달한다.
  return bulkUpsertUjatAttendances(input.programId, {
    scheduleId: input.scheduleId,
    attendances: [
      {
        participantId: input.participantId,
        status: mapUjatUiAttendanceStatusToApi(uiStatus),
        absenceReason:
          input.payload.status === 'excused_absence' ? input.payload.reason.trim() || null : null,
        arrivalTime:
          input.payload.status === 'late' ? toIsoLocalTime(input.payload.attendanceTime) : null,
      },
    ],
  })
}
