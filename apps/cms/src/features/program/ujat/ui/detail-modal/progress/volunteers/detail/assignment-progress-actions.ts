import type { QueryClient } from '@tanstack/react-query'
import { toIsoLocalTime } from '@/shared/lib/attendance-arrival-time'
import { getApiErrorCode } from '@/shared/lib/extract-api-error-message'
import type { ProgramAttendanceCorrectionConfirmPayload } from '@/features/program/shared/lib/attendance-correction-types'
import { mapUjatUiAttendanceStatusToApi } from '@/features/program/ujat/api/allocation-matrix-adapters'
import { UJAT_PARTNER_ASSIGNMENT_CONFLICT_CODE } from './assignment-cancel-errors'
import {
  bulkUpsertUjatAttendances,
  postUjatDirectAssignment,
  postUjatPartnerAssignmentCancel,
  postUjatPartnerAssignmentConfirm,
  putUjatAttendanceManager,
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
  reason?: string | null
  timing?: 'IMMEDIATE' | 'SCHEDULED' | null
  scheduledAt?: string | null
}) {
  // undefined 필드는 omit. 빈 문자열 placeholder 금지.
  const body: {
    reason?: string | null
    timing?: 'IMMEDIATE' | 'SCHEDULED' | null
    scheduledAt?: string | null
  } = {}
  if (input.reason !== undefined) {
    body.reason = input.reason?.trim() || null
  }
  if (input.timing !== undefined) {
    body.timing = input.timing
  }
  if (input.scheduledAt !== undefined) {
    body.scheduledAt = input.scheduledAt || null
  }

  return postUjatPartnerAssignmentCancel(
    input.programId,
    input.scheduleId,
    input.assignmentGroupId,
    body
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

  try {
    return await postUjatPartnerAssignmentConfirm(
      input.programId,
      input.scheduleId,
      buildVolunteerPartnerConfirmRequest(input)
    )
  } catch (error) {
    // 같은 조 재confirm은 200. 잔여 409는 invalidate로 SSOT를 맞춘다.
    if (getApiErrorCode(error) === UJAT_PARTNER_ASSIGNMENT_CONFLICT_CODE) {
      return {}
    }
    throw error
  }
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
  const fileObjectIds = (input.payload.evidenceFileObjectIds ?? []).filter(
    (id): id is number => Number.isInteger(id) && id > 0
  )
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
        ...(fileObjectIds.length > 0 ? { fileObjectIds } : {}),
      },
    ],
  })
}

/**
 * 봉사자 상세 역할 셀 → 출결 담당 지정/해제.
 * `attendance_manager`: `{ participantId: <id> }`
 * `none`(해당 없음): `{ participantId: null }` — 키 생략/skip 금지.
 */
export async function updateVolunteerScheduleRole(input: {
  programId: string
  scheduleId: number
  participantId: number
  role: 'attendance_manager' | 'none'
}) {
  return putUjatAttendanceManager(input.programId, input.scheduleId, {
    participantId: input.role === 'attendance_manager' ? input.participantId : null,
  })
}
