import { axiosClient } from '@/shared/api/axios-instance'

/*
 * 강사 마이페이지 > 강의 상세 > 배정 현황 탭 전용 포털 계약.
 *
 * TODO(codegen): BE OpenAPI에 아래 두 엔드포인트가 반영되면 생성 타입으로 교체한다.
 * 현재는 BE 계약(본문 래퍼 없음, items 항상 배열, 페이징 없음)을 기준으로 최소 수기 타입만 둔다.
 * - GET /api/portal/me/programs/{programId}/instructor-assignments
 * - GET /api/portal/me/programs/{programId}/instructor-assignment-waitings
 */

export type InstructorAssignmentRole = 'LEAD' | 'ASSISTANT'
export type InstructorAssignmentDistanceStatus = string
export type InstructorAssignmentWaitingStatus = 'WAITING' | 'UNAVAILABLE' | 'CANCELLED'
export type InstructorAssignmentUnavailableReason = 'SCHEDULE_CONFLICT' | 'CAPACITY_FULL'

export type InstructorAssignmentItem = {
  assignmentId: number
  /** 개인형은 null */
  organizationApplicationId: number | null
  scheduleId: number
  /** 개인형은 null */
  institutionName: string | null
  /** 실제 배정 학년 — 그룹 키 */
  grade: string | number | null
  /** 신청 희망 학년 — 그룹 키로 쓰지 않는다 */
  requestedGrade: string | number | null
  instructorRole: InstructorAssignmentRole | null
  /** 개인형은 null */
  institutionAddress: string | null
  /** 개인형 출강지 */
  scheduleLocation: string | null
  startAt: string | null
  endAt: string | null
  sessionNo: number | null
  scheduleName: string | null
  /** distanceStatus가 CALCULATED일 때만 값이 있다 */
  distanceKm: number | null
  distanceStatus: InstructorAssignmentDistanceStatus | null
}

export type InstructorAssignmentsResponse = {
  programId: number
  instructorMemberId: number
  items: InstructorAssignmentItem[]
}

export type InstructorAssignmentWaitingItem = {
  rowKey: string
  organizationApplicationId: number | null
  /** 제미나이는 null일 수 있다 */
  scheduleId: number | null
  educationPeriodIndex: number | null
  institutionName: string | null
  requestedGrade: string | number | null
  institutionAddress: string | null
  scheduleLocation: string | null
  distanceKm: number | null
  distanceStatus: InstructorAssignmentDistanceStatus | null
  startAt: string | null
  endAt: string | null
  sessionNo: number | null
  scheduleName: string | null
  dateRangeLabel: string | null
  status: InstructorAssignmentWaitingStatus
  unavailableReason: InstructorAssignmentUnavailableReason | null
}

export type InstructorAssignmentWaitingsResponse = {
  programId: number
  instructorMemberId: number
  items: InstructorAssignmentWaitingItem[]
}

export class InstructorAssignmentApiError extends Error {
  readonly response: { status: number; data: unknown }

  constructor(data: unknown, status = 200) {
    super('강사 배정 현황 API 응답을 처리할 수 없습니다.')
    this.name = 'InstructorAssignmentApiError'
    this.response = { status, data }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** 계약상 래퍼가 없다. 공통 `{ success, data }` 래퍼가 오면 data만 꺼낸다. */
function unwrapItemsBody<T extends { items: unknown[] }>(value: unknown): T {
  const body =
    isRecord(value) && 'success' in value
      ? value.success === true
        ? value.data
        : undefined
      : value
  if (!isRecord(body) || !Array.isArray(body.items)) {
    throw new InstructorAssignmentApiError(value)
  }
  return body as unknown as T
}

export async function getInstructorAssignments(
  programId: number,
  signal?: AbortSignal,
): Promise<InstructorAssignmentsResponse> {
  const { data } = await axiosClient.get(
    `/api/portal/me/programs/${programId}/instructor-assignments`,
    { signal },
  )
  return unwrapItemsBody<InstructorAssignmentsResponse>(data)
}

export async function getInstructorAssignmentWaitings(
  programId: number,
  signal?: AbortSignal,
): Promise<InstructorAssignmentWaitingsResponse> {
  const { data } = await axiosClient.get(
    `/api/portal/me/programs/${programId}/instructor-assignment-waitings`,
    { signal },
  )
  return unwrapItemsBody<InstructorAssignmentWaitingsResponse>(data)
}
