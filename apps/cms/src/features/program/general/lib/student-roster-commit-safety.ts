/**
 * 학생 명단 전체 교체 PUT 전 FE 안전 검증
 */

import type { SchoolDetailStudentRow } from '@/features/program/general/model/school-detail-types'
import { validateStudentRosterExpectedRevisionNo } from '@/features/program/general/lib/student-roster-revision'
import type { StudentRosterCommitRequest } from '@/shared/api/generated/dashboard/schemas/studentRosterCommitRequest'

export const STUDENT_ROSTER_PUT_MAX_ROWS = 500

export type StudentRosterCommitValidationCode =
  | 'LOADING'
  | 'LOAD_ERROR'
  | 'INCOMPLETE_LOAD'
  | 'REVISION_UNKNOWN'
  | 'MAX_ROWS_EXCEEDED'
  | 'DUPLICATE_ROSTER_ID'
  | 'MISSING_EXISTING_ROSTER_ROW'
  | 'ROW_COUNT_MISMATCH'

export type StudentRosterCommitValidationResult =
  | { ok: true }
  | { ok: false; code: StudentRosterCommitValidationCode; message: string }

export function parsePositiveRosterId(rowId: string): number | null {
  const parsed = Number.parseInt(rowId, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

export function collectExistingRosterIds(rows: SchoolDetailStudentRow[]): number[] {
  return rows.map(row => parsePositiveRosterId(row.id)).filter((id): id is number => id != null)
}

export function validateStudentRosterCommit(input: {
  commitRows: SchoolDetailStudentRow[]
  baselineRows: SchoolDetailStudentRow[]
  totalCount?: number | null
  remoteEnabled: boolean
  isLoading?: boolean
  isError?: boolean
  /** 편집·추가 세션에 고정된 revision (GET 재조회로 바뀌지 않음) */
  expectedRevisionNo?: number | null
  /** 이 화면에서 학생 삭제를 허용하지 않으면 true */
  disallowExistingRowDrop?: boolean
}): StudentRosterCommitValidationResult {
  if (!input.remoteEnabled) {
    return { ok: true }
  }

  if (input.isLoading) {
    return {
      ok: false,
      code: 'LOADING',
      message: '학생 명단을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.',
    }
  }

  if (input.isError) {
    return {
      ok: false,
      code: 'LOAD_ERROR',
      message: '학생 명단을 불러오지 못했습니다. 목록을 다시 조회한 후 저장해 주세요.',
    }
  }

  const { commitRows, baselineRows, totalCount } = input
  const disallowDrop = input.disallowExistingRowDrop !== false

  const revisionCheck = validateStudentRosterExpectedRevisionNo(input.expectedRevisionNo)
  if (!revisionCheck.ok) {
    return {
      ok: false,
      code: 'REVISION_UNKNOWN',
      message: revisionCheck.message,
    }
  }

  if (commitRows.length > STUDENT_ROSTER_PUT_MAX_ROWS) {
    return {
      ok: false,
      code: 'MAX_ROWS_EXCEEDED',
      message: `학생 명단은 최대 ${STUDENT_ROSTER_PUT_MAX_ROWS}명까지 저장할 수 있습니다. API 계약 확장이 필요합니다.`,
    }
  }

  if (
    totalCount != null &&
    Number.isFinite(totalCount) &&
    totalCount > 0 &&
    baselineRows.length < totalCount
  ) {
    return {
      ok: false,
      code: 'INCOMPLETE_LOAD',
      message:
        '전체 학생 명단이 아직 모두 조회되지 않았습니다. 전체 교체 저장을 진행할 수 없습니다.',
    }
  }

  const commitExistingIds = collectExistingRosterIds(commitRows)
  const commitIdSet = new Set(commitExistingIds)
  if (commitIdSet.size !== commitExistingIds.length) {
    return {
      ok: false,
      code: 'DUPLICATE_ROSTER_ID',
      message: '학생 식별자(rosterId)가 중복되어 저장할 수 없습니다.',
    }
  }

  const baselineExistingIds = collectExistingRosterIds(baselineRows)

  if (disallowDrop) {
    for (const id of baselineExistingIds) {
      if (!commitIdSet.has(id)) {
        return {
          ok: false,
          code: 'MISSING_EXISTING_ROSTER_ROW',
          message:
            '저장 요청에 기존 학생이 누락되었습니다. 필터 상태와 관계없이 전체 명단이 포함되어야 합니다.',
        }
      }
    }

    if (commitRows.length < baselineRows.length) {
      return {
        ok: false,
        code: 'ROW_COUNT_MISMATCH',
        message: '저장 요청 학생 수가 조회된 전체 명단보다 적습니다.',
      }
    }
  }

  return { ok: true }
}

export function validateStudentRosterEditEntry(input: {
  remoteEnabled: boolean
  isLoading?: boolean
  isError?: boolean
  baselineRows: SchoolDetailStudentRow[]
  totalCount?: number | null
  revisionNo?: number | null
}): StudentRosterCommitValidationResult {
  if (!input.remoteEnabled) {
    return { ok: true }
  }

  if (input.isLoading) {
    return {
      ok: false,
      code: 'LOADING',
      message: '학생 명단을 불러오는 중입니다. 조회가 완료된 후 정보 수정을 시작해 주세요.',
    }
  }

  if (input.isError) {
    return {
      ok: false,
      code: 'LOAD_ERROR',
      message: '학생 명단을 불러오지 못했습니다. 다시 조회한 후 정보 수정을 시작해 주세요.',
    }
  }

  if (
    input.totalCount != null &&
    Number.isFinite(input.totalCount) &&
    input.totalCount > 0 &&
    input.baselineRows.length < input.totalCount
  ) {
    return {
      ok: false,
      code: 'INCOMPLETE_LOAD',
      message:
        '전체 학생 명단이 조회되지 않았습니다. 정보 수정을 시작할 수 없습니다.',
    }
  }

  const revisionCheck = validateStudentRosterExpectedRevisionNo(input.revisionNo)
  if (!revisionCheck.ok) {
    return {
      ok: false,
      code: 'REVISION_UNKNOWN',
      message: revisionCheck.message,
    }
  }

  return { ok: true }
}

/** 수동 편집 PUT body — 조회 응답의 `sourceFileObjectId`는 포함하지 않음 (import API 전용) */
export function buildStudentRosterCommitRequestBody(input: {
  rows: StudentRosterCommitRequest['rows']
  expectedRevisionNo: number
}): StudentRosterCommitRequest {
  return {
    rows: input.rows,
    expectedRevisionNo: input.expectedRevisionNo,
  }
}
