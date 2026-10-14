import type { SchoolDetailStudentRow } from '@/features/program/general/model/school-detail-types'
import type { StudentRosterCommitRequest } from '@/shared/api/generated/dashboard/schemas/studentRosterCommitRequest'
import type { StudentRosterImportFileRequest } from '@/shared/api/generated/dashboard/schemas/studentRosterImportFileRequest'
import type { StudentRosterResponse } from '@/shared/api/generated/dashboard/schemas/studentRosterResponse'

/** GET `/student-roster` — 조회 전용 (응답을 PUT body로 재사용하지 않음) */
export type OrganizationStudentRosterResponse = StudentRosterResponse

/** 수동 편집·전체 교체 PUT — `expectedRevisionNo` + `rows`만 전송 */
export type OrganizationStudentRosterManualCommitRequest = Pick<
  StudentRosterCommitRequest,
  'expectedRevisionNo' | 'rows'
>

/** Excel import POST — 관리자 업로드 파일 ID만 */
export type OrganizationStudentRosterImportRequest = StudentRosterImportFileRequest

/** 학생 명단 전체 교체 PUT 입력 — UI rows + 편집 세션 revision */
export type OrganizationStudentRosterCommitInput = {
  rows: SchoolDetailStudentRow[]
  expectedRevisionNo: number
}
