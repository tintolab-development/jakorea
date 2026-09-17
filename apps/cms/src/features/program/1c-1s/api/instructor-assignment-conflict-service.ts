/**
 * 1사1교 강사 배정 보드 데이터 — mock 없음 (API only)
 * fetch 본문은 general `instructor-assignment-board-service` 공유. 게이트만 1사1교.
 */

import {
  fetchInstructorAssignmentBoardData,
  findScheduleIdForLectureDate,
  type InstructorAssignmentBoardData,
} from '@/features/program/general/api/instructor-assignment-board-service'
import { shouldUseCompanySchoolApplicationsRemoteApi } from '@/features/program/1c-1s/api/capabilities'
import { shouldUseCompanySchoolProgramProgressRemoteApi } from '@/features/program/1c-1s/api/capabilities'

export type CompanySchoolAssignmentBoardData = InstructorAssignmentBoardData

function assertAssignmentRemoteReady(): void {
  if (
    shouldUseCompanySchoolProgramProgressRemoteApi() ||
    shouldUseCompanySchoolApplicationsRemoteApi()
  ) {
    return
  }
  throw new Error(
    '1사1교 강사 배정 API가 활성화되지 않았습니다. programs·applications·programProgress 모듈과 VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true, API 로그인을 확인해 주세요. mock 폴백은 없습니다.'
  )
}

export async function fetchCompanySchoolAssignmentBoard(
  programId: string
): Promise<CompanySchoolAssignmentBoardData> {
  assertAssignmentRemoteReady()
  return fetchInstructorAssignmentBoardData(programId)
}

/** @deprecated use fetchCompanySchoolAssignmentBoard */
export async function fetchCompanySchoolOccupiedLectureDates(
  programId: string
): Promise<Map<string, Set<string>>> {
  const board = await fetchCompanySchoolAssignmentBoard(programId)
  return board.occupiedLectureDatesByInstructorId
}

export { findScheduleIdForLectureDate }
