/**
 * UJAT 신청 기관 「임시 배정」 상태 변경 — 일정·학급 없이 상태만 TEMP_ASSIGNED / EVALUATION_PENDING.
 *
 * - POST …/ujat/organization-applications/temporary-assignments
 *   (operationId `assignTemporaryOrganizationApplications`)
 * - POST …/ujat/organization-applications/temporary-assignments:cancel
 *   (operationId `cancelTemporaryOrganizationAssignments`)
 *
 * 요청 JSON이 유효하면 일부 실패도 HTTP 200이다. 성공 건만 커밋되고 실패 건은 `failures[]`로 온다.
 * 일정·학급 저장은 기존 PUT temporary-schedule(「신청 기관 임시 배정」 탭)에 그대로 둔다.
 * `temporary-rejections:cancel`은 TEMP_REJECTED 전용이라 여기서 쓰지 않는다.
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { resolveRemoteIds } from '@/features/program/ujat/api/temporary-rejections'
import customInstance from '@/shared/api/orval-mutator'

// ── 로컬 타입 ────────────────────────────────────────────────────────────────
// OpenAPI 재생성 시 generated(`@/shared/api/generated/**`) 타입으로 교체한다.
// 이 API는 로컬 OpenAPI 스냅샷에 아직 없어 BE 프론트 계약 문서(2026-11-16) 기준으로 정의했다.

/** OpenAPI 재생성 시 generated `TemporaryAssignmentRequest`로 교체 */
export type TemporaryAssignmentRequest = {
  /** 1개 이상 100개 이하. 중복·null·0 이하는 요청 전체 400 */
  applicationIds: number[]
}

/** OpenAPI 재생성 시 generated `TemporaryAssignmentItem`으로 교체 */
export type TemporaryAssignmentItem = {
  applicationId: number
  /** 배정 성공 `TEMP_ASSIGNED`, 취소 성공 `EVALUATION_PENDING` */
  temporaryAssignmentStatus: string | null
  /** 배정 성공 `false`(일정 미배정), 취소 성공 `null` */
  temporaryScheduleAssigned: boolean | null
}

/** OpenAPI 재생성 시 generated `TemporaryAssignmentFailure`로 교체 */
export type TemporaryAssignmentFailure = {
  applicationId: number
  /** 분기는 code로만 한다. message는 그대로 화면에 보여 준다 */
  code: string
  message: string
}

/** OpenAPI 재생성 시 generated `TemporaryAssignmentBulkResponse`로 교체 */
export type TemporaryAssignmentBulkResponse = {
  requestedCount: number
  successCount: number
  failureCount: number
  processed: TemporaryAssignmentItem[]
  failures: TemporaryAssignmentFailure[]
}

/**
 * 기관 신청 목록·상세 응답의 추가 필드.
 * OpenAPI 재생성 시 generated 목록·상세 스키마의 `temporaryScheduleAssigned`로 교체한다.
 */
export type UjatTemporaryScheduleAssignedField = {
  /** TEMP_ASSIGNED일 때만 boolean. 일정 미배정/배정 완료 구분 SSOT */
  temporaryScheduleAssigned?: boolean | null
}

/** 응답 객체에서 `temporaryScheduleAssigned`만 읽는다. boolean이 아니면 null */
export function readTemporaryScheduleAssigned(source: unknown): boolean | null {
  if (!source || typeof source !== 'object') return null
  const value = (source as Record<string, unknown>).temporaryScheduleAssigned
  return typeof value === 'boolean' ? value : null
}

// ── 응답 정규화 ──────────────────────────────────────────────────────────────

function toFiniteNumber(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** 계약상 processed·failures는 항상 배열이지만, 누락 시 빈 배열로 읽는다(값을 지어내지 않는다). */
export function normalizeTemporaryAssignmentBulkResponse(
  raw: unknown
): TemporaryAssignmentBulkResponse {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const processed: TemporaryAssignmentItem[] = Array.isArray(source.processed)
    ? source.processed.flatMap(item => {
        if (!item || typeof item !== 'object') return []
        const record = item as Record<string, unknown>
        const applicationId = toFiniteNumber(record.applicationId)
        if (applicationId == null) return []
        return [
          {
            applicationId,
            temporaryAssignmentStatus:
              typeof record.temporaryAssignmentStatus === 'string'
                ? record.temporaryAssignmentStatus
                : null,
            temporaryScheduleAssigned:
              typeof record.temporaryScheduleAssigned === 'boolean'
                ? record.temporaryScheduleAssigned
                : null,
          },
        ]
      })
    : []
  const failures: TemporaryAssignmentFailure[] = Array.isArray(source.failures)
    ? source.failures.flatMap(item => {
        if (!item || typeof item !== 'object') return []
        const record = item as Record<string, unknown>
        const applicationId = toFiniteNumber(record.applicationId)
        if (applicationId == null) return []
        return [
          {
            applicationId,
            code: readString(record.code),
            message: readString(record.message),
          },
        ]
      })
    : []
  return {
    requestedCount: toFiniteNumber(source.requestedCount) ?? processed.length + failures.length,
    successCount: toFiniteNumber(source.successCount) ?? processed.length,
    failureCount: toFiniteNumber(source.failureCount) ?? failures.length,
    processed,
    failures,
  }
}

// ── 원격 호출 ────────────────────────────────────────────────────────────────

/** operationId `assignTemporaryOrganizationApplications` */
export async function assignTemporaryOrganizationApplicationsRemote(
  programId: number,
  body: TemporaryAssignmentRequest
): Promise<TemporaryAssignmentBulkResponse> {
  const response = unwrapApiBody<unknown>(
    await customInstance({
      url: `/api/admin/programs/${programId}/ujat/organization-applications/temporary-assignments`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { applicationIds: body.applicationIds },
    })
  )
  return normalizeTemporaryAssignmentBulkResponse(response)
}

/** operationId `cancelTemporaryOrganizationAssignments` */
export async function cancelTemporaryOrganizationAssignmentsRemote(
  programId: number,
  body: TemporaryAssignmentRequest
): Promise<TemporaryAssignmentBulkResponse> {
  const response = unwrapApiBody<unknown>(
    await customInstance({
      url: `/api/admin/programs/${programId}/ujat/organization-applications/temporary-assignments:cancel`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { applicationIds: body.applicationIds },
    })
  )
  return normalizeTemporaryAssignmentBulkResponse(response)
}

type TemporaryAssignmentInput = {
  programId?: string | number | null
  applicationIds: Array<string | number>
}

/** 평가 대기 → TEMP_ASSIGNED(일정 미배정). 원격 비활성이면 null */
export async function assignUjatOrganizationApplicationsTemporarilyIfRemote(
  input: TemporaryAssignmentInput
): Promise<TemporaryAssignmentBulkResponse | null> {
  const resolved = resolveRemoteIds(input)
  if (!resolved) return null
  return assignTemporaryOrganizationApplicationsRemote(resolved.programId, {
    applicationIds: resolved.applicationIds,
  })
}

/** 일정 없는 TEMP_ASSIGNED → EVALUATION_PENDING. 원격 비활성이면 null */
export async function cancelUjatOrganizationTemporaryAssignmentsIfRemote(
  input: TemporaryAssignmentInput
): Promise<TemporaryAssignmentBulkResponse | null> {
  const resolved = resolveRemoteIds(input)
  if (!resolved) return null
  return cancelTemporaryOrganizationAssignmentsRemote(resolved.programId, {
    applicationIds: resolved.applicationIds,
  })
}

// ── 화면 안내 ────────────────────────────────────────────────────────────────

/**
 * 건별 실패 안내 줄. `failures[].message`를 다시 만들지 않는다.
 * 목록 일괄(namesById 전달)은 어느 기관인지 알 수 있게 기관명을 앞에 붙인다(메시지 본문은 그대로).
 * 서버가 message를 비워 보낸 경우에만 fallback.
 */
export function buildTemporaryAssignmentFailureLines(
  failures: readonly TemporaryAssignmentFailure[],
  options: { namesById?: Readonly<Record<string, string>>; fallback: string }
): string[] {
  return failures.map(failure => {
    const message = failure.message.trim() || options.fallback
    const name = options.namesById?.[String(failure.applicationId)]?.trim()
    return name ? `· ${name}: ${message}` : message
  })
}

/** processed 항목 id(문자열) — 목록 행 id와 맞춘다 */
export function processedApplicationIds(response: TemporaryAssignmentBulkResponse): string[] {
  return response.processed.map(item => String(item.applicationId))
}
