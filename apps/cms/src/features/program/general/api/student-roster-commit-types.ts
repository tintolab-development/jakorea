import type { SchoolDetailStudentRow } from '@/features/program/general/model/school-detail-types'
import type { StudentRosterCommitRequest } from '@/shared/api/generated/dashboard/schemas/studentRosterCommitRequest'
import type { StudentRosterImportFileRequest } from '@/shared/api/generated/dashboard/schemas/studentRosterImportFileRequest'
import type { StudentRosterResponse } from '@/shared/api/generated/dashboard/schemas/studentRosterResponse'
import type { StudentRosterRowRequest } from '@/shared/api/generated/dashboard/schemas/studentRosterRowRequest'

/** GET `/student-roster` — 조회 전용 (응답을 PUT body로 재사용하지 않음) */
export type OrganizationStudentRosterResponse = StudentRosterResponse

/**
 * PUT row — 기존 행은 phone·email 생략 시 서버가 저장된 값을 유지한다.
 * 마스킹 값은 형식 검증에 걸리므로 보내지 않는다. 신규 행만 둘 다 필수.
 */
export type StudentRosterRowCommitPayload = StudentRosterRowRequest

/** 수동 편집·전체 교체 PUT — `expectedRevisionNo` + `rows`만 전송 */
export type OrganizationStudentRosterManualCommitRequest = Pick<
  StudentRosterCommitRequest,
  'expectedRevisionNo'
> & {
  rows: StudentRosterRowCommitPayload[]
}

/** Excel import POST — 관리자 업로드 파일 ID만 */
export type OrganizationStudentRosterImportRequest = StudentRosterImportFileRequest

/** 학생 명단 전체 교체 PUT 입력 — UI rows + 편집 세션 revision */
export type OrganizationStudentRosterCommitInput = {
  rows: SchoolDetailStudentRow[]
  expectedRevisionNo: number
}
