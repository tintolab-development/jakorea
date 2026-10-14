/**
 * 학생 명단 revision — GET/PUT expectedRevisionNo (동시 수정 충돌 방지)
 */

import type { SchoolDetailStudentRow } from '@/features/program/general/model/school-detail-types'

export const STUDENT_ROSTER_REVISION_CONFLICT = 'STUDENT_ROSTER_REVISION_CONFLICT'
export const STUDENT_ROSTER_MEMBER_ID_CONFLICT = 'STUDENT_ROSTER_MEMBER_ID_CONFLICT'

export const STUDENT_ROSTER_REVISION_CONFLICT_ALERT = {
  title: '학생 명단 변경 충돌',
  content:
    '다른 사용자가 학생명단을 변경했습니다. 최신 명단을 다시 불러온 후 저장해 주세요.',
} as const

export const STUDENT_ROSTER_INVALID_VALUE_ALERT = {
  title: '저장 실패',
  content:
    '학생 명단 저장 요청이 올바르지 않습니다. 수동 수정 시 파일 ID(sourceFileObjectId)가 포함되지 않았는지 확인해 주세요.',
} as const

export const STUDENT_ROSTER_MEMBER_ID_CONFLICT_ALERT = {
  title: '학생 회원 정보 확인 필요',
  content:
    '기존 학생의 회원 연결 정보가 일치하지 않아 저장할 수 없습니다. 학생 정보를 확인한 후 다시 시도해 주세요.',
} as const

export const STUDENT_ROSTER_REVISION_UNKNOWN_MESSAGE =
  '학생 명단 버전 정보를 확인할 수 없습니다. 목록을 다시 조회한 후 저장해 주세요.'

/** GET 응답 revisionNo — undefined/null은 미확정(0으로 추측하지 않음) */
export function parseStudentRosterRevisionNo(
  revisionNo: number | null | undefined
): number | null {
  if (revisionNo == null) return null
  if (!Number.isFinite(revisionNo)) return null
  if (!Number.isInteger(revisionNo)) return null
  if (revisionNo < 0) return null
  return revisionNo
}

export type StudentRosterRevisionValidationResult =
  | { ok: true; expectedRevisionNo: number }
  | { ok: false; message: string }

/** remote PUT 직전 — 편집 세션에 고정된 revision만 사용 */
export function validateStudentRosterExpectedRevisionNo(
  sessionRevisionNo: number | null | undefined
): StudentRosterRevisionValidationResult {
  const parsed = parseStudentRosterRevisionNo(sessionRevisionNo)
  if (parsed == null) {
    return { ok: false, message: STUDENT_ROSTER_REVISION_UNKNOWN_MESSAGE }
  }
  return { ok: true, expectedRevisionNo: parsed }
}

export type StudentRosterCommitSession = {
  organizationApplicationId: string
  expectedRevisionNo: number
  /** 학생 추가 시 PUT baseline — 편집 세션 진입 시점의 전체 명단 */
  baselineRows?: SchoolDetailStudentRow[]
}

function extractApiErrorPayload(error: unknown): Record<string, unknown> | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (!data || typeof data !== 'object') return undefined
  return data as Record<string, unknown>
}

export function extractStudentRosterApiErrorCode(error: unknown): string | undefined {
  const data = extractApiErrorPayload(error)
  if (!data) return undefined
  if (typeof data.error === 'object' && data.error && 'code' in data.error) {
    const nested = (data.error as { code?: unknown }).code
    if (typeof nested === 'string' && nested.trim()) return nested.trim()
  }
  if (typeof data.code === 'string' && data.code.trim()) return data.code.trim()
  return undefined
}

export function isStudentRosterRevisionConflictError(error: unknown): boolean {
  return extractStudentRosterApiErrorCode(error) === STUDENT_ROSTER_REVISION_CONFLICT
}

export function isStudentRosterMemberIdConflictError(error: unknown): boolean {
  return extractStudentRosterApiErrorCode(error) === STUDENT_ROSTER_MEMBER_ID_CONFLICT
}

export function isStudentRosterInvalidValueError(error: unknown): boolean {
  return extractStudentRosterApiErrorCode(error) === 'INVALID_VALUE'
}

export function resolveStudentRosterManualCommitFailureAlert(error: unknown): {
  title: string
  content: string
} {
  if (isStudentRosterInvalidValueError(error)) {
    return { ...STUDENT_ROSTER_INVALID_VALUE_ALERT }
  }
  return {
    title: '저장 실패',
    content: '학생 명단 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  }
}

export function resolveStudentRosterCommitErrorAlert(error: unknown): {
  title: string
  content: string
} | null {
  if (isStudentRosterRevisionConflictError(error)) {
    return { ...STUDENT_ROSTER_REVISION_CONFLICT_ALERT }
  }
  if (isStudentRosterMemberIdConflictError(error)) {
    return { ...STUDENT_ROSTER_MEMBER_ID_CONFLICT_ALERT }
  }
  return null
}
